const ASSET_AVAILABILITY = {
  AVAILABLE: 'AVAILABLE',
  BOOKED: 'BOOKED',
  UNAVAILABLE: 'UNAVAILABLE',
};

const RENTAL_STATUS = {
  REQUESTED: 'REQUESTED',
  NEGOTIATING: 'NEGOTIATING',
  ACCEPTED: 'ACCEPTED',
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
};

const NOTIFICATION_TYPE = {
  REQUEST: 'REQUEST',
  COUNTER_OFFER: 'COUNTER_OFFER',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  DEPOSIT: 'DEPOSIT',
  WISHLIST: 'WISHLIST',
  MESSAGE: 'MESSAGE',
  DISPUTE: 'DISPUTE',
  GENERAL: 'GENERAL',
};

const CANCELLATION_POLICY = {
  FLEXIBLE: 'FLEXIBLE',
  MODERATE: 'MODERATE',
  STRICT: 'STRICT',
};

// Refund percentage the BORROWER is entitled to, keyed by policy and how many
// full days remain between "now" and the rental's start date at the moment
// of cancellation. LendLoop doesn't process real payments (no payment
// gateway is wired up), so this percentage is informational: it's recorded
// on the rental and shown to both parties as the platform's guidance for how
// they should settle up. Owner-initiated cancellations always fall back to
// a 100% refund to the borrower, regardless of policy or timing.
const CANCELLATION_REFUND_RULES = {
  FLEXIBLE: [
    { minDaysBefore: 1, refundPercent: 100 },
    { minDaysBefore: 0, refundPercent: 50 },
  ],
  MODERATE: [
    { minDaysBefore: 3, refundPercent: 100 },
    { minDaysBefore: 1, refundPercent: 50 },
    { minDaysBefore: 0, refundPercent: 0 },
  ],
  STRICT: [
    { minDaysBefore: 7, refundPercent: 100 },
    { minDaysBefore: 3, refundPercent: 50 },
    { minDaysBefore: 0, refundPercent: 0 },
  ],
};

const DEPOSIT_STATUS = {
  NONE: 'NONE',
  PENDING: 'PENDING',
  HELD: 'HELD',
  REFUNDED: 'REFUNDED',
  PARTIALLY_REFUNDED: 'PARTIALLY_REFUNDED',
  FORFEITED: 'FORFEITED',
};

module.exports = {
  ASSET_AVAILABILITY,
  RENTAL_STATUS,
  NOTIFICATION_TYPE,
  CANCELLATION_POLICY,
  CANCELLATION_REFUND_RULES,
  DEPOSIT_STATUS,
};
