# nexthub-cli

Command-line interface for [NextHub](https://nexthub.hu) — deploy, manage, and monitor your services from the terminal.

```
npm install -g nexthub-cli
```

Requires **Node >= 20**.

The command is `nexthub`. The old names from the `deploysapp-cli` package, `deploysapp` and `dsa`, still work as aliases for the same program, so existing scripts keep running.

> **Coming from `deploysapp-cli`?** Run `npm uninstall -g deploysapp-cli && npm install -g nexthub-cli`. You stay logged in: the stored login in `~/.deploysapp/config.json` is moved to `~/.nexthub/config.json` the first time you run a command. `DEPLOYSAPP_*` env vars and `.deploysapp.json` link files are still read.

---

## Quick start

```sh
nexthub login          # authenticate this device (opens browser)
nexthub link           # bind the current directory to a service
nexthub deploy         # redeploy from git and stream the build log
```

---

## Authentication

### Interactive (recommended for local dev)

```sh
nexthub login
```

Opens a browser-based device-code flow. Credentials are saved to `~/.nexthub/config.json` (mode 0600).

```sh
nexthub logout         # remove stored credentials
nexthub whoami         # print the authenticated account
```

### CI / headless environments

Skip `login` entirely — set env vars instead:

```sh
export NEXTHUB_API_KEY=dsa_xxxxxxxxxxxx
# optional: point at a self-hosted API
export NEXTHUB_API_URL=https://api.your-instance.example.com
```

`NEXTHUB_API_KEY` takes precedence over the stored config file. (API keys keep the `dsa_` prefix.)

---

## The `.nexthub.json` link file

Running `nexthub link` writes a `.nexthub.json` file in the current directory that records the service (and project) id:

```json
{
  "serviceId": "svc_abc123",
  "projectId": "proj_xyz789"
}
```

All commands that operate on a specific service read this file automatically. You can override it at any time with the `--service <id>` flag. A legacy `.deploysapp.json` is still read when no `.nexthub.json` is present.

---

## Command reference

### Auth

| Command | Description | Example |
|---------|-------------|---------|
| `login [--no-open]` | Authenticate this device via browser | `nexthub login` |
| `logout` | Remove stored credentials | `nexthub logout` |
| `whoami` | Print the currently authenticated account | `nexthub whoami` |

### Linking

| Command | Description | Example |
|---------|-------------|---------|
| `link [--service <id>]` | Bind the current directory to a service (writes `.nexthub.json`) | `nexthub link` |

### Deployment

| Command | Description | Example |
|---------|-------------|---------|
| `deploy [--service <id>]` | Trigger a redeploy from git and stream the build log | `nexthub deploy --service svc_abc123` |

### Logs

```
logs [--service <id>] [-f] [--build | --runtime] [--tail <n>]
```

| Flag | Description |
|------|-------------|
| `--service <id>` | Target service (overrides `.nexthub.json`) |
| `--build` | Show the latest build log |
| `--runtime` | Show runtime logs (default) |
| `-f, --follow` | Follow (stream) runtime logs |
| `--tail <n>` | Lines of history to show (default: 200) |

Examples:

```sh
nexthub logs                        # last 200 lines of runtime logs
nexthub logs --build                # latest build log
nexthub logs -f                     # follow runtime logs live
nexthub logs -f --tail 50           # follow, starting from last 50 lines
```

### Service lifecycle

All service commands accept `--service <id>` to override `.nexthub.json`.

| Command | Description | Example |
|---------|-------------|---------|
| `ps` | List all services and their current status | `nexthub ps` |
| `restart [--service <id>]` | Restart a service | `nexthub restart` |
| `stop [--service <id>]` | Stop a service | `nexthub stop --service svc_abc123` |
| `start [--service <id>]` | Start a stopped service | `nexthub start` |
| `open [--service <id>]` | Open the service URL in the browser | `nexthub open` |
| `scale --replicas <n> [--service <id>]` | Set the replica count | `nexthub scale --replicas 3` |

### Environment variables

All `env` subcommands accept `--service <id>`.

| Command | Description | Example |
|---------|-------------|---------|
| `env list` | List all env vars for a service | `nexthub env list` |
| `env get <key>` | Print the value of a single env var | `nexthub env get DATABASE_URL` |
| `env set <KEY=VALUE> [--restart]` | Set an env var (optionally restart) | `nexthub env set PORT=3000 --restart` |
| `env rm <key> [--restart]` | Delete an env var (optionally restart) | `nexthub env rm OLD_VAR --restart` |

### Secrets

Project-scoped secrets can be attached to a service as an env var.

| Command | Description | Example |
|---------|-------------|---------|
| `secret list [--project <id>]` | List secrets for a project | `nexthub secret list` |
| `secret attach <name> --as <ENV_KEY> [--project <id>] [--service <id>]` | Expose a secret to a service as an env var | `nexthub secret attach db-password --as DATABASE_PASSWORD` |

---

## Configuration reference

| Source | Key | Default |
|--------|-----|---------|
| Env var | `NEXTHUB_API_KEY` | — |
| Env var | `NEXTHUB_API_URL` | `https://api.nexthub.hu` |
| Env var | `NEXTHUB_CONFIG_HOME` | `~/.nexthub` |
| File | `~/.nexthub/config.json` | written by `login` |

Environment variables always take precedence over the config file. The pre-rename names `DEPLOYSAPP_API_KEY`, `DEPLOYSAPP_API_URL` and `DEPLOYSAPP_CONFIG_HOME` are still accepted; the `NEXTHUB_*` name wins if both are set.

---

## License

MIT
