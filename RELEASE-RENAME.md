# Release: deploysapp-cli → nexthub-cli (owner steps)

Not part of the npm tarball (`files` whitelist). Run these with your own npm login.
Nothing here has been run yet.

## What ships

- npm package `nexthub-cli@0.2.0` (new name, free on npm as of 2026-11-18).
- Bins: `nexthub` (primary), `deploysapp` and `dsa` (aliases, same entry `bin/nexthub.js`).
- Backward compatible: `~/.deploysapp/config.json` is moved to `~/.nexthub/config.json` on
  first run (users stay logged in), `DEPLOYSAPP_API_KEY` / `_API_URL` / `_CONFIG_HOME` still
  read (the `NEXTHUB_*` name wins), `.deploysapp.json` link files still read.
- Version 0.2.0, a minor bump: the release carries the version line on from deploysapp-cli
  0.1.1 and adds no breaking change. Old commands, env vars, stored logins and link files keep
  working. 1.0.0 is left for when the command surface is declared stable.

## Gotcha: the two packages cannot be installed globally side by side

Both packages define the `deploysapp` and `dsa` bins, so
`npm i -g nexthub-cli` fails with `EEXIST … bin/deploysapp` while `deploysapp-cli` is still
installed (verified with an isolated `--prefix`). Users must uninstall the old one first, so
the deprecation message says so.

## Steps

```sh
# 0. merge first, publish from master
cd ~/gitrepos/deploysapp-cli
git push -u origin feat/rename-nexthub-cli      # open PR, review, merge on GitHub
git checkout master && git pull

# 1. pre-flight
npm whoami                                      # must be the account that owns deploysapp-cli
npm view nexthub-cli                            # must still be 404 (name free)
npm ci && npm test
npm pack --dry-run                              # expect nexthub-cli-0.2.0.tgz, 16 files

# 2. publish the new package (unscoped → public by default; add --otp=123456 if 2FA is on)
npm publish

# 3. verify from the registry
npm view nexthub-cli version bin
npm uninstall -g deploysapp-cli; npm i -g nexthub-cli
nexthub --version && deploysapp --version && dsa --version   # all print 0.2.0
nexthub whoami                                  # still logged in (migrated config)

# 4. tag
git tag v0.2.0 && git push origin v0.2.0

# 5. retire the old package: deprecate every version, no further release
npm deprecate deploysapp-cli "Átnevezve: npm uninstall -g deploysapp-cli && npm i -g nexthub-cli"
npm view deploysapp-cli deprecated              # check it took
```

### Why deprecate only, with no final deploysapp-cli release

- 0.1.1 already defaults to `api.nexthub.hu`, so existing installs keep working. A last
  release would have no functional change to carry.
- `npm deprecate` puts the message on every `npm i deploysapp-cli` with no code shipped.
- A notice-only 0.1.2 (stderr banner or postinstall) would have to be maintained, and
  postinstall scripts are often blocked. Users who already have the CLI installed only
  learn about the rename from the docs (nexthub.hu/dokumentacio, README).

If you prefer the shorter message: `npm deprecate deploysapp-cli "Átnevezve: npm i -g nexthub-cli"`.
It omits the uninstall step, so anyone who still has the old package installed hits the
EEXIST error above.

Undo, if ever needed: `npm deprecate deploysapp-cli ""`.

## After publishing: update references elsewhere

- `~/deploysapp/web/src/app/dokumentacio/page.js`: install line, command table, npm link.
  Also `web/tests/publicPagesBrand.test.js:119`, which asserts the page contains `deploysapp-cli`.
- `~/deploysapp/web/src/app/aktivalas/page.js`: expired-code hint (`deploysapp login`).
- `~/CLAUDE.md`: building-blocks table row for the CLI.
