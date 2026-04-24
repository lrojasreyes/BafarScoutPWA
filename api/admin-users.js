const SURL = "https://pjacmizmjsjwxtoldpvr.supabase.co";

function decodeJWT(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString();
    return JSON.parse(payload);
  } catch(e) { return null; }
}

async function verificarAdmin(token, serviceKey) {
  const claims = decodeJWT(token);
  if (!claims || !claims.sub) return null;
  const userId = claims.sub;

  const pr = await fetch(`${SURL}/rest/v1/perfiles?user_id=eq.${userId}&select=rol,activo`, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }
  });
  if (!pr.ok) return null;
  const rows = await pr.json();
  if (!Array.isArray(rows)) return null;
  const [perfil] = rows;
  if (!perfil || perfil.rol !== "admin" || !perfil.activo) return null;
  return { id: userId };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,PATCH,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  if (req.method === "OPTIONS") { res.status(200).end(); return; }

  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  if (!serviceKey) { res.status(500).json({ error: "SUPABASE_SERVICE_KEY no configurada en Vercel" }); return; }

  const token = (req.headers.authorization || "").replace("Bearer ", "");
  const admin = await verificarAdmin(token, serviceKey);
  if (!admin) { res.status(403).json({ error: "Acceso solo para administradores" }); return; }

  if (req.method === "GET") {
    const r = await fetch(`${SURL}/rest/v1/perfiles?select=*&order=fecha_creacion`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }
    });
    const usuarios = await r.json();
    res.status(200).json(Array.isArray(usuarios) ? usuarios : []);
    return;
  }

  if (req.method === "PATCH") {
    const { user_id, ...campos } = req.body;
    if (!user_id) { res.status(400).json({ error: "user_id requerido" }); return; }
    const camposPermitidos = {};
    if (campos.rol !== undefined) camposPermitidos.rol = campos.rol;
    if (campos.activo !== undefined) camposPermitidos.activo = campos.activo;
    const r = await fetch(`${SURL}/rest/v1/perfiles?user_id=eq.${user_id}`, {
      method: "PATCH",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(camposPermitidos)
    });
    if (!r.ok) { res.status(400).json({ error: "Error actualizando perfil" }); return; }
    res.status(200).json({ ok: true });
    return;
  }

  res.status(405).end();
}
