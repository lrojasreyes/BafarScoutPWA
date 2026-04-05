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
    const { lat, lng } = await req.json();

    // API INEGI Marco Geoestadistico - obtiene AGEB por coordenada
    const url = `https://gaia.inegi.org.mx/wscatgeo/mgservicios/busquedaGeocod/?latitud=${lat}&longitud=${lng}&token=c0b8f7d2-ece0-4a58-84f5-4c3d1e9e5f2b`;

    const resp = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0'
      }
    });

    const data = await resp.json().catch(() => null);

    // Extraer clave AGEB para buscar población
    if(data && data.result && data.result.length > 0) {
      const ageb = data.result[0];
      const claveAgeb = ageb.cve_ageb || '';
      const cveEnt = ageb.cve_ent || '';
      const cveMun = ageb.cve_mun || '';
      const cveLoc = ageb.cve_loc || '';

      // API de indicadores de población
      const indUrl = `https://www.inegi.org.mx/app/api/indicadores/desarrolladores/jsonxml/INDICADOR/1002000001,1002000002/${cveEnt}${cveMun}${cveLoc}${claveAgeb}/false/es/2.0/0000.json`;

      const indResp = await fetch(indUrl, {
        headers: { 'Accept': 'application/json' }
      });
      const indData = await indResp.json().catch(() => null);

      if(indData && indData.Series) {
        const series = indData.Series;
        const pobSerie = series.find(s => s.INDICADOR === '1002000001');
        const vivSerie = series.find(s => s.INDICADOR === '1002000002');
        const pob = pobSerie?.OBSERVATIONS?.[0]?.OBS_VALUE || 0;
        const viv = vivSerie?.OBSERVATIONS?.[0]?.OBS_VALUE || 0;

        return new Response(JSON.stringify({ pob: parseInt(pob), viv: parseInt(viv), ageb: claveAgeb }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    return new Response(JSON.stringify({ pob: 0, viv: 0 }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });

  } catch(e) {
    return new Response(JSON.stringify({ pob: 0, viv: 0 }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}
