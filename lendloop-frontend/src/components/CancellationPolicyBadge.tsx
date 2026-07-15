import { Info, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { CANCELLATION_POLICY_DESCRIPTIONS, CANCELLATION_POLICY_LABELS } from "@/utils/cancellationPolicy";
import type { CancellationPolicy } from "@/utils/types";

const styles: Record<CancellationPolicy, string> = {
  FLEXIBLE: "bg-accent text-accent-foreground",
  MODERATE: "bg-amber-100 text-amber-800",
  STRICT: "bg-red-100 text-red-700",
};

/** Small pill badge — use inline wherever space is tight (cards, lists). */
export function CancellationPolicyBadge({ policy }: { policy: CancellationPolicy }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${styles[policy]}`}
    >
      <ShieldAlert className="h-3 w-3" />
      {CANCELLATION_POLICY_LABELS[policy]} cancellation
    </span>
  );
}

/** Full explanatory block — use on asset detail pages and booking modals. */
export function CancellationPolicyInfo({ policy }: { policy: CancellationPolicy }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="rounded-xl border border-border bg-muted/40 px-3.5 py-3 text-sm">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <span className="flex items-center gap-2 font-semibold">
          <ShieldAlert className="h-4 w-4 shrink-0 text-muted-foreground" />
          {CANCELLATION_POLICY_LABELS[policy]} cancellation policy
        </span>
        <Info className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      </button>
      {expanded && (
        <p className="mt-2 text-xs text-muted-foreground">{CANCELLATION_POLICY_DESCRIPTIONS[policy]}</p>
      )}
    </div>
  );
}
