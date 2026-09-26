import Link from "next/link";

export function StandardCTA() {
  return (
    <section className="bg-navy text-white">
      <div className="mx-auto max-w-content px-6 py-16 text-center sm:py-20">
        <h2 className="text-2xl font-bold sm:text-3xl">
          Let&rsquo;s look at how your business runs today.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-white/80">
          A 30-minute call with our founder. No pitch. Just where things get stuck and whether a
          system would fix it.
        </p>
        <Link
          href="/contact"
          className="mt-8 inline-block rounded-full bg-purple px-8 py-3 font-semibold text-white transition hover:brightness-110"
        >
          Book a 30-minute call
        </Link>
      </div>
    </section>
  );
}
