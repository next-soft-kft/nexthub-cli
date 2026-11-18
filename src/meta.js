// src/meta.js — package identity, read once from package.json so the
// --version output and the User-Agent never drift from the published version.
import { readFileSync } from "fs";

const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));

export const PACKAGE_NAME = pkg.name;
export const VERSION = pkg.version;
export const USER_AGENT = `${pkg.name}/${pkg.version}`;
