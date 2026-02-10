'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-danger mb-4">
          Something went wrong
        </h1>
        <p className="text-gray-600 mb-8">{error.message}</p>
        <button onClick={reset} className="btn-blue">
          Try Again
        </button>
      </div>
    </div>
  );
}
