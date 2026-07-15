import type { NotificationType } from "./types";

/**
 * Maps a notification type to the destination page and tab.
 *
 * REQUEST       → Requests → Received  (I am the owner — someone requested my item)
 * COUNTER_OFFER → Requests → Sent      (I am the borrower — owner countered)
 * ACCEPTED      → Requests → Sent      (I am the borrower — owner approved)
 * ACTIVE        → Requests → Sent      (I am the borrower — pickup confirmed)
 * REJECTED      → Rental history       (I am the borrower — request declined)
 * COMPLETED     → Rental history       (either party)
 * GENERAL       → null                 (no navigation)
 */
export function notificationRoute(type: NotificationType): {
  to: "/requests" | "/history";
  search?: { tab: "incoming" | "outgoing" };
} | null {
  switch (type) {
    case "REQUEST":
      return { to: "/requests", search: { tab: "incoming" } };
    case "COUNTER_OFFER":
    case "ACCEPTED":
    case "ACTIVE":
      return { to: "/requests", search: { tab: "outgoing" } };
    case "REJECTED":
    case "COMPLETED":
      return { to: "/history" };
    case "GENERAL":
    default:
      return null;
  }
}
