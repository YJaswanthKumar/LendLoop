---
name: Notification badge refresh pattern
description: How Navbar keeps its unread-notification badge current in LendLoop.
---

# Pattern
Two mechanisms keep the Navbar badge accurate without prop drilling or global state:

1. **Polling**: Navbar re-fetches unread count every 30 seconds via `setInterval`.
2. **Custom event**: When any page marks a notification as read, it dispatches `window.dispatchEvent(new CustomEvent("lendloop:notification-read"))`. Navbar listens for this event and immediately re-fetches unread count.

**Why:** Simple, zero-dependency coordination. No context changes needed. Pages just fire and forget the event.

**How to apply:** If a new feature can change the unread count (e.g., bulk mark-all-read), dispatch the same `lendloop:notification-read` event after the API call.
