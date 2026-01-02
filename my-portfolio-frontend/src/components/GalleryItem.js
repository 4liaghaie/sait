import Image from "next/image";
import { withBase } from "@/lib/api";

const GalleryItem = ({ item }) => {
  const { Title, alt, image } = item;

  // Construct URL for the original image, or choose a specific format
  const imageUrl = image?.url
    ? (image.url.startsWith("http") ? image.url : withBase(image.url))
    : null;

  // Check if URL is external (from api.muhsinzade.com or other external domain)
  const isExternal = imageUrl?.startsWith("http") && 
    !imageUrl.includes("localhost") && 
    !imageUrl.includes("127.0.0.1");

  // Optionally, use a fallback if imageUrl is null
  if (!imageUrl) {
    return <div>No image available</div>;
  }

  return (
    <div className="border rounded-lg overflow-hidden shadow-lg">
      <div className="relative w-full aspect-[3/2]">
        <Image
          src={imageUrl}
          alt={alt || Title || "Gallery Image"}
          fill
          className="object-cover"
          sizes="(min-width: 1024px) 600px, 90vw"
          unoptimized={isExternal}
        />
      </div>
      <div className="p-4">
        <h2 className="text-2xl font-semibold">{Title}</h2>
      </div>
    </div>
  );
};

export default GalleryItem;
