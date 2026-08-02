#!/bin/bash
set -euo pipefail

cp /etc/nginx/sites-available/default "/etc/nginx/sites-available/default.bak.$(date +%Y%m%d%H%M%S)"

if ! grep -q "location /ai-knowledge" /etc/nginx/sites-available/default; then
python3 <<'PY'
from pathlib import Path
p = Path("/etc/nginx/sites-available/default")
text = p.read_text()
block = """
    # AI Knowledge 静态知识库
    location = /ai-knowledge {
        return 302 /ai-knowledge/;
    }

    location /ai-knowledge/ {
        alias /var/www/ai-knowledge/;
        index index.html;
        try_files $uri $uri/ =404;
    }

    location ~* ^/ai-knowledge/.*\\.(?:css|js|png|jpg|jpeg|gif|svg|ico|webp|woff2?)$ {
        root /var/www;
        expires 7d;
        add_header Cache-Control "public";
        try_files $uri =404;
    }

"""
# root + try_files is more reliable than alias + try_files
block = """
    # AI Knowledge 静态知识库
    location = /ai-knowledge {
        return 302 /ai-knowledge/;
    }

    location /ai-knowledge/ {
        root /var/www;
        index index.html;
        try_files $uri $uri/ =404;
    }

"""
needle = "    # 哈客松静态页"
if needle in text:
    text = text.replace(needle, block + needle, 1)
elif "server_name _;" in text:
    text = text.replace("server_name _;", "server_name _;\n" + block, 1)
else:
    raise SystemExit("cannot find insertion point in nginx default")
p.write_text(text)
print("nginx config updated")
PY
else
  echo "ai-knowledge location already exists"
fi

chown -R www-data:www-data /var/www/ai-knowledge
find /var/www/ai-knowledge -type d -exec chmod 755 {} \;
find /var/www/ai-knowledge -type f -exec chmod 644 {} \;

nginx -t
systemctl reload nginx

echo "=== files ==="
ls -la /var/www/ai-knowledge | head -25
echo "=== curl index ==="
curl -sI http://127.0.0.1/ai-knowledge/ | head -12
echo "=== curl fundamentals ==="
curl -sI http://127.0.0.1/ai-knowledge/fundamentals.html | head -8
echo "=== curl css ==="
curl -sI http://127.0.0.1/ai-knowledge/css/styles.css | head -8
echo "=== curl js ==="
curl -sI http://127.0.0.1/ai-knowledge/js/shell.js | head -8
