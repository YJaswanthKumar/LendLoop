import type { LucideIcon } from "lucide-react";

export function StatCard({
  icon: Icon,
  label,
  value,
  tone = "default",
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  tone?: "default" | "primary" | "warning" | "danger";
}) {
  const toneStyles: Record<string, string> = {
    default: "bg-muted text-foreground",
    primary: "bg-primary text-primary-foreground",
    warning: "bg-amber-100 text-amber-800",
    danger: "bg-red-100 text-red-700",
  };

  return (
    <div className="card-elevated p-4">
      <div className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${toneStyles[tone]}`}>
        <Icon className="h-4.5 w-4.5" />
      </div>
      <p className="mt-3 text-2xl font-extrabold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
