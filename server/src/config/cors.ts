import "dotenv/config";

const DEFAULT_CLIENT_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

const getEnvOrigins = () =>
  (process.env.CLIENT_URLS || process.env.CLIENT_URL || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

export const allowedClientOrigins = Array.from(
  new Set([...DEFAULT_CLIENT_ORIGINS, ...getEnvOrigins()]),
);

export const isClientOriginAllowed = (origin?: string) => {
  if (!origin) {
    return true;
  }

  return allowedClientOrigins.some((allowedOrigin) => {
    if (allowedOrigin.startsWith(".")) {
      try {
        return new URL(origin).hostname.endsWith(allowedOrigin);
      } catch {
        return false;
      }
    }

    return allowedOrigin === origin;
  });
};

export const corsOptions = {
  origin: (
    origin: string | undefined,
    callback: (error: Error | null, allow?: boolean) => void,
  ) => {
    if (isClientOriginAllowed(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
};
