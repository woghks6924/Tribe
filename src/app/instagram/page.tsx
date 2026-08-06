import Image from "next/image";
import { ImageSlot } from "@/components/ui/image-slot";
import { getInstagramMedia } from "@/lib/instagram";

export default async function InstagramPage() {
  const posts = await getInstagramMedia(9);

  return (
    <div className="flex flex-col gap-10 px-6 py-16 md:px-14 md:py-20">
      <div className="flex flex-col gap-4 border-b border-line pb-8">
        <h1 className="font-sans text-2xl font-extrabold tracking-[0.02em] md:text-3xl">
          Follow the Tribe
        </h1>
        <p className="max-w-lg text-sm leading-relaxed text-ink-muted">
          {posts.length > 0
            ? "The latest from our Instagram — crew runs, drops, and behind-the-scenes."
            : "A live feed from our Instagram is coming soon. In the meantime, follow along for crew runs, drops, and behind-the-scenes."}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {posts.length > 0
          ? posts.map((post) => (
              <a
                key={post.id}
                href={post.permalink}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative block aspect-square overflow-hidden bg-base-elevated"
              >
                <Image
                  src={post.mediaType === "VIDEO" ? (post.thumbnailUrl ?? post.mediaUrl) : post.mediaUrl}
                  alt={post.caption?.slice(0, 100) ?? "Instagram post"}
                  fill
                  sizes="(min-width: 768px) 33vw, 50vw"
                  className="object-cover transition-opacity group-hover:opacity-90"
                />
              </a>
            ))
          : Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="relative aspect-square">
                <ImageSlot src={null} alt="Instagram post" placeholder="Coming soon" />
              </div>
            ))}
      </div>
    </div>
  );
}
