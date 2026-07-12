const supabase = require('../config/supabase');
const { AppError } = require('../middleware/error.middleware');
const { getPagination, buildPaginationMeta, calculateTotalDays } = require('../utils/helpers');
const { RENTAL_STATUS, ASSET_AVAILABILITY, NOTIFICATION_TYPE } = require('../utils/constants');
const assetService = require('./asset.service');
const notificationService = require('./notification.service');

const CONTACT_VISIBLE_STATUSES = [
  RENTAL_STATUS.ACCEPTED,
  RENTAL_STATUS.ACTIVE,
  RENTAL_STATUS.COMPLETED,
];

async function fetchContacts(userIds) {
  if (!userIds.length) return {};
  const { data: users } = await supabase
    .from('users')
    .select('id, full_name, email, phone, city, state, latitude, longitude')
    .in('id', userIds);
  return Object.fromEntries((users || []).map((u) => [u.id, u]));
}

// Borrowers get the owner's full contact + pickup coordinates (they need to find the item).
// Owners only get the borrower's identity/contact info, not location (no pickup location to share).
function toOwnerContact(user) {
  if (!user) return null;
  const { id, full_name, email, phone, city, state, latitude, longitude } = user;
  return { id, full_name, email, phone, city, state, latitude, longitude };
}

function toBorrowerContact(user) {
  if (!user) return null;
  const { id, full_name, email, phone, city, state } = user;
  return { id, full_name, email, phone, city, state };
}

async function attachContacts(rentals) {
  const eligible = rentals.filter((r) => CONTACT_VISIBLE_STATUSES.includes(r.status));
  if (!eligible.length) return rentals;

  const userIds = [...new Set(eligible.flatMap((r) => [r.owner_id, r.borrower_id]))];
  const userMap = await fetchContacts(userIds);

  return rentals.map((r) => {
    if (!CONTACT_VISIBLE_STATUSES.includes(r.status)) return r;
    return {
      ...r,
      owner_contact: toOwnerContact(userMap[r.owner_id]),
      borrower_contact: toBorrowerContact(userMap[r.borrower_id]),
    };
  });
}

async function getRentalById(id) {
  const { data: rental, error } = await supabase.from('rentals').select('*').eq('id', id).maybeSingle();

  if (error) {
    throw new AppError('Failed to fetch rental', 500);
  }
  if (!rental) {
    throw new AppError('Rental not found', 404);
  }

  return rental;
}

async function getRentalDetails(id, userId) {
  const rental = await getRentalById(id);
  assertParticipant(rental, userId);
  const [enriched] = await attachContacts([rental]);
  return enriched;
}

function assertParticipant(rental, userId) {
  if (rental.owner_id !== userId && rental.borrower_id !== userId) {
    throw new AppError('You are not authorized to access this rental', 403);
  }
}

async function createRentalRequest(borrowerId, payload) {
  const { assetId, startDate, endDate, offeredPrice, borrowerMessage } = payload;

  const asset = await assetService.getAssetById(assetId);

  if (asset.owner_id === borrowerId) {
    throw new AppError('You cannot rent your own asset', 400);
  }
  if (!asset.is_active || asset.availability_status !== ASSET_AVAILABILITY.AVAILABLE) {
    throw new AppError('This asset is not currently available for rent', 400);
  }

  const totalDays = calculateTotalDays(startDate, endDate);
  const expectedPrice = Number(asset.expected_price_per_day) * totalDays;

  const { data: rental, error } = await supabase
    .from('rentals')
    .insert({
      asset_id: assetId,
      owner_id: asset.owner_id,
      borrower_id: borrowerId,
      start_date: startDate,
      end_date: endDate,
      total_days: totalDays,
      expected_price: expectedPrice,
      offered_price: offeredPrice,
      security_deposit: asset.security_deposit || 0,
      borrower_message: borrowerMessage || null,
      status: RENTAL_STATUS.REQUESTED,
    })
    .select()
    .single();

  if (error) {
    throw new AppError('Failed to create rental request', 500);
  }

  await notificationService.createNotification({
    userId: asset.owner_id,
    title: 'New Rental Request',
    message: `You have a new rental request for "${asset.title}".`,
    type: NOTIFICATION_TYPE.REQUEST,
  });

  return rental;
}

