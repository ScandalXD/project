import { API_ORIGIN } from "./apiOrigin";

export function getImageUrl(image?: string | null): string {
  if (!image) {
    return "";
  }

  if (image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }

  if (image.startsWith("blob:") || image.startsWith("data:")) {
    return image;
  }

  if (image.startsWith("/")) {
    return `${API_ORIGIN}${image}`;
  }

  return `${API_ORIGIN}/uploads/catalog/${image}`;
}
