// Beacon — admin-only operator management (BCN-ID-10)
// Actions: list | add | remove. Caller must be an authenticated operator with role 'admin'.
// Uses the service role (server-side only) to look users up by email and write operator_roles.
import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const ROLES = ["operator", "supervisor", "admin"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

    // --- authenticate caller & require admin role ---
    const token = (req.headers.get("Authorization") || "").replace("Bearer ", "");
    if (!token) return json({ error: "Not signed in" }, 401);
    const { data: { user }, error: uErr } = await admin.auth.getUser(token);
    if (uErr || !user) return json({ error: "Not signed in" }, 401);
    const { data: caller } = await admin.from("operator_roles").select("role").eq("user_id", user.id).maybeSingle();
    if (!caller || caller.role !== "admin") return json({ error: "Admins only" }, 403);

    const body = await req.json().catch(() => ({}));
    const action = body.action || "list";

    // helper: all operators with their emails
    async function listOperators() {
      const { data: roles } = await admin.from("operator_roles").select("user_id, role, created_at");
      const { data: usersPage } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const emailById: Record<string, string> = {};
      (usersPage?.users || []).forEach((u: any) => { emailById[u.id] = u.email || ""; });
      return (roles || []).map((r: any) => ({
        user_id: r.user_id,
        email: emailById[r.user_id] || "(unknown)",
        role: r.role,
        is_self: r.user_id === user.id,
      })).sort((a, b) => a.email.localeCompare(b.email));
    }

    if (action === "list") {
      return json({ operators: await listOperators() });
    }

    if (action === "add") {
      const email = String(body.email || "").trim().toLowerCase();
      const role = String(body.role || "operator");
      if (!/^\S+@\S+\.\S+$/.test(email)) return json({ error: "Enter a valid email" }, 400);
      if (!ROLES.includes(role)) return json({ error: "Invalid role" }, 400);
      const { data: usersPage } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const target = (usersPage?.users || []).find((u: any) => (u.email || "").toLowerCase() === email);
      if (!target) return json({ error: "No Beacon account with that email yet. Ask them to create an account in the app first, then add them." }, 404);
      const { error: wErr } = await admin.from("operator_roles").upsert({ user_id: target.id, role });
      if (wErr) return json({ error: wErr.message }, 500);
      return json({ ok: true, operators: await listOperators() });
    }

    if (action === "remove") {
      const targetId = String(body.user_id || "");
      if (!targetId) return json({ error: "Missing user" }, 400);
      if (targetId === user.id) return json({ error: "You can't remove yourself" }, 400);
      const { error: dErr } = await admin.from("operator_roles").delete().eq("user_id", targetId);
      if (dErr) return json({ error: dErr.message }, 500);
      return json({ ok: true, operators: await listOperators() });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    return json({ error: String((e as Error).message || e) }, 500);
  }
});
