import { Loader2 } from "lucide-react";

export function Loader({ label = "Loading…", full = false }: { label?: string; full?: boolean }) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 text-muted-foreground ${full ? "min-h-[60vh]" : "py-16"}`}
    >
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
