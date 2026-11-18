import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, existsSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

let dir, cwd;
beforeEach(() => { dir = mkdtempSync(join(tmpdir(), "nexthub-proj-")); cwd = process.cwd(); process.chdir(dir); });
afterEach(() => { process.chdir(cwd); rmSync(dir, { recursive: true, force: true }); });

describe("resolveServiceId", () => {
  it("prefers the flag", async () => {
    const { resolveServiceId } = await import("../src/project.js?" + Math.random());
    expect(resolveServiceId({ flag: "svc_flag" })).toBe("svc_flag");
  });
  it("falls back to the link file (.nexthub.json)", async () => {
    const m = await import("../src/project.js?" + Math.random());
    m.saveProject({ serviceId: "svc_file", projectId: "p1" });
    expect(existsSync(join(dir, ".nexthub.json"))).toBe(true);
    expect(existsSync(join(dir, ".deploysapp.json"))).toBe(false);
    expect(m.resolveServiceId({})).toBe("svc_file");
  });
  it("still reads a legacy .deploysapp.json", async () => {
    writeFileSync(join(dir, ".deploysapp.json"), JSON.stringify({ serviceId: "svc_legacy", projectId: "p0" }));
    const m = await import("../src/project.js?" + Math.random());
    expect(m.resolveServiceId({})).toBe("svc_legacy");
    expect(m.loadProject().projectId).toBe("p0");
  });
  it("prefers .nexthub.json over .deploysapp.json", async () => {
    writeFileSync(join(dir, ".deploysapp.json"), JSON.stringify({ serviceId: "svc_legacy" }));
    const m = await import("../src/project.js?" + Math.random());
    m.saveProject({ serviceId: "svc_new", projectId: "p1" });
    expect(m.resolveServiceId({})).toBe("svc_new");
  });
  it("throws exitCode 2 when nothing is set", async () => {
    const { resolveServiceId } = await import("../src/project.js?" + Math.random());
    try { resolveServiceId({}); expect.unreachable(); }
    catch (e) { expect(e.exitCode).toBe(2); expect(e.message).toMatch(/nexthub link/); }
  });
});
