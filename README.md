# OpenClaw Skill Admin

Standalone Flask admin portal for managing skills installed in a local OpenClaw workspace.

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
cd /Users/n0tst3v3/openclaw-skill-admin
docker compose up --build -d
```

Then open `http://127.0.0.1:5057`.

Default login:

- Username: `admin`
- Password: `admin123`

After first login, change the password in the portal. Password changes are stored in the portal database volume and persist across container restarts.

Override in production with environment variables:

```bash
export SECRET_KEY='replace-me'
export ADMIN_USERNAME='admin'
export ADMIN_PASSWORD='strong-password'
```

Or set them in the compose file before starting.

## Local Run

```bash
cd /Users/n0tst3v3/openclaw-skill-admin
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

Open `http://127.0.0.1:5057`.

Default login:

- Username: `admin`
- Password: `admin123`

Override in production:

```bash
export SECRET_KEY='replace-me'
export ADMIN_USERNAME='admin'
export ADMIN_PASSWORD='strong-password'
export OPENCLAW_WORKSPACE='/Users/n0tst3v3/.openclaw/workspace'
```

You can also provide `ADMIN_PASSWORD_HASH` instead of `ADMIN_PASSWORD`.

## Docker Manual

```bash
cd /Users/n0tst3v3/openclaw-skill-admin
docker build -t openclaw-skill-admin .
docker run --rm -p 5057:5057 \
  -e SECRET_KEY='replace-me' \
  -e ADMIN_USERNAME='admin' \
  -e ADMIN_PASSWORD='strong-password' \
  -e OPENCLAW_WORKSPACE='/data/openclaw-workspace' \
  -v /Users/n0tst3v3/.openclaw/workspace:/data/openclaw-workspace \
  openclaw-skill-admin
```

If you want the portal database persisted outside the container, also mount a writable volume and set `PORTAL_DB`.
