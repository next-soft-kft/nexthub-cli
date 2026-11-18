// test/client.test.js
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextHubClient } from "../src/client.js";
import { USER_AGENT } from "../src/meta.js";

const KEYS = ["NEXTHUB_API_KEY", "DEPLOYSAPP_API_KEY", "NEXTHUB_API_URL", "DEPLOYSAPP_API_URL"];
let saved;
beforeEach(() => { saved = Object.fromEntries(KEYS.map((k) => [k, process.env[k]])); KEYS.forEach((k) => delete process.env[k]); });
afterEach(() => {
  for (const [k, v] of Object.entries(saved)) { if (v === undefined) delete process.env[k]; else process.env[k] = v; }
  vi.unstubAllGlobals();
});

describe("NextHubClient", () => {
  it("reads NEXTHUB_API_KEY, falling back to DEPLOYSAPP_API_KEY", () => {
    process.env.DEPLOYSAPP_API_KEY = "dsa_legacy";
    expect(new NextHubClient().apiKey).toBe("dsa_legacy");
    process.env.NEXTHUB_API_KEY = "dsa_new";
    expect(new NextHubClient().apiKey).toBe("dsa_new");
  });
  it("defaults to api.nexthub.hu and honours both URL env names", () => {
    expect(new NextHubClient({ apiKey: "dsa_x" }).baseUrl).toBe("https://api.nexthub.hu");
    process.env.DEPLOYSAPP_API_URL = "https://legacy.example/";
    expect(new NextHubClient({ apiKey: "dsa_x" }).baseUrl).toBe("https://legacy.example");
    process.env.NEXTHUB_API_URL = "https://new.example";
    expect(new NextHubClient({ apiKey: "dsa_x" }).baseUrl).toBe("https://new.example");
  });
  it("points at `nexthub login` when no key is configured", () => {
    expect(() => new NextHubClient()).toThrow(/nexthub login/);
  });
  it("identifies itself as nexthub-cli/<version>", async () => {
    const fetchMock = vi.fn(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await new NextHubClient({ apiKey: "dsa_x" }).get("/me");
    expect(USER_AGENT).toMatch(/^nexthub-cli\/\d+\.\d+\.\d+/);
    expect(fetchMock.mock.calls[0][1].headers["User-Agent"]).toBe(USER_AGENT);
  });
});
