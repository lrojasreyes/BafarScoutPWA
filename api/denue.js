export const config = { runtime: 'edge' };

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
    const { lat, lng, radio, scian, token } = await req.json();
    const url = `https://www.inegi.org.mx/app/api/denue/v1/consulta/Buscar/${scian}/${lat},${lng}/${radio}/${token}`;

    const resp = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "es-MX,es;q=0.9",
        "Referer": "https://www.inegi.org.mx/app/mapa/denue/",
        "Origin": "https://www.inegi.org.mx"
      }
    });

    const data = await resp.json().catch(() => []);

    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch(e) {
    return new Response(JSON.stringify([]), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}
