import Link from "next/link";

export default function NotFound() {
  return (
    <section className="mx-auto flex min-h-[70vh] max-w-content flex-col items-center justify-center px-6 pt-24 text-center">
      <h1 className="text-3xl font-bold text-navy sm:text-4xl">This page doesn&rsquo;t exist.</h1>
      <p className="mt-4 max-w-md text-navy/70">
        Maybe it moved, or maybe the link was wrong. Either way, here are some good places to go
        next.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <Link
          href="/"
          className="rounded-full bg-purple px-6 py-3 text-sm font-semibold text-white"
        >
          Go to the home page
        </Link>
        <Link
          href="/work"
          className="rounded-full border border-navy/20 px-6 py-3 text-sm font-semibold text-navy"
        >
          See our work
        </Link>
      </div>
    </section>
  );
}
