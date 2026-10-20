import { randomBytes } from "node:crypto";

function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 30);
}

export function generateProjectSlug(clientName: string): string {
  const base = slugifyName(clientName) || "projekt";
  const suffix = randomBytes(4).toString("hex");
  return `${base}-${suffix}`;
}
