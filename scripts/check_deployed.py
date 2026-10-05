import urllib.request
import re

html = urllib.request.urlopen('https://sahayak-sih.netlify.app/').read().decode()
matches = re.findall(r'_expo/static/js/web/[^" \'>]+', html)
print("Bundle files on Netlify:", matches)
if matches:
    bundle_url = 'https://sahayak-sih.netlify.app/' + matches[0]
    js = urllib.request.urlopen(bundle_url).read().decode('utf-8', errors='ignore')
    print("Contains Tele-MANAS?", "Tele-MANAS" in js or "14416" in js)
    print("Contains sahayak-ml-service?", "sahayak-ml-service.onrender.com" in js)
