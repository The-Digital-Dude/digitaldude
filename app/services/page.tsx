import type { Metadata } from "next";
import { buildMetadata } from "@/lib/content/seo";
import { services } from "@/lib/content/services";
import { ServiceCard } from "@/components/ServiceCard";

export const metadata: Metadata = buildMetadata("services", "/services");

export default function ServicesPage() {
  return (
    <section className="mx-auto max-w-content px-6 pb-20 pt-32 sm:pt-40">
      <h1 className="max-w-2xl text-3xl font-bold text-navy sm:text-4xl">
        Custom systems for businesses that have outgrown their tools
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-navy/70">
        We build software around how your business actually runs. Whether it&rsquo;s a CRM for
        your sales team, a platform you sell to customers, or an app that connects your staff in
        the field, one team handles it from scoping to launch.
      </p>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <ServiceCard key={service.slug} service={service} />
        ))}
      </div>

      <p className="mt-12 text-center text-navy/70">
        Not sure which one you need? That&rsquo;s what the first call is for.
      </p>
    </section>
  );
}
