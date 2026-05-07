const { createPublicSupabaseClient } = require("../_lib/clients");
const { allowMethod, readJsonBody, sendJson } = require("../_lib/http");

module.exports = async (req, res) => {
  if (!allowMethod(req, res, "POST")) {
    return;
  }

  try {
    const { session } = await readJsonBody(req);

    if (!session?.access_token || !session?.refresh_token) {
      sendJson(res, 200, { ok: true });
      return;
    }

    const supabase = createPublicSupabaseClient();
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token
    });

    if (!sessionError) {
      await supabase.auth.signOut({ scope: "local" });
    }

    sendJson(res, 200, { ok: true });
  } catch (error) {
    console.error(error);
    sendJson(res, 500, { error: error.message || "Logout failed." });
  }
};
