import { AlertCircle } from 'lucide-react';

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export default function ErrorMessage({ title = 'Error', message, onRetry }: ErrorMessageProps) {
  return (
    <div className="card border-[var(--color-error)] bg-red-50 p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="text-[var(--color-error)] mt-0.5 shrink-0" size={20} />
        <div className="flex-1">
          <h3 className="font-semibold text-[var(--color-error)]">{title}</h3>
          <p className="text-sm text-gray-700 mt-1">{message}</p>
          {onRetry && (
            <button onClick={onRetry} className="btn-outline mt-3 text-sm">
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
