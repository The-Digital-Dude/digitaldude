import { GET as getFeed } from "@/app/feed.xml/route";

export const revalidate = 3600;

export async function GET() {
  return getFeed();
}
