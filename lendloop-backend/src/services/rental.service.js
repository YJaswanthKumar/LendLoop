const supabase = require('../config/supabase');
const { AppError } = require('../middleware/error.middleware');
const {
  getPagination,
  buildPaginationMeta,
  calculateTotalDays,
  calculateCancellationRefund,
} = require('../utils/helpers');
const {
  RENTAL_STATUS,
  ASSET_AVAILABILITY,
  NOTIFICATION_TYPE,
  CANCELLATION_REFUND_RULES,
  DEPOSIT_STATUS,
} = require('../utils/constants');
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

  // Snapshot the policy and deposit amount at request time — if the owner
  // edits the listing later, rentals already in flight keep the terms the
  // borrower originally agreed to.
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
      cancellation_policy: asset.cancellation_policy || 'MODERATE',
      deposit_status: asset.security_deposit > 0 ? DEPOSIT_STATUS.PENDING : DEPOSIT_STATUS.NONE,
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
      deposit_status:
        rental.deposit_status === DEPOSIT_STATUS.PENDING ? DEPOSIT_STATUS.HELD : rental.deposit_status,
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

async function cancelRental(id, userId, payload = {}) {
  const rental = await getRentalById(id);
  assertParticipant(rental, userId);

  if ([RENTAL_STATUS.COMPLETED, RENTAL_STATUS.CANCELLED, RENTAL_STATUS.REJECTED].includes(rental.status)) {
    throw new AppError(`Cannot cancel a rental with status ${rental.status}`, 400);
  }
  if (rental.status === RENTAL_STATUS.ACTIVE) {
    throw new AppError('Cannot cancel a rental that is already active', 400);
  }

  const cancelledByOwner = userId === rental.owner_id;
  const price = rental.agreed_price ?? rental.counter_offer_price ?? rental.offered_price ?? rental.expected_price;

  const { refundAmount } = calculateCancellationRefund({
    policy: rental.cancellation_policy || 'MODERATE',
    startDate: rental.start_date,
    price,
    cancelledByOwner,
    rules: CANCELLATION_REFUND_RULES,
  });

  // A deposit can only be HELD once the booking is ACCEPTED — since cancel is
  // never allowed once a rental goes ACTIVE, any held deposit here is
  // refunded in full: the rental never actually took place.
  const depositWasHeld = rental.deposit_status === DEPOSIT_STATUS.HELD;

  const updatePayload = {
    status: RENTAL_STATUS.CANCELLED,
    cancelled_by: userId,
    cancellation_reason: payload.reason || null,
    refund_amount: refundAmount,
    cancelled_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (depositWasHeld) {
    updatePayload.deposit_status = DEPOSIT_STATUS.REFUNDED;
    updatePayload.deposit_refund_amount = rental.security_deposit || 0;
    updatePayload.deposit_resolved_at = new Date().toISOString();
    updatePayload.deposit_notes = 'Automatically refunded — rental was cancelled before pickup.';
  }

  const { data: updated, error } = await supabase
    .from('rentals')
    .update(updatePayload)
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
    message:
      refundAmount > 0
        ? `A rental was cancelled. Recommended refund: ₹${refundAmount}.`
        : 'A rental was cancelled.',
    type: NOTIFICATION_TYPE.CANCELLED,
  });

  return updated;
}

// Owner resolves what happens to a held deposit once a rental has completed.
async function resolveDeposit(id, ownerId, payload) {
  const { status, refundAmount, notes } = payload;
  const rental = await getRentalById(id);

  if (rental.owner_id !== ownerId) {
    throw new AppError('Only the owner can resolve the security deposit', 403);
  }
  if (rental.status !== RENTAL_STATUS.COMPLETED) {
    throw new AppError('The deposit can only be resolved once the rental is completed', 400);
  }
  if (rental.deposit_status !== DEPOSIT_STATUS.HELD) {
    throw new AppError(`No held deposit to resolve (current status: ${rental.deposit_status})`, 400);
  }
  if (![DEPOSIT_STATUS.REFUNDED, DEPOSIT_STATUS.PARTIALLY_REFUNDED, DEPOSIT_STATUS.FORFEITED].includes(status)) {
    throw new AppError('Invalid deposit resolution status', 400);
  }

  const deposit = Number(rental.security_deposit) || 0;
  let finalRefundAmount = 0;
  if (status === DEPOSIT_STATUS.REFUNDED) finalRefundAmount = deposit;
  else if (status === DEPOSIT_STATUS.FORFEITED) finalRefundAmount = 0;
  else if (status === DEPOSIT_STATUS.PARTIALLY_REFUNDED) {
    if (refundAmount == null || refundAmount < 0 || refundAmount > deposit) {
      throw new AppError(`refundAmount must be between 0 and the deposit amount (₹${deposit})`, 400);
    }
    finalRefundAmount = refundAmount;
  }

  const { data: updated, error } = await supabase
    .from('rentals')
    .update({
      deposit_status: status,
      deposit_refund_amount: finalRefundAmount,
      deposit_notes: notes || null,
      deposit_resolved_at: new Date().toISOString(),
      deposit_resolved_by: ownerId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new AppError('Failed to resolve deposit', 500);
  }

  const messages = {
    [DEPOSIT_STATUS.REFUNDED]: `Your full deposit of ₹${deposit} has been marked as refunded.`,
    [DEPOSIT_STATUS.PARTIALLY_REFUNDED]: `₹${finalRefundAmount} of your ₹${deposit} deposit has been marked as refunded.`,
    [DEPOSIT_STATUS.FORFEITED]: `Your deposit of ₹${deposit} has been marked as forfeited.`,
  };

  await notificationService.createNotification({
    userId: rental.borrower_id,
    title: 'Security Deposit Resolved',
    message: messages[status],
    type: NOTIFICATION_TYPE.DEPOSIT,
  });

  return updated;
}

async function startRental(id, userId) {
  const rental = await getRentalById(id);

  if (rental.owner_id !== userId) {
    throw new AppError('Only the owner can confirm pickup and start this rental', 403);
  }
  if (rental.status !== RENTAL_STATUS.ACCEPTED) {
    throw new AppError(`Cannot start a rental with status ${rental.status}`, 400);
  }

  const { data: updated, error } = await supabase
    .from('rentals')
    .update({ status: RENTAL_STATUS.ACTIVE, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new AppError('Failed to start rental', 500);
  }

  await notificationService.createNotification({
    userId: rental.borrower_id,
    title: 'Rental Started',
    message: 'The owner confirmed pickup — your rental is now active.',
    type: NOTIFICATION_TYPE.ACTIVE,
  });

  return updated;
}

async function completeRental(id, userId) {
  const rental = await getRentalById(id);
  assertParticipant(rental, userId);

  if (rental.status !== RENTAL_STATUS.ACTIVE) {
    throw new AppError(
      rental.status === RENTAL_STATUS.ACCEPTED
        ? 'Confirm pickup to start the rental before marking it complete'
        : `Cannot complete a rental with status ${rental.status}`,
      400,
    );
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
  resolveDeposit,
  startRental,
  completeRental,
  getRentalHistory,
};
