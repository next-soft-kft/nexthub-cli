// test/config.test.js
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, readFileSync, existsSync, statSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

const ENV_KEYS = [
  "NEXTHUB_CONFIG_HOME", "DEPLOYSAPP_CONFIG_HOME",
  "NEXTHUB_API_KEY", "DEPLOYSAPP_API_KEY",
  "NEXTHUB_API_URL", "DEPLOYSAPP_API_URL",
];
let dir, savedEnv;
const fresh = () => import("../src/config.js?" + Math.random());

beforeEach(() => {
  savedEnv = Object.fromEntries(["HOME", ...ENV_KEYS].map((k) => [k, process.env[k]]));
  for (const k of ENV_KEYS) delete process.env[k];
  dir = mkdtempSync(join(tmpdir(), "nexthub-"));
  process.env.DEPLOYSAPP_CONFIG_HOME = dir; // legacy name still honoured
});
afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
  for (const [k, v] of Object.entries(savedEnv)) {
    if (v === undefined) delete process.env[k]; else process.env[k] = v;
  }
});

describe("config", () => {
  it("saves and loads an api key round-trip", async () => {
    const { saveConfig, loadConfig } = await fresh();
    saveConfig({ apiKey: "dsa_test123" });
    expect(loadConfig().apiKey).toBe("dsa_test123");
  });
  it("prefers DEPLOYSAPP_API_KEY env over the file", async () => {
    const { saveConfig, loadConfig } = await fresh();
    saveConfig({ apiKey: "dsa_fromfile" });
    process.env.DEPLOYSAPP_API_KEY = "dsa_fromenv";
    expect(loadConfig().apiKey).toBe("dsa_fromenv");
  });
});

describe("env var fallback (NEXTHUB_* → DEPLOYSAPP_*)", () => {
  it("NEXTHUB_API_KEY beats DEPLOYSAPP_API_KEY and the file", async () => {
    const { saveConfig, loadConfig } = await fresh();
    saveConfig({ apiKey: "dsa_fromfile" });
    process.env.DEPLOYSAPP_API_KEY = "dsa_legacy";
    process.env.NEXTHUB_API_KEY = "dsa_new";
    expect(loadConfig().apiKey).toBe("dsa_new");
  });
  it("defaults the API URL to api.nexthub.hu", async () => {
    const { loadConfig } = await fresh();
    expect(loadConfig().apiUrl).toBe("https://api.nexthub.hu");
  });
  it("accepts DEPLOYSAPP_API_URL, and NEXTHUB_API_URL wins over it", async () => {
    const { loadConfig } = await fresh();
    process.env.DEPLOYSAPP_API_URL = "https://legacy.example";
    expect(loadConfig().apiUrl).toBe("https://legacy.example");
    process.env.NEXTHUB_API_URL = "https://new.example";
    expect(loadConfig().apiUrl).toBe("https://new.example");
  });
  it("NEXTHUB_CONFIG_HOME wins over DEPLOYSAPP_CONFIG_HOME", async () => {
    const other = mkdtempSync(join(tmpdir(), "nexthub-home-"));
    try {
      process.env.NEXTHUB_CONFIG_HOME = other;
      const { saveConfig } = await fresh();
      saveConfig({ apiKey: "dsa_x" });
      expect(existsSync(join(other, "config.json"))).toBe(true);
      expect(existsSync(join(dir, "config.json"))).toBe(false);
    } finally { rmSync(other, { recursive: true, force: true }); }
  });
  it("makeClient's not-logged-in error points at `nexthub login`", async () => {
    const { makeClient } = await fresh();
    expect(() => makeClient()).toThrow(/nexthub login/);
  });
});

describe("legacy ~/.deploysapp → ~/.nexthub migration", () => {
  beforeEach(() => {
    delete process.env.DEPLOYSAPP_CONFIG_HOME; // use the default (HOME-based) locations
    process.env.HOME = dir;                    // os.homedir() honours HOME on POSIX
  });
  const legacyFile = () => join(dir, ".deploysapp", "config.json");
  const newFile = () => join(dir, ".nexthub", "config.json");
  const writeLegacy = (apiKey) => {
    mkdirSync(join(dir, ".deploysapp"), { recursive: true });
    writeFileSync(legacyFile(), JSON.stringify({ apiKey }), { mode: 0o600 });
  };

  it("keeps an existing deploysapp-cli login working and moves it", async () => {
    writeLegacy("dsa_legacy");
    const { loadConfig } = await fresh();
    expect(loadConfig().apiKey).toBe("dsa_legacy");
    expect(JSON.parse(readFileSync(newFile(), "utf8")).apiKey).toBe("dsa_legacy");
    expect(statSync(newFile()).mode & 0o777).toBe(0o600);
    expect(existsSync(legacyFile())).toBe(false);
    expect(existsSync(join(dir, ".deploysapp"))).toBe(false); // empty dir removed
    // second load reads the new location
    expect((await fresh()).loadConfig().apiKey).toBe("dsa_legacy");
  });
  it("leaves the legacy dir if it holds other files", async () => {
    writeLegacy("dsa_legacy");
    writeFileSync(join(dir, ".deploysapp", "other.txt"), "keep");
    const { loadConfig } = await fresh();
    loadConfig();
    expect(existsSync(join(dir, ".deploysapp", "other.txt"))).toBe(true);
  });
  it("never overwrites an existing ~/.nexthub login", async () => {
    writeLegacy("dsa_legacy");
    const { saveConfig, loadConfig } = await fresh();
    saveConfig({ apiKey: "dsa_new" });
    expect(loadConfig().apiKey).toBe("dsa_new");
    expect(existsSync(legacyFile())).toBe(true); // untouched
  });
  it("ignores the legacy file when a config home is set explicitly", async () => {
    writeLegacy("dsa_legacy");
    const explicit = mkdtempSync(join(tmpdir(), "nexthub-explicit-"));
    try {
      process.env.NEXTHUB_CONFIG_HOME = explicit;
      const { loadConfig } = await fresh();
      expect(loadConfig().apiKey).toBeNull();
      expect(existsSync(legacyFile())).toBe(true);
    } finally { rmSync(explicit, { recursive: true, force: true }); }
  });
  it("logout clears both the new and the legacy location", async () => {
    writeLegacy("dsa_legacy");
    const { saveConfig, clearConfig, loadConfig } = await fresh();
    saveConfig({ apiKey: "dsa_new" });
    clearConfig();
    expect(existsSync(newFile())).toBe(false);
    expect(existsSync(legacyFile())).toBe(false);
    expect(loadConfig().apiKey).toBeNull();
  });
});
