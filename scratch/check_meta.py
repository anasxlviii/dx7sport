import requests
import re

url = "https://dx7sport.com/article/qnblh-bartwmyw-fynysyws-jwnywr-kan-ala-aatab-brshlwnh-qbl-hsm-lqb-allygha-2026-8179"
headers = {
    "User-Agent": "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)"
}

response = requests.get(url, headers=headers)
print(f"Status Code: {response.status_code}")
content = response.text

tags = [
    'og:title', 'og:description', 'og:url', 'og:image', 'og:type',
    'twitter:card', 'twitter:title', 'twitter:image', 'canonical'
]

for tag in tags:
    match = re.search(f'property="{tag}" content="([^"]+)"', content)
    if not match:
        match = re.search(f'name="{tag}" content="([^"]+)"', content)
    if not match:
         match = re.search(f'rel="{tag}" href="([^"]+)"', content)
    
    if match:
        val = match.group(1)
        is_ascii = all(ord(c) < 128 for c in val)
        if is_ascii:
            print(f"{tag}: FOUND -> {val[:100]}")
        else:
            print(f"{tag}: FOUND (Non-ASCII content, length {len(val)})")
    else:
        print(f"{tag}: NOT FOUND")
