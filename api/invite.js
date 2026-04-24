const SURL = "https://pjacmizmjsjwxtoldpvr.supabase.co";

function decodeJWT(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - b64.length % 4) % 4);
    return JSON.parse(Buffer.from(padded, 'base64').toString('utf8'));
  } catch(e) {
    console.log("[invite] Error decodificando JWT:", e.message);
    return null;
  }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  if (req.method === "OPTIONS") { res.status(200).end(); return; }
  if (req.method !== "POST") { res.status(405).end(); return; }

  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  console.log("[invite] serviceKey presente:", !!serviceKey);
  if (!serviceKey) { res.status(500).json({ error: "SUPABASE_SERVICE_KEY no configurada en Vercel" }); return; }

  const token = (req.headers.authorization || "").replace("Bearer ", "");
  const claims = decodeJWT(token);
  if (!claims || !claims.email) { res.status(401).json({ error: "Token inválido" }); return; }

  const email = claims.email;
  console.log("[invite] Verificando admin para email:", email);

  const url = `${SURL}/rest/v1/perfiles?email=eq.${encodeURIComponent(email)}&select=rol,activo`;
  const pr = await fetch(url, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }
  });

  console.log("[invite] perfiles status:", pr.status);
  const body = await pr.text();
  console.log("[invite] perfiles body:", body);

  const rows = pr.ok ? JSON.parse(body) : [];
  const [perfil] = Array.isArray(rows) ? rows : [];
  console.log("[invite] perfil:", JSON.stringify(perfil));

  if (!perfil || perfil.rol !== "admin" || !perfil.activo) {
    res.status(403).json({ error: "Solo administradores pueden invitar usuarios" }); return;
  }

  const { email: emailInvitado, rol = "usuario" } = req.body;
  if (!emailInvitado) { res.status(400).json({ error: "Email requerido" }); return; }
  if (!["admin","director","usuario"].includes(rol)) {
    res.status(400).json({ error: "Rol invalido" }); return;
  }

  const ir = await fetch(`${SURL}/auth/v1/invite`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email: emailInvitado })
  });

  if (!ir.ok) {
    const err = await ir.json();
    res.status(400).json({ error: err.msg || err.message || "Error al enviar invitacion" }); return;
  }
  const invited = await ir.json();

  if (invited.id) {
    await fetch(`${SURL}/rest/v1/perfiles`, {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates"
      },
      body: JSON.stringify({ user_id: invited.id, email: emailInvitado, rol, activo: true })
    });
  }

  res.status(200).json({ ok: true, email: emailInvitado });
}
