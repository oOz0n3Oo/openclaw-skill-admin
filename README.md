# OpenClaw Skill Admin

Standalone Flask admin portal for managing skills installed in a local OpenClaw workspace.

## Connect Your Own OpenClaw

This app does not auto-discover a remote OpenClaw instance.

Each user connects it to their own OpenClaw install by mounting their own local
workspace into the container. In practice, that usually means mounting:

- `~/.openclaw/workspace`

What each user must provide:

- `OPENCLAW_WORKSPACE_HOST`
  The host path to their own OpenClaw workspace
- `SECRET_KEY`
  A unique Flask session secret
- `ADMIN_USERNAME`
  The admin username for the portal
- `ADMIN_PASSWORD`
  The initial admin password for the portal
- Optional: `SKILL_ADMIN_PORT`
  Change this if `5057` is already in use

Example `.env` file:

```dotenv
OPENCLAW_WORKSPACE_HOST=/home/your-user/.openclaw/workspace
SECRET_KEY=replace-with-a-long-random-secret
ADMIN_USERNAME=admin
ADMIN_PASSWORD=replace-with-a-strong-password
SKILL_ADMIN_PORT=5057
```

On macOS, `OPENCLAW_WORKSPACE_HOST` will usually look like:

```dotenv
OPENCLAW_WORKSPACE_HOST=/Users/your-user/.openclaw/workspace
```

## Features

- Admin login
- List installed workspace skills from `~/.openclaw/workspace/skills`
- Install skills from ClawHub by slug or URL
- Update installed skills via `clawhub update`
- Delete skills from the workspace and remove their `.clawhub` lock entry
- Display install metadata:
  - slug
  - title / summary
  - installed version
  - published version
  - installed date
  - published date
  - modified date
  - owner id
  - registry
  - size
  - file count
  - portal last used / last portal action

Note: OpenClaw runtime "last used by agent" is not available from the workspace files alone. This portal records its own usage activity.

## Docker First

You do not need Flask installed on the host if you run this with Docker.
This image vendors the `clawhub` CLI locally so container builds do not depend on npm registry access.

```bash
cd openclaw-skill-admin
docker compose up --build -d
```

Then open `http://127.0.0.1:5057`.

After first login, change the password in the portal. Password changes are stored in the portal database volume and persist across container restarts.

Recommended environment variables:

```bash
export OPENCLAW_WORKSPACE_HOST="$HOME/.openclaw/workspace"
export SECRET_KEY='replace-with-a-long-random-secret'
export ADMIN_USERNAME='admin'
export ADMIN_PASSWORD='strong-password'
export SKILL_ADMIN_PORT='5057'
```

Then run:

```bash
docker compose up --build -d
```

## Local Run

```bash
cd openclaw-skill-admin
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

Open `http://127.0.0.1:5057`.

Override in production:

```bash
export SECRET_KEY='replace-with-a-long-random-secret'
export ADMIN_USERNAME='admin'
export ADMIN_PASSWORD='strong-password'
export OPENCLAW_WORKSPACE="$HOME/.openclaw/workspace"
```

You can also provide `ADMIN_PASSWORD_HASH` instead of `ADMIN_PASSWORD`.

## Docker Manual

```bash
cd openclaw-skill-admin
docker build -t openclaw-skill-admin .
docker run --rm -p 5057:5057 \
  -e SECRET_KEY='replace-with-a-long-random-secret' \
  -e ADMIN_USERNAME='admin' \
  -e ADMIN_PASSWORD='strong-password' \
  -e OPENCLAW_WORKSPACE='/data/openclaw-workspace' \
  -v "$HOME/.openclaw/workspace:/data/openclaw-workspace" \
  openclaw-skill-admin
```

If you want the portal database persisted outside the container, also mount a writable volume and set `PORTAL_DB`.
