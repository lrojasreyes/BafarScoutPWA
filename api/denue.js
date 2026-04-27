export const config = { runtime: 'edge' };

const FETCH_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "application/json, text/plain, */*",
  "Accept-Language": "es-MX,es;q=0.9",
  "Referer": "https://www.inegi.org.mx/app/mapa/denue/",
  "Origin": "https://www.inegi.org.mx"
};

// 6 grouped searches to stay within Vercel Free 10s timeout.
// Each group targets specific SCIAN codes extracted from CLEE field.
const BUSQUEDAS = [
  { termino: "restaurante tacos",   scian: new Set(["722511","722512","722513","722514","722516","722519"]) },
  { termino: "cafeteria comedor",   scian: new Set(["722515","722310","722320"]) },
  { termino: "bar cantina",         scian: new Set(["722412","722330"]) },
  { termino: "pizza carnitas",      scian: new Set(["722517","722518"]) },
  { termino: "carniceria pescado",  scian: new Set(["461121","461123"]) },
  { termino: "abarrotes minisuper", scian: new Set(["461150"]) }
];

export default async function handler(req) {
  if(req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }

  try {
    const { lat, lng, radio, token: clientToken } = await req.json();
    const token = clientToken || "0e4c4af9-a631-4f6d-8c35-2d2eb7314785";

    const results = await Promise.all(BUSQUEDAS.map(async ({ termino, scian }) => {
      const url = `https://www.inegi.org.mx/app/api/denue/v1/consulta/buscar/${encodeURIComponent(termino)}/${lat},${lng}/${radio}/${token}`;
      const resp = await fetch(url, { headers: FETCH_HEADERS });
      const data = await resp.json().catch(() => []);
      if(!Array.isArray(data)) return [];
      return data
        .map(function(d) {
          const clee = d.CLEE || '';
          const code = clee.length >= 11 ? clee.substring(5, 11) : '';
          return Object.assign({}, d, { _scian: code });
        })
        .filter(function(d) { return scian.has(d._scian); });
    }));

    // Deduplicate across all groups by Id
    const seen = new Set();
    const flat = results.flat().filter(function(d) {
      const id = d.Id || d.id;
      if(!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });

    console.log('[DENUE API] per group:', results.map((r,i)=>BUSQUEDAS[i].termino+':'+r.length).join(' | '), '| total:', flat.length);

    return new Response(JSON.stringify(flat), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch(e) {
    console.log('[DENUE API] error:', e.message);
    return new Response(JSON.stringify([]), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}
