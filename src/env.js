// src/env.js
// Read a NEXTHUB_* env var, falling back to its legacy DEPLOYSAPP_* name
// (the CLI was published as deploysapp-cli up to 0.1.x). Empty values count as unset.
export function env(name) {
  return process.env[`NEXTHUB_${name}`] || process.env[`DEPLOYSAPP_${name}`] || undefined;
}
