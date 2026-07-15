import { AlertTriangle } from "lucide-react";

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 py-14 text-center">
      <AlertTriangle className="h-9 w-9 text-destructive" />
      <h3 className="mt-1 font-semibold">Something went wrong</h3>
      <p className="max-w-md px-4 text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-outline mt-3 px-4 py-2 text-sm">
          Try again
        </button>
      )}
    </div>
  );
}
