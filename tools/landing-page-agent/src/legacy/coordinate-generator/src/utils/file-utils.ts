import { cp, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";

export async function ensureDir(dir: string): Promise<void> {
  await mkdir(dir, { recursive: true });
}

export async function writeText(file: string, content: string): Promise<void> {
  await ensureDir(path.dirname(file));
  await writeFile(file, content, "utf8");
}

export async function writeJson(file: string, value: unknown, pretty = true): Promise<void> {
  await writeText(file, JSON.stringify(value, null, pretty ? 2 : 0) + "\n");
}

export async function readJson<T = unknown>(file: string): Promise<T> {
  return JSON.parse(await readFile(file, "utf8")) as T;
}

export async function exists(file: string): Promise<boolean> {
  try {
    await stat(file);
    return true;
  } catch {
    return false;
  }
}

export async function copyFile(from: string, to: string): Promise<void> {
  await ensureDir(path.dirname(to));
  await cp(from, to);
}

export async function removeDir(dir: string): Promise<void> {
  await rm(dir, { recursive: true, force: true });
}
