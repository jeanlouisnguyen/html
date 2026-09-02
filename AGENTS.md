# Base44 Dev Environment

## Project
Static HTML standalone mini-tools (no backend, no build step, no dependencies).
Files: `index.html`, `work_calendar.html`, `sharepoint_search.html`, `fixed_calendar.html`.

## Run
```
docker compose -f docker-compose.base44.yml up -d
```
Serves via nginx:alpine on host port 3000. Source is bind-mounted read-only, so HTML
edits appear live on refresh (no rebuild needed).

## Quirks
- The repo root directory is mode 700 owned by root. nginx's default non-root worker
  cannot traverse it, so `nginx.base44.conf` sets `user root;`. Keep this config mounted
  or pages return 403.
- No external secrets required.

## Verify
- `curl -sf http://localhost:3000/` returns the SharePoint Search page.
- `curl -sf -H "Host: external-preview.example.com" http://localhost:3000/` must also
  return the page (preview reaches port 3000 with a non-localhost Host header).
