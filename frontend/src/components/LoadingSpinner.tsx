import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: number;
  message?: string;
}

export default function LoadingSpinner({ size = 24, message }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-8">
      <Loader2 size={size} className="animate-spin text-[var(--color-primary)]" />
      {message && (
        <p className="text-sm text-[var(--color-text-secondary)]">{message}</p>
      )}
    </div>
  );
}
