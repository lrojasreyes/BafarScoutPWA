const SURL = "https://pjacmizmjsjwxtoldpvr.supabase.co";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  if (req.method === "OPTIONS") { res.status(200).end(); return; }
  if (req.method !== "POST") { res.status(405).end(); return; }

  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  if (!serviceKey) { res.status(500).json({ error: "SUPABASE_SERVICE_KEY no configurada en Vercel" }); return; }

  // Verificar que el caller es admin
  const token = (req.headers.authorization || "").replace("Bearer ", "");
  const ur = await fetch(`${SURL}/auth/v1/user`, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${token}` }
  });
  if (!ur.ok) { res.status(401).json({ error: "No autorizado" }); return; }
  const caller = await ur.json();

  const pr = await fetch(`${SURL}/rest/v1/perfiles?user_id=eq.${caller.id}&select=rol,activo`, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }
  });
  const [perfil] = await pr.json();
  if (!perfil || perfil.rol !== "admin" || !perfil.activo) {
    res.status(403).json({ error: "Solo administradores pueden invitar usuarios" }); return;
  }

  const { email, rol = "usuario" } = req.body;
  if (!email) { res.status(400).json({ error: "Email requerido" }); return; }
  if (!["admin","director","usuario"].includes(rol)) {
    res.status(400).json({ error: "Rol invalido" }); return;
  }

  // Enviar invitacion via Supabase Admin API
  const ir = await fetch(`${SURL}/auth/v1/invite`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email })
  });

  if (!ir.ok) {
    const err = await ir.json();
    res.status(400).json({ error: err.msg || err.message || "Error al enviar invitacion" }); return;
  }
  const invited = await ir.json();

  // Crear perfil para el usuario invitado
  if (invited.id) {
    await fetch(`${SURL}/rest/v1/perfiles`, {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates"
      },
      body: JSON.stringify({ user_id: invited.id, email, rol, activo: true })
    });
  }

  res.status(200).json({ ok: true, email });
}
