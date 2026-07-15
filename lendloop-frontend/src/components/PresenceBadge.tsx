import type { Presence } from "@/utils/types";

const styles: Record<Presence, string> = {
  ONLINE: "bg-emerald-100 text-emerald-700",
  RECENTLY_ACTIVE: "bg-amber-100 text-amber-800",
  OFFLINE: "bg-muted text-muted-foreground",
};

const dotStyles: Record<Presence, string> = {
  ONLINE: "bg-emerald-500",
  RECENTLY_ACTIVE: "bg-amber-500",
  OFFLINE: "bg-muted-foreground/40",
};

const labels: Record<Presence, string> = {
  ONLINE: "Online",
  RECENTLY_ACTIVE: "Recently active",
  OFFLINE: "Offline",
};

export function PresenceBadge({ presence }: { presence: Presence }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${styles[presence]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotStyles[presence]}`} />
      {labels[presence]}
    </span>
  );
}
