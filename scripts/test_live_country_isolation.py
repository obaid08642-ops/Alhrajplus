import json
import sys
import requests

base = sys.argv[1].rstrip('/') if len(sys.argv) > 1 else 'https://alhrajplus.onrender.com/api'
checks = {
    'listings': ('/listings', {'limit': 100}),
    'search': ('/search', {'q': 'a', 'limit': 100}),
    'recommended': ('/listings/recommended', {'limit': 100}),
    'trending': ('/listings/trending', {'limit': 100}),
    'deals': ('/deals/today', {'limit': 100}),
    'map': ('/listings/map/nearby', {'limit': 100}),
    'auctions': ('/auctions/active', {'limit': 100}),
}
first_by_country = {}
for cc in ('SA', 'EG', 'AE'):
    for name, (path, params) in checks.items():
        query = dict(params); query['country_code'] = cc
        r = requests.get(f'{base}{path}', params=query, timeout=30)
        if r.status_code != 200:
            print(cc, name, 'HTTP', r.status_code)
            continue
        data = r.json()
        items = data.get('items', []) if isinstance(data, dict) else (data if isinstance(data, list) else [])
        if not isinstance(items, list): items = []
        seen = {}
        for item in items:
            actual = str(item.get('country_code') or '').upper()
            seen[actual] = seen.get(actual, 0) + 1
        bad = [item.get('id') for item in items if str(item.get('country_code') or '').upper() != cc]
        print(cc, name, 'count=', len(items), 'countries=', json.dumps(seen, ensure_ascii=False), 'violations=', len(bad))
        if name == 'listings' and items:
            first_by_country[cc] = items[0].get('id')

if first_by_country.get('EG'):
    eg_id = first_by_country['EG']
    wrong = requests.get(f'{base}/listings/{eg_id}', params={'country_code': 'SA'}, timeout=30)
    right = requests.get(f'{base}/listings/{eg_id}', params={'country_code': 'EG'}, timeout=30)
    print('detail_EG_as_SA=', wrong.status_code, 'detail_EG_as_EG=', right.status_code)
