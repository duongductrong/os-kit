export interface ProxyTemplateVars {
  domain: string;
  port: number;
  certPath?: string;
  keyPath?: string;
}

/** Generate a Caddyfile block for reverse proxy with SSL */
export function generateCaddyConfig(vars: ProxyTemplateVars): string {
  return `${vars.domain} {
  tls ${vars.certPath} ${vars.keyPath}
  reverse_proxy localhost:${vars.port}
}`;
}

/** Generate an Nginx server block for reverse proxy with SSL */
export function generateNginxConfig(vars: ProxyTemplateVars): string {
  return `server {
    listen 443 ssl;
    server_name ${vars.domain};

    ssl_certificate     ${vars.certPath};
    ssl_certificate_key ${vars.keyPath};

    location / {
        proxy_pass       http://127.0.0.1:${vars.port};
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}`;
}

/** Generate an Nginx server block for HTTP-only reverse proxy (port 80) */
export function generateNginxHttpConfig(vars: Pick<ProxyTemplateVars, "domain" | "port">): string {
  return `server {
    listen 80;
    server_name ${vars.domain};

    location / {
        proxy_pass       http://127.0.0.1:${vars.port};
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}`;
}

export function getCaddyConfigPath(): string {
  return "/opt/homebrew/etc/Caddyfile";
}

export function getNginxConfigPath(domain: string): string {
  return `/opt/homebrew/etc/nginx/servers/${domain}.conf`;
}
