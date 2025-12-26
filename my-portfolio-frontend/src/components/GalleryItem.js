import Image from "next/image";
import { withBase } from "@/lib/api";

const GalleryItem = ({ item }) => {
  const { Title, alt, image } = item;

  // Construct URL for the original image, or choose a specific format
  const imageUrl = image?.url ? withBase(image.url) : null;

  // Optionally, use a fallback if imageUrl is null
  if (!imageUrl) {
    return <div>No image available</div>;
  }

  return (
    <div className="border rounded-lg overflow-hidden shadow-lg">
      <Image
        src={imageUrl}
        alt={alt || Title || "Gallery Image"}
        width={600}
        height={400}
        layout="responsive"
      />
      <div className="p-4">
        <h2 className="text-2xl font-semibold">{Title}</h2>
      </div>
    </div>
  );
};

export default GalleryItem;
