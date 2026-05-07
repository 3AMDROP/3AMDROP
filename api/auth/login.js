const { createPublicSupabaseClient } = require("../_lib/clients");
const { allowMethod, readJsonBody, sendJson } = require("../_lib/http");
const { sanitizeSession, sanitizeUser } = require("../_lib/auth");

module.exports = async (req, res) => {
  if (!allowMethod(req, res, "POST")) {
    return;
  }

  try {
    const { email, password } = await readJsonBody(req);
    const normalizedEmail = String(email || "").trim().toLowerCase();

    if (!normalizedEmail || !password) {
      sendJson(res, 400, { error: "Email and password are required." });
      return;
    }

    const supabase = createPublicSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password
    });

    if (error || !data.session || !data.user) {
      sendJson(res, 401, { error: error?.message || "Incorrect email or password." });
      return;
    }

    sendJson(res, 200, {
      user: sanitizeUser(data.user),
      session: sanitizeSession(data.session)
    });
  } catch (error) {
    console.error(error);
    sendJson(res, 500, { error: error.message || "Login failed." });
  }
};