async function counterOffer(id, ownerId, payload) {
  const { counterOfferPrice, ownerMessage } = payload;
  const rental = await getRentalById(id);

  if (rental.owner_id !== ownerId) {
    throw new AppError('You are not authorized to counter offer on this rental', 403);
  }
  if (![RENTAL_STATUS.REQUESTED, RENTAL_STATUS.NEGOTIATING].includes(rental.status)) {
    throw new AppError(`Cannot counter offer on a rental with status ${rental.status}`, 400);
  }

  const asset = await assetService.getAssetById(rental.asset_id);
  if (!asset.price_negotiable) {
    throw new AppError('This asset does not allow price negotiation', 400);
  }

  const { data: updated, error } = await supabase
    .from('rentals')
    .update({
      counter_offer_price: counterOfferPrice,
      owner_message: ownerMessage || rental.owner_message,
      status: RENTAL_STATUS.NEGOTIATING,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new AppError('Failed to submit counter offer', 500);
  }

  await notificationService.createNotification({
    userId: rental.borrower_id,
    title: 'Counter Offer Received',
    message: `The owner sent a counter offer for your rental request.`,
    type: NOTIFICATION_TYPE.COUNTER_OFFER,
  });

  return updated;
}

async function acceptOffer(id, userId, payload) {
  const rental = await getRentalById(id);
  assertParticipant(rental, userId);

  if (![RENTAL_STATUS.REQUESTED, RENTAL_STATUS.NEGOTIATING].includes(rental.status)) {
    throw new AppError(`Cannot accept a rental with status ${rental.status}`, 400);
  }

  const agreedPrice = payload.agreedPrice ?? rental.counter_offer_price ?? rental.offered_price;

  const { data: updated, error } = await supabase
    .from('rentals')
    .update({
      agreed_price: agreedPrice,
      status: RENTAL_STATUS.ACCEPTED,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new AppError('Failed to accept rental offer', 500);
  }

  await supabase
    .from('assets')
    .update({ availability_status: ASSET_AVAILABILITY.BOOKED, updated_at: new Date().toISOString() })
    .eq('id', rental.asset_id);

  const notifyUserId = userId === rental.owner_id ? rental.borrower_id : rental.owner_id;
  await notificationService.createNotification({
    userId: notifyUserId,
    title: 'Rental Offer Accepted',
    message: 'Your rental offer has been accepted.',
    type: NOTIFICATION_TYPE.ACCEPTED,
  });

  return updated;
}

async function rejectOffer(id, userId) {
  const rental = await getRentalById(id);
  assertParticipant(rental, userId);

  if ([RENTAL_STATUS.COMPLETED, RENTAL_STATUS.CANCELLED, RENTAL_STATUS.REJECTED].includes(rental.status)) {
    throw new AppError(`Cannot reject a rental with status ${rental.status}`, 400);
  }

  const { data: updated, error } = await supabase
    .from('rentals')
    .update({ status: RENTAL_STATUS.REJECTED, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new AppError('Failed to reject rental', 500);
  }

  const notifyUserId = userId === rental.owner_id ? rental.borrower_id : rental.owner_id;
  await notificationService.createNotification({
    userId: notifyUserId,
    title: 'Rental Offer Rejected',
    message: 'A rental offer was rejected.',
    type: NOTIFICATION_TYPE.REJECTED,
  });

  return updated;
}

async function cancelRental(id, userId) {
  const rental = await getRentalById(id);
  assertParticipant(rental, userId);

  if ([RENTAL_STATUS.COMPLETED, RENTAL_STATUS.CANCELLED, RENTAL_STATUS.REJECTED].includes(rental.status)) {
    throw new AppError(`Cannot cancel a rental with status ${rental.status}`, 400);
  }
  if (rental.status === RENTAL_STATUS.ACTIVE) {
    throw new AppError('Cannot cancel a rental that is already active', 400);
  }

  const { data: updated, error } = await supabase
    .from('rentals')
    .update({ status: RENTAL_STATUS.CANCELLED, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new AppError('Failed to cancel rental', 500);
  }

  if (rental.status === RENTAL_STATUS.ACCEPTED) {
    await supabase
      .from('assets')
      .update({ availability_status: ASSET_AVAILABILITY.AVAILABLE, updated_at: new Date().toISOString() })
      .eq('id', rental.asset_id);
  }

  const notifyUserId = userId === rental.owner_id ? rental.borrower_id : rental.owner_id;
  await notificationService.createNotification({
    userId: notifyUserId,
    title: 'Rental Cancelled',
    message: 'A rental was cancelled.',
    type: NOTIFICATION_TYPE.GENERAL,
  });

  return updated;
}

async function completeRental(id, userId) {
  const rental = await getRentalById(id);
  assertParticipant(rental, userId);

  if (![RENTAL_STATUS.ACCEPTED, RENTAL_STATUS.ACTIVE].includes(rental.status)) {
    throw new AppError(`Cannot complete a rental with status ${rental.status}`, 400);
  }

  const { data: updated, error } = await supabase
    .from('rentals')
    .update({ status: RENTAL_STATUS.COMPLETED, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new AppError('Failed to complete rental', 500);
  }

  // Free up the asset and bump its usage counter
  const { data: asset } = await supabase.from('assets').select('usage_count').eq('id', rental.asset_id).maybeSingle();
  await supabase
    .from('assets')
    .update({
      availability_status: ASSET_AVAILABILITY.AVAILABLE,
      usage_count: (asset?.usage_count || 0) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', rental.asset_id);

  // Update owner/borrower completed rental counters
  const { data: owner } = await supabase.from('users').select('rentals_completed').eq('id', rental.owner_id).maybeSingle();
  if (owner) {
    await supabase
      .from('users')
      .update({ rentals_completed: (owner.rentals_completed || 0) + 1, updated_at: new Date().toISOString() })
      .eq('id', rental.owner_id);
  }

  const { data: borrower } = await supabase.from('users').select('rentals_taken').eq('id', rental.borrower_id).maybeSingle();
  if (borrower) {
    await supabase
      .from('users')
      .update({ rentals_taken: (borrower.rentals_taken || 0) + 1, updated_at: new Date().toISOString() })
      .eq('id', rental.borrower_id);
  }

  const notifyUserId = userId === rental.owner_id ? rental.borrower_id : rental.owner_id;
  await notificationService.createNotification({
    userId: notifyUserId,
    title: 'Rental Completed',
    message: 'A rental has been marked as completed.',
    type: NOTIFICATION_TYPE.COMPLETED,
  });

  return updated;
}

async function getRentalHistory(userId, query) {
  const { page, limit, from, to } = getPagination(query);
  const { role, status } = query;

  let builder = supabase.from('rentals').select('*', { count: 'exact' });

  if (role === 'owner') {
    builder = builder.eq('owner_id', userId);
  } else if (role === 'borrower') {
    builder = builder.eq('borrower_id', userId);
  } else {
    builder = builder.or(`owner_id.eq.${userId},borrower_id.eq.${userId}`);
  }

  if (status) builder = builder.eq('status', status);

  const { data, error, count } = await builder.order('created_at', { ascending: false }).range(from, to);

  if (error) {
    throw new AppError('Failed to fetch rental history', 500);
  }

  const rentals = await attachContacts(data || []);

  return { rentals, pagination: buildPaginationMeta(page, limit, count) };
}

module.exports = {
  getRentalById,
  getRentalDetails,
  createRentalRequest,
  counterOffer,
  acceptOffer,
  rejectOffer,
  cancelRental,
  completeRental,
  getRentalHistory,
};
