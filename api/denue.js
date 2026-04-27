export const config = { runtime: 'edge' };

const FETCH_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "application/json, text/plain, */*",
  "Accept-Language": "es-MX,es;q=0.9",
  "Referer": "https://www.inegi.org.mx/app/mapa/denue/",
  "Origin": "https://www.inegi.org.mx"
};

// Text terms that collectively cover all 16 target SCIAN codes
const SEARCH_TERMS = ['restaurante', 'carniceria', 'minisuper', 'cantina'];

// Whitelist of SCIAN codes relevant to BAFAR
const SCIAN_BAFAR = new Set([
  '461150','461121','461123',
  '722514','722515','722330','722517','722518',
  '722511','722512','722519','722516','722513',
  '722310','722320','722412'
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

    const results = await Promise.all(SEARCH_TERMS.map(async (term) => {
      const url = `https://www.inegi.org.mx/app/api/denue/v1/consulta/buscar/${term}/${lat},${lng}/${radio}/${token}`;
      const resp = await fetch(url, { headers: FETCH_HEADERS });
      const data = await resp.json().catch(() => []);
      if(!Array.isArray(data)) return [];
      return data
        .map(function(d) {
          const clee = d.CLEE || '';
          const scian = clee.length >= 11 ? clee.substring(5, 11) : '';
          return Object.assign({}, d, { _scian: scian });
        })
        .filter(function(d) { return SCIAN_BAFAR.has(d._scian); });
    }));

    // Deduplicate by Id across all search terms
    const seen = new Set();
    const flat = results.flat().filter(function(d) {
      const id = d.Id || d.id;
      if(!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });

    console.log('[DENUE API] terms:', SEARCH_TERMS.join(','), '| per term:', results.map(r=>r.length).join('/'), '| final:', flat.length);

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
