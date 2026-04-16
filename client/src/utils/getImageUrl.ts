export function getImageUrl(image?: string | null): string {
  if (!image) {
    return "";
  }

  if (image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }

  if (image.startsWith("/")) {
    return `http://localhost:3000${image}`;
  }

  return `http://localhost:3000/uploads/catalog/${image}`;
}