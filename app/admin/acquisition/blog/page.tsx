import { PageHeader } from "@/components/acquisition/ui";
import { BlogAutomation } from "@/components/acquisition/BlogAutomation";

export const dynamic = "force-dynamic";

export default function BlogAutomationPage() {
  return (
    <>
      <PageHeader title="Blog automation" subtitle="Writes and publishes one blog post each weekday from the topic queue, using your configured AI model and a strict fact sheet. Every post must pass an automatic quality check first. Preview a post before switching it on." />
      <BlogAutomation />
    </>
  );
}
