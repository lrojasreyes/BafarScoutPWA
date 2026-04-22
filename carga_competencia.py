import xml.etree.ElementTree as ET
import re, requests, zipfile

KMZ_PATH = "/Users/LuisRojas/Downloads/Carnicerías DEMO Méx 2026.kmz"
SUPABASE_URL = "https://pjacmizmjsjwxtoldpvr.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqYWNtaXptanNqd3h0b2xkcHZyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDIxNTA2MSwiZXhwIjoyMDg5NzkxMDYxfQ.QUVRMHTe_iu2ZA8JyfJkTa78DdAUviplIhWgsGRS9-o"

with zipfile.ZipFile(KMZ_PATH) as z:
    kml_data = z.read("doc.kml")

tree = ET.fromstring(kml_data)
ns = {"kml": "http://www.opengis.net/kml/2.2"}
placemarks = tree.findall(".//kml:Placemark", ns)

records = []
for pm in placemarks:
    name = pm.find("kml:name", ns)
    desc = pm.find("kml:description", ns)
    coords = pm.find(".//kml:coordinates", ns)
    if coords is None:
        continue
    lng, lat, *_ = coords.text.strip().split(",")
    cadena = sucursal = estado = ""
    if desc is not None and desc.text:
        d = desc.text
        m = re.search(r"Cadena: ([^<]+)", d)
        cadena = m.group(1).strip() if m else ""
        m = re.search(r"Sucursal: ([^<]+)", d)
        sucursal = m.group(1).strip() if m else ""
        m = re.search(r"Estado: ([^<]+)", d)
        estado = m.group(1).strip() if m else ""
    nombre_pm = name.text.strip() if name is not None else ""
    if not cadena:
        cadena = nombre_pm
    if not sucursal:
        sucursal = nombre_pm
    records.append({"cadena": cadena, "sucursal": sucursal, "estado": estado,
                    "lat": float(lat), "lng": float(lng)})

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": "Bearer " + SUPABASE_KEY,
    "Content-Type": "application/json",
    "Prefer": "return=minimal"
}

BATCH = 50
for i in range(0, len(records), BATCH):
    batch = records[i:i+BATCH]
    r = requests.post(SUPABASE_URL + "/rest/v1/competencia_carnicerias",
                      json=batch, headers=headers)
    print("Batch " + str(i//BATCH+1) + ": " + str(r.status_code) + " — " + str(len(batch)) + " registros")

print("Total subido: " + str(len(records)) + " carnecerias")
