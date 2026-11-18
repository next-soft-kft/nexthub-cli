// test/bin.test.js — the package exposes `nexthub` plus the legacy `deploysapp`/`dsa` aliases.
import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "fs";
import { execFileSync } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));

describe("package bins", () => {
  it("is published as nexthub-cli", () => {
    expect(pkg.name).toBe("nexthub-cli");
  });
  it("exposes nexthub, deploysapp and dsa", () => {
    expect(Object.keys(pkg.bin).sort()).toEqual(["deploysapp", "dsa", "nexthub"]);
  });
  it("all three bins resolve to the same entry file", () => {
    const targets = new Set(Object.values(pkg.bin));
    expect(targets.size).toBe(1);
    const [entry] = targets;
    expect(entry).toBe("bin/nexthub.js");
    expect(existsSync(join(root, entry))).toBe(true);
    expect(readFileSync(join(root, entry), "utf8").startsWith("#!/usr/bin/env node")).toBe(true);
  });
  it("the entry reports the package version and the nexthub name", () => {
    const entry = join(root, pkg.bin.nexthub);
    expect(execFileSync(process.execPath, [entry, "--version"], { encoding: "utf8" }).trim()).toBe(pkg.version);
    const help = execFileSync(process.execPath, [entry, "--help"], { encoding: "utf8" });
    expect(help).toMatch(/^Usage: nexthub /);
    expect(help).toMatch(/NextHub/);
  });
});
