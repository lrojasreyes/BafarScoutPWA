import { randomBytes } from 'crypto';

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

function generarPasswordTemporal() {
  // 10 caracteres alfanuméricos sin ambigüedades (sin 0/O/l/I)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const bytes = randomBytes(10);
  return Array.from(bytes).map(b => chars[b % chars.length]).join('');
}

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
  const claims = decodeJWT(token);
  if (!claims || !claims.email) { res.status(401).json({ error: "Token inválido" }); return; }

  const callerEmail = claims.email;
  const prUrl = `${SURL}/rest/v1/perfiles?email=eq.${encodeURIComponent(callerEmail)}&select=rol,activo`;
  const pr = await fetch(prUrl, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }
  });
  const prRows = pr.ok ? await pr.json() : [];
  const [callerPerfil] = Array.isArray(prRows) ? prRows : [];
  if (!callerPerfil || callerPerfil.rol !== "admin" || !callerPerfil.activo) {
    res.status(403).json({ error: "Solo administradores pueden crear usuarios" }); return;
  }

  const { email, rol = "usuario" } = req.body;
  if (!email) { res.status(400).json({ error: "Email requerido" }); return; }
  if (!["admin","director","usuario"].includes(rol)) {
    res.status(400).json({ error: "Rol invalido" }); return;
  }

  const passwordTemporal = generarPasswordTemporal();

  // Crear usuario via Admin API (no requiere cuota de invitaciones)
  console.log('[invite] v2 — llamando /auth/v1/admin/users para:', email);
  const response = await fetch(`${SURL}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email,
      password: passwordTemporal,
      email_confirm: true,
      user_metadata: { rol, invitado: true }
    })
  });

  const body = await response.json().catch(() => ({}));
  console.log('[invite] status:', response.status);
  console.log('[invite] body:', JSON.stringify(body));

  if (!response.ok) {
    if (response.status === 422 || (body.msg||body.message||"").toLowerCase().includes("already")) {
      res.status(400).json({ error: "El usuario ya existe con ese email" }); return;
    }
    res.status(400).json({ error: body.msg || body.message || "Error al crear usuario (status "+response.status+")" }); return;
  }

  // Insertar/actualizar en perfiles
  if (body.id) {
    await fetch(`${SURL}/rest/v1/perfiles`, {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates"
      },
      body: JSON.stringify({ user_id: body.id, email, rol, activo: true })
    });
  }

  res.status(200).json({ ok: true, email, passwordTemporal });
}
