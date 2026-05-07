const { createPublicSupabaseClient } = require("../_lib/clients");
const { allowMethod, readJsonBody, sendJson } = require("../_lib/http");
const { sanitizeSession, sanitizeUser } = require("../_lib/auth");

module.exports = async (req, res) => {
  if (!allowMethod(req, res, "POST")) {
    return;
  }

  try {
    const { session } = await readJsonBody(req);

    if (!session?.access_token || !session?.refresh_token) {
      sendJson(res, 400, { error: "Session tokens are required." });
      return;
    }

    const supabase = createPublicSupabaseClient();
    const { data, error } = await supabase.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token
    });

    if (error || !data.session || !data.user) {
      sendJson(res, 401, { error: error?.message || "Session could not be restored." });
      return;
    }

    sendJson(res, 200, {
      user: sanitizeUser(data.user),
      session: sanitizeSession(data.session)
    });
  } catch (error) {
    console.error(error);
    sendJson(res, 500, { error: error.message || "Session restore failed." });
  }
};
