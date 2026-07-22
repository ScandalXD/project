import { readdir, writeFile } from "node:fs/promises";
import { join, posix, sep } from "node:path";

const distDir = join(process.cwd(), "dist");
const publicAssets = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/offline.html",
  "/icon-192.png",
  "/icon-512.png",
  "/service-worker.js",
];

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const path = join(directory, entry.name);

      if (entry.isDirectory()) {
        return listFiles(path);
      }

      return [path];
    }),
  );

  return files.flat();
}

const files = await listFiles(distDir);
const assetUrls = files
  .filter((file) => !file.endsWith("sw-manifest.json"))
  .map((file) => `/${file.slice(distDir.length + 1).split(sep).join(posix.sep)}`);

const urls = Array.from(new Set([...publicAssets, ...assetUrls])).sort();

await writeFile(
  join(distDir, "sw-manifest.json"),
  `${JSON.stringify({ urls }, null, 2)}\n`,
);
