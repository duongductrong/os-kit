# Research: Reverse Proxy Config for Local Custom Domains with SSL

Date: 2026-02-28
Scope: Caddy & Nginx as local reverse proxies on macOS (Tauri app context)

---

## 1. Caddy as Local Reverse Proxy

### Minimal Caddyfile with mkcert SSL

```caddyfile
myapp.local {
  tls /path/to/myapp.local.pem /path/to/myapp.local-key.pem
  reverse_proxy localhost:3000
}
```

- `tls` directive accepts cert + key paths directly — no CA config needed
- mkcert-generated certs are fully compatible; just point to the `.pem` files
- Multiple domains: repeat the block

### Caddy Auto-Reload

```bash
caddy reload --config /path/to/Caddyfile
# Or start with watch mode:
caddy run --watch --config /path/to/Caddyfile
# Or via Admin API (default :2019):
curl -X POST http://localhost:2019/load \
  -H "Content-Type: text/caddyfile" \
  --data-binary @/path/to/Caddyfile
```

- Zero-downtime reload; no restart needed

### macOS Paths (Homebrew)

| Item | Path |
|------|------|
| Binary | `/opt/homebrew/bin/caddy` |
| Default config | `/opt/homebrew/etc/Caddyfile` |
| Data dir | `~/.local/share/caddy` |

---

## 2. Nginx as Local Reverse Proxy

### Minimal nginx.conf Snippet

```nginx
server {
    listen 443 ssl;
    server_name myapp.local;

    ssl_certificate     /path/to/myapp.local.pem;
    ssl_certificate_key /path/to/myapp.local-key.pem;

    location / {
        proxy_pass         http://localhost:3000;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name myapp.local;
    return 301 https://$host$request_uri;
}
```

### Nginx Reload After Config Change

```bash
nginx -t              # test config first
sudo nginx -s reload  # graceful reload (port 443 requires root)
```

### macOS Paths (Homebrew)

| Item | Path |
|------|------|
| Binary | `/opt/homebrew/bin/nginx` |
| Main config | `/opt/homebrew/etc/nginx/nginx.conf` |
| Sites dir | `/opt/homebrew/etc/nginx/servers/` |
| Logs | `/opt/homebrew/var/log/nginx/` |

Place per-site configs in `/opt/homebrew/etc/nginx/servers/{DOMAIN}.conf`.
Ensure `nginx.conf` includes: `include servers/*;`

---

## 3. Detecting Installed Proxy Server

### Detection Commands

```bash
# Caddy
which caddy
brew list caddy 2>/dev/null
caddy version

# Nginx
which nginx
brew list nginx 2>/dev/null
nginx -v

# Check if running
pgrep -x caddy
pgrep -x nginx
lsof -i :443
```

### Strategy: Clipboard vs File Write

| Scenario | Action |
|----------|--------|
| Proxy installed, app has write perms | Write config file directly, then reload |
| Proxy installed, no write perms | Copy snippet to clipboard, show instructions |
| Proxy not installed | Show install instructions + snippet for clipboard |

---

## 4. Config Snippet Templates

### Variables

| Variable | Example |
|----------|---------|
| `{DOMAIN}` | `myapp.local` |
| `{PORT}` | `3000` |
| `{CERT_PATH}` | `~/.local/share/mkcert/myapp.local.pem` |
| `{KEY_PATH}` | `~/.local/share/mkcert/myapp.local-key.pem` |

### Caddy Template (3 lines)

```caddyfile
{DOMAIN} {
  tls {CERT_PATH} {KEY_PATH}
  reverse_proxy localhost:{PORT}
}
```

### Nginx Template (~15 lines)

```nginx
server {
    listen 443 ssl;
    server_name {DOMAIN};

    ssl_certificate     {CERT_PATH};
    ssl_certificate_key {KEY_PATH};

    location / {
        proxy_pass       http://localhost:{PORT};
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Place at: `/opt/homebrew/etc/nginx/servers/{DOMAIN}.conf`

---

## Summary Comparison

| Aspect | Caddy | Nginx |
|--------|-------|-------|
| Config complexity | Minimal (3 lines) | Moderate (~15 lines) |
| Auto-reload | Built-in (`--watch` or API) | Manual (`-s reload`) |
| SSL with mkcert | Direct cert/key paths | Direct cert/key paths |
| Homebrew install | `brew install caddy` | `brew install nginx` |
| Port 443 root req | No (via `setcap` or listener) | Yes (sudo required) |

**Recommendation:** Caddy preferred for simplicity. Nginx for teams already using it.

---

## Unresolved Questions

1. Does the Tauri app need elevated privileges (osascript/sudo) to write nginx config dirs or bind port 443?
2. Should mkcert cert paths be discovered dynamically (via `mkcert -CAROOT`) or user-specified?
3. If neither proxy is installed, guide installation or use a built-in Rust proxy (e.g., `hyper`)?
4. Multiple domains per proxy block — UI implications for managing N entries?
