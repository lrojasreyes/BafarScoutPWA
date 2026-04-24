const SURL = "https://pjacmizmjsjwxtoldpvr.supabase.co";

function decodeJWT(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - b64.length % 4) % 4);
    return JSON.parse(Buffer.from(padded, 'base64').toString('utf8'));
  } catch(e) {
    console.log("[admin-users] Error decodificando JWT:", e.message);
    return null;
  }
}

async function verificarAdmin(token, serviceKey) {
  const claims = decodeJWT(token);
  if (!claims) { console.log("[admin-users] JWT inválido"); return null; }

  const email = claims.email;
  const sub   = claims.sub;
  console.log("[admin-users] JWT sub:", sub, "email:", email);

  if (!email) { console.log("[admin-users] Sin email en JWT"); return null; }

  // Buscar por email (más robusto que user_id si hay inconsistencia de UUIDs)
  const url = `${SURL}/rest/v1/perfiles?email=eq.${encodeURIComponent(email)}&select=rol,activo,user_id`;
  console.log("[admin-users] Consultando:", url);

  const pr = await fetch(url, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }
  });

  console.log("[admin-users] perfiles status:", pr.status);
  const body = await pr.text();
  console.log("[admin-users] perfiles body:", body);

  if (!pr.ok) return null;

  let rows;
  try { rows = JSON.parse(body); } catch(e) { return null; }

  if (!Array.isArray(rows)) { console.log("[admin-users] rows no es array"); return null; }

  const [perfil] = rows;
  console.log("[admin-users] perfil:", JSON.stringify(perfil));

  if (!perfil || perfil.rol !== "admin" || !perfil.activo) {
    console.log("[admin-users] RECHAZADO rol:", perfil?.rol, "activo:", perfil?.activo);
    return null;
  }
  return { id: sub, email };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,PATCH,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  if (req.method === "OPTIONS") { res.status(200).end(); return; }

  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  console.log("[admin-users] serviceKey presente:", !!serviceKey);
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
