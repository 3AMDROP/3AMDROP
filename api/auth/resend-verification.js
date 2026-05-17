const { createPublicSupabaseClient } = require("../_lib/clients");
const { allowMethod, readJsonBody, sendJson } = require("../_lib/http");

module.exports = async (req, res) => {
  if (!allowMethod(req, res, "POST")) {
    return;
  }

  try {
    const { email } = await readJsonBody(req);
    const normalizedEmail = String(email || "").trim().toLowerCase();

    if (!normalizedEmail) {
      sendJson(res, 400, { error: "Email is required." });
      return;
    }

    const supabase = createPublicSupabaseClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: normalizedEmail
    });

    if (error) {
      sendJson(res, 400, { error: error.message || "Could not resend verification code." });
      return;
    }

    sendJson(res, 200, {
      message: "Verification code resent. Check your inbox, spam, and promotions folders."
    });
  } catch (error) {
    console.error(error);
    sendJson(res, 500, { error: error.message || "Could not resend verification code." });
  }
};
