export const config = { runtime: 'edge' };

const FETCH_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "application/json, text/plain, */*",
  "Accept-Language": "es-MX,es;q=0.9",
  "Referer": "https://www.inegi.org.mx/app/mapa/denue/",
  "Origin": "https://www.inegi.org.mx"
};

const BUSQUEDAS = [
  {
    termino: "restaurante",
    scian: new Set(["722511","722512","722513","722514","722515",
                    "722516","722517","722518","722519","722310",
                    "722320","722330","722412"])
  },
  {
    termino: "carniceria",
    scian: new Set(["461121","461123"])
  },
  {
    termino: "abarrotes",
    scian: new Set(["461150"])
  }
];

const withTimeout = (promise, ms) => Promise.race([
  promise,
  new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))
]);

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
      try {
        const url = `https://www.inegi.org.mx/app/api/denue/v1/consulta/buscar/${termino}/${lat},${lng}/${radio}/${token}`;
        const data = await withTimeout(
          fetch(url, { headers: FETCH_HEADERS }).then(r => r.json()),
          8000
        );
        if(!Array.isArray(data)) return [];
        return data
          .map(function(d) {
            const clee = d.CLEE || '';
            const code = clee.length >= 11 ? clee.substring(5, 11) : '';
            return Object.assign({}, d, { _scian: code });
          })
          .filter(function(d) { return scian.has(d._scian); });
      } catch(e) {
        console.log('[DENUE API] '+termino+' failed:', e.message);
        return [];
      }
    }));

    const seen = new Set();
    const flat = results.flat().filter(function(d) {
      const id = d.Id || d.id;
      if(!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });

    console.log('[DENUE API]', results.map((r,i)=>BUSQUEDAS[i].termino+':'+r.length).join(' | '), '| total:', flat.length);

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
