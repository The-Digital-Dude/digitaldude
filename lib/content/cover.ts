/**
 * Cover images saved on older posts that point at files which were never added to /public/blog.
 * Mapped to the artwork that does exist, so the blog list, post page and social cards do not 404.
 */
const MOVED: Record<string, string> = {
  "/blog/ai-features-guide.jpg": "/blog/ai-features-real-vs-pitch.svg",
  "/blog/crm-switch-guide.jpg": "/blog/off-the-shelf-vs-custom-crm.svg",
};

export function fixCover(src: string | null | undefined): string | null {
  if (!src) return null;
  return MOVED[src] ?? src;
}
