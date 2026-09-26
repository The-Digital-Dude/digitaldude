'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-navy text-white flex min-h-screen flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
        <p className="text-white/70 mb-6 max-w-md">
          An unexpected error occurred. Please try reloading the page.
        </p>
        <button
          onClick={() => reset()}
          className="rounded-full bg-purple px-6 py-3 font-semibold text-white transition hover:brightness-110"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
