import { ShieldCheck } from "lucide-react";
import { formatPrice } from "@/utils/format";
import type { DepositStatus } from "@/utils/types";

const styles: Record<DepositStatus, string> = {
  NONE: "bg-muted text-muted-foreground",
  PENDING: "bg-sky-100 text-sky-800",
  HELD: "bg-amber-100 text-amber-800",
  REFUNDED: "bg-accent text-accent-foreground",
  PARTIALLY_REFUNDED: "bg-amber-100 text-amber-800",
  FORFEITED: "bg-red-100 text-red-700",
};

const labels: Record<DepositStatus, string> = {
  NONE: "No deposit",
  PENDING: "Deposit pending",
  HELD: "Deposit held",
  REFUNDED: "Deposit refunded",
  PARTIALLY_REFUNDED: "Deposit partially refunded",
  FORFEITED: "Deposit forfeited",
};

export function DepositBadge({ status }: { status: DepositStatus }) {
  if (status === "NONE") return null;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${styles[status]}`}
    >
      <ShieldCheck className="h-3 w-3" />
      {labels[status]}
    </span>
  );
}

/** Fuller card used on rental cards / history — shows the amount and outcome notes. */
export function DepositSummary({
  amount,
  status,
  refundAmount,
  notes,
}: {
  amount: number;
  status: DepositStatus;
  refundAmount?: number | null;
  notes?: string | null;
}) {
  if (status === "NONE" || !amount) return null;
  return (
    <div className="mt-2 rounded-lg border border-border bg-muted/50 px-3 py-2 text-xs">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 font-semibold text-foreground">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
          Security deposit: {formatPrice(amount)}
        </span>
        <DepositBadge status={status} />
      </div>
      {(status === "REFUNDED" || status === "PARTIALLY_REFUNDED" || status === "FORFEITED") && (
        <p className="mt-1.5 text-muted-foreground">
          {status === "FORFEITED"
            ? "Marked as forfeited by the owner."
            : `${formatPrice(refundAmount ?? 0)} marked as refunded.`}
          {notes ? ` — "${notes}"` : ""}
        </p>
      )}
    </div>
  );
}
