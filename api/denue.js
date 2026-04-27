export const config = { runtime: 'edge' };

const FETCH_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "application/json, text/plain, */*",
  "Accept-Language": "es-MX,es;q=0.9",
  "Referer": "https://www.inegi.org.mx/app/mapa/denue/",
  "Origin": "https://www.inegi.org.mx"
};

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
    const { lat, lng, radio, scian, token: clientToken } = await req.json();
    const token = clientToken || "0e4c4af9-a631-4f6d-8c35-2d2eb7314785";

    // Accept array of SCIAN codes or legacy single string
    const codes = Array.isArray(scian) ? scian : [scian === 'restaurantes' ? 'restaurante' : scian];

    const results = await Promise.all(codes.map(async (code) => {
      const url = `https://www.inegi.org.mx/app/api/denue/v1/consulta/buscar/${encodeURIComponent(code)}/${lat},${lng}/${radio}/${token}`;
      const resp = await fetch(url, { headers: FETCH_HEADERS });
      const data = await resp.json().catch(() => []);
      if(!Array.isArray(data)) return [];
      // Tag each result with the SCIAN code that produced it
      return data.map(function(d) { return Object.assign({}, d, { _scian: code }); });
    }));

    return new Response(JSON.stringify(results.flat()), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch(e) {
    return new Response(JSON.stringify([]), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}
