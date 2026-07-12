import type { AvailabilityStatus, RentalStatus } from "@/utils/types";

const styles: Record<string, string> = {
  AVAILABLE: "bg-accent text-accent-foreground",
  BOOKED: "bg-amber-100 text-amber-800",
  UNAVAILABLE: "bg-muted text-muted-foreground",
  REQUESTED: "bg-sky-100 text-sky-800",
  NEGOTIATING: "bg-amber-100 text-amber-800",
  ACCEPTED: "bg-accent text-accent-foreground",
  ACTIVE: "bg-accent text-accent-foreground",
  COMPLETED: "bg-muted text-muted-foreground",
  REJECTED: "bg-red-100 text-red-700",
  CANCELLED: "bg-muted text-muted-foreground",
};

export function StatusBadge({ status }: { status: AvailabilityStatus | RentalStatus | string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${styles[status] ?? "bg-muted text-muted-foreground"}`}
    >
      {status.toLowerCase().replace("_", " ")}
    </span>
  );
}
