const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const getDefaultApiOrigin = () => {
  if (typeof window === "undefined") {
    return "http://localhost:3000";
  }

  const { hostname, protocol } = window.location;

  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return "http://localhost:3000";
  }

  return `${protocol}//${hostname}:3000`;
};

export const API_ORIGIN = trimTrailingSlash(
  import.meta.env.VITE_API_ORIGIN || getDefaultApiOrigin(),
);

export const API_BASE_URL = `${API_ORIGIN}/api`;
