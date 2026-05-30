import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = path.join(__dirname, "../../uploads/chat");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = path
      .basename(file.originalname, ext)
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9-_]/g, "")
      .toLowerCase();

    cb(null, `${name || "attachment"}-${Date.now()}${ext}`);
  },
});

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "text/plain",
  "application/zip",
  "application/x-zip-compressed",
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/webm",
  "audio/ogg",
  "audio/mp4",
]);

export const uploadChatAttachment = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      return cb(new Error("Unsupported chat attachment type"));
    }

    cb(null, true);
  },
});
