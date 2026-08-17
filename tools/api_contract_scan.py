from pathlib import Path
import re

root = Path(__file__).resolve().parents[1]
backend = (root / "backend/server.py").read_text(errors="ignore")
frontend_text = "\n".join(p.read_text(errors="ignore") for base in (root / "frontend/src", root / "mobile/src") for p in base.rglob("*.js"))

backend_paths = set(re.findall(r'@api\.(?:get|post|put|patch|delete)\(\s*["\']([^"\']+)', backend))
used = set()
# axios strings: /foo, /foo/{id}, /foo? and template literals; normalize params and IDs.
for raw in re.findall(r'(?:api|axios)\.(?:get|post|put|patch|delete)\(\s*[`"\']([^`"\']+)', frontend_text):
    path = raw.split("?")[0]
    path = re.sub(r'\$\{[^}]+\}', '{param}', path)
    used.add(path)

def shape(path):
    return re.sub(r'/\{[^}]+\}|/\{param\}|/[^/]+(?<!^)', lambda m: m.group(0), path)

def matches(client):
    out=[]
    for bp in backend_paths:
        regex = '^' + re.sub(r'\{[^}]+\}', r'[^/]+', bp) + '$'
        if re.match(regex, client):
            out.append(bp)
    return out

missing=[]
for u in sorted(used):
    if u.startswith(("/auth/", "/users/", "/listings", "/favorites", "/offers", "/following", "/notifications", "/search", "/comments", "/reports", "/wallet", "/coins", "/admin", "/referrals", "/chat", "/calls", "/stories", "/reels", "/locations", "/geo", "/ai")) and not matches(u):
        missing.append(u)
print(f"backend_routes={len(backend_paths)} client_paths={len(used)} unmatched_candidates={len(missing)}")
for x in missing:
    print(x)
