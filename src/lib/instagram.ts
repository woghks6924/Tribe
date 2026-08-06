export type InstagramPost = {
  id: string;
  caption?: string;
  mediaType: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  mediaUrl: string;
  thumbnailUrl?: string;
  permalink: string;
  timestamp: string;
};

const GRAPH_FIELDS =
  "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp";

/**
 * Fetches the connected Instagram professional account's own media via the
 * Instagram Graph API. Returns an empty array (never throws) when no token is
 * configured yet or the request fails, so the page can fall back to placeholders.
 */
export async function getInstagramMedia(limit = 9): Promise<InstagramPost[]> {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!accessToken) return [];

  try {
    const url = `https://graph.instagram.com/me/media?fields=${GRAPH_FIELDS}&limit=${limit}&access_token=${accessToken}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return [];

    const data = (await res.json()) as {
      data?: {
        id: string;
        caption?: string;
        media_type: InstagramPost["mediaType"];
        media_url: string;
        thumbnail_url?: string;
        permalink: string;
        timestamp: string;
      }[];
    };

    return (data.data ?? []).map((post) => ({
      id: post.id,
      caption: post.caption,
      mediaType: post.media_type,
      mediaUrl: post.media_url,
      thumbnailUrl: post.thumbnail_url,
      permalink: post.permalink,
      timestamp: post.timestamp,
    }));
  } catch {
    return [];
  }
}
