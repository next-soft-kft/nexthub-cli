// src/config.js
import { homedir } from "os";
import { join } from "path";
import { mkdirSync, readFileSync, writeFileSync, chmodSync, rmSync, rmdirSync, existsSync } from "fs";
import { NextHubClient, DEFAULT_BASE_URL } from "./client.js";
import { env } from "./env.js";

function configHome() {
  return env("CONFIG_HOME") || join(homedir(), ".nexthub");
}
function configPath() { return join(configHome(), "config.json"); }

// The pre-rename location (~/.deploysapp/config.json). Only consulted when the
// config home was NOT set explicitly — an explicit *_CONFIG_HOME is authoritative.
function legacyConfigPath() {
  if (env("CONFIG_HOME")) return null;
  return join(homedir(), ".deploysapp", "config.json");
}

function readKey(path) {
  try { return JSON.parse(readFileSync(path, "utf8")).apiKey || null; }
  catch { return null; }
}

export function saveConfig({ apiKey }) {
  mkdirSync(configHome(), { recursive: true });
  writeFileSync(configPath(), JSON.stringify({ apiKey }, null, 2), { mode: 0o600 });
  chmodSync(configPath(), 0o600);
}

// One-time move of ~/.deploysapp/config.json → ~/.nexthub/config.json so users
// of deploysapp-cli stay logged in. If the move fails (read-only home, etc.)
// the legacy key is still returned and used.
function migrateLegacyConfig() {
  const legacy = legacyConfigPath();
  if (!legacy) return null;
  const key = readKey(legacy);
  if (!key) return null;
  try {
    saveConfig({ apiKey: key });
    rmSync(legacy);
    try { rmdirSync(join(legacy, "..")); } catch { /* not empty — leave it */ }
  } catch { /* keep using the legacy file */ }
  return key;
}

export function loadConfig() {
  const fileKey = readKey(configPath()) || migrateLegacyConfig();
  return {
    apiKey: env("API_KEY") || fileKey,
    apiUrl: env("API_URL") || DEFAULT_BASE_URL,
  };
}

export function clearConfig() {
  for (const p of [configPath(), legacyConfigPath()]) {
    if (p && existsSync(p)) rmSync(p);
  }
}

export function makeClient() {
  const { apiKey, apiUrl } = loadConfig();
  if (!apiKey) {
    const err = new Error("Not logged in. Run `nexthub login` (or set NEXTHUB_API_KEY).");
    err.exitCode = 1;
    throw err;
  }
  return new NextHubClient({ apiKey, baseUrl: apiUrl });
}
