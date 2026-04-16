import fs from "fs/promises";
import path from "path";

export const deleteUploadedFile = async (filePath: string | null | undefined) => {
  if (!filePath) {
    return;
  }

  if (!filePath.startsWith("/uploads/")) {
    return;
  }

  const absolutePath = path.join(__dirname, "../../", filePath);

  try {
    await fs.unlink(absolutePath);
  } catch (error: any) {
    if (error?.code !== "ENOENT") {
      throw error;
    }
  }
};