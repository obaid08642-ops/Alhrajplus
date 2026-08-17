from pathlib import Path
import re

root = Path('/home/ubuntu/Alhrajplus_latest')
paths = {
    'web': root/'frontend/src',
    'mobile': root/'mobile/src',
    'backend': root/'backend',
}

def collect_client(path):
    out=set()
    for f in path.rglob('*'):
        if f.suffix not in {'.js','.jsx','.ts','.tsx'}: continue
        text=f.read_text(errors='ignore')
        for m in re.finditer(r'(?:api\.(?:get|post|put|patch|delete)|fetch)\s*\(\s*[`\"\']([^`\"\']+)', text):
            raw=m.group(1)
            if raw.startswith('http'): continue
            raw=re.sub(r'\$\{[^}]+\}', '{id}', raw)
            raw=re.sub(r'\?.*$', '', raw)
            if raw.startswith('/'):
                out.add(raw)
    return sorted(out)

def collect_backend(path):
    out=set()
    for f in path.glob('*.py'):
        text=f.read_text(errors='ignore')
        for m in re.finditer(r'@(?:api|app)\.(?:get|post|put|patch|delete)\(\s*[\"\']([^\"\']+)', text):
            out.add(m.group(1))
    return sorted(out)

web=collect_client(paths['web']); mobile=collect_client(paths['mobile']); backend=collect_backend(paths['backend'])

def canon(x):
    x=re.sub(r'/\{[^}]+\}', '/{id}', x)
    x=re.sub(r'/:[^/]+', '/{id}', x)
    return x
bset={canon(x) for x in backend}
print('API_PARITY_REPORT')
print('web_paths', len(web)); print('mobile_paths', len(mobile)); print('backend_routes', len(backend))
for label, items in [('web_missing', web), ('mobile_missing', mobile)]:
    missing=sorted({canon(x) for x in items if canon(x) not in bset and not canon(x).startswith('/auth/callback')})
    print(label, len(missing))
    for x in missing: print(' ', x)
print('web_only', len(set(map(canon,web))-set(map(canon,mobile))))
for x in sorted(set(map(canon,web))-set(map(canon,mobile))): print(' ',x)
print('mobile_only', len(set(map(canon,mobile))-set(map(canon,web))))
for x in sorted(set(map(canon,mobile))-set(map(canon,web))): print(' ',x)
