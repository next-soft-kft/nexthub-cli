import { join } from "path";
import { readFileSync, writeFileSync } from "fs";

// The per-directory link file. `.deploysapp.json` is the pre-rename name and is
// still read when no `.nexthub.json` exists, so already-linked directories keep working.
export const PROJECT_FILE = ".nexthub.json";
export const LEGACY_PROJECT_FILE = ".deploysapp.json";

function read(file) {
  try { return JSON.parse(readFileSync(join(process.cwd(), file), "utf8")); } catch { return null; }
}

export function saveProject({ serviceId, projectId }) {
  writeFileSync(join(process.cwd(), PROJECT_FILE), JSON.stringify({ serviceId, projectId }, null, 2));
}
export function loadProject() {
  return read(PROJECT_FILE) || read(LEGACY_PROJECT_FILE);
}
export function resolveServiceId({ flag } = {}) {
  if (flag) return flag;
  const p = loadProject();
  if (p?.serviceId) return p.serviceId;
  const err = new Error("No service selected. Pass --service <id> or run `nexthub link`.");
  err.exitCode = 2;
  throw err;
}
