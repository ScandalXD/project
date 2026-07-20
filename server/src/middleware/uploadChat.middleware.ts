import multer from "multer";
import path from "path";
import fs from "fs";
import { NextFunction, Request, Response } from "express";

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
  "image/svg+xml",
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/json",
  "application/zip",
  "application/x-zip",
  "application/x-zip-compressed",
  "application/octet-stream",
  "application/x-7z-compressed",
  "application/gzip",
  "application/x-gzip",
  "application/x-tar",
  "application/vnd.rar",
  "application/x-rar-compressed",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/webm",
  "audio/ogg",
  "audio/mp4",
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime",
  "video/x-msvideo",
  "video/x-matroska",
]);

const allowedExtensions = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".svg",
  ".pdf",
  ".txt",
  ".csv",
  ".json",
  ".zip",
  ".7z",
  ".gz",
  ".tar",
  ".rar",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".mp3",
  ".wav",
  ".webm",
  ".ogg",
  ".m4a",
  ".mp4",
  ".mov",
  ".avi",
  ".mkv",
]);

const binaryMimeTypesRequiringExtension = new Set([
  "application/octet-stream",
  "application/x-zip",
  "application/x-7z-compressed",
  "application/gzip",
  "application/x-gzip",
  "application/x-tar",
]);

export const uploadChatAttachment = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const isGenericBinaryMime = binaryMimeTypesRequiringExtension.has(
      file.mimetype,
    );
    const isAllowedMime =
      allowedMimeTypes.has(file.mimetype) && !isGenericBinaryMime;
    const isAllowedByExtension = allowedExtensions.has(ext);

    if (!isAllowedMime && !isAllowedByExtension) {
      return cb(new Error("Unsupported chat attachment type"));
    }

    cb(null, true);
  },
});

export const uploadChatAttachmentHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  uploadChatAttachment.single("file")(req, res, (err: unknown) => {
    if (!err) {
      return next();
    }

    if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
      return res
        .status(400)
        .json({ message: "Attachment must be 50 MB or smaller" });
    }

    if (err instanceof Error) {
      return res.status(400).json({ message: err.message });
    }

    return res.status(400).json({ message: "Invalid chat attachment" });
  });
};
