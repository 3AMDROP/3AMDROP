const { createPublicSupabaseClient } = require("../_lib/clients");
const { sendWelcomeEmail } = require("../_lib/email");
const { allowMethod, readJsonBody, sendJson } = require("../_lib/http");
const { sanitizeSession, sanitizeUser } = require("../_lib/auth");

async function verifyEmailOtp(supabase, email, token) {
  const verificationTypes = ["email", "signup"];
  let lastError = null;

  for (const type of verificationTypes) {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type
    });

    if (!error && data?.session && data?.user) {
      return { data, type };
    }

    lastError = error || new Error("Verification failed.");
  }

  throw lastError;
}

async function verifyEmailTokenHash(supabase, tokenHash, type) {
  const verificationTypes = [type, "email", "signup"].filter(Boolean);
  let lastError = null;

  for (const verificationType of verificationTypes) {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: verificationType
    });

    if (!error && data?.session && data?.user) {
      return { data, type: verificationType };
    }

    lastError = error || new Error("Verification failed.");
  }

  throw lastError;
}

module.exports = async (req, res) => {
  if (!allowMethod(req, res, "POST")) {
    return;
  }

  try {
    const { email, token, tokenHash, type } = await readJsonBody(req);
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedToken = String(token || "").trim();
    const normalizedTokenHash = String(tokenHash || "").trim();

    if (!normalizedTokenHash && (!normalizedEmail || !normalizedToken)) {
      sendJson(res, 400, { error: "Email and verification code are required." });
      return;
    }

    const supabase = createPublicSupabaseClient();
    const { data } = normalizedTokenHash
      ? await verifyEmailTokenHash(supabase, normalizedTokenHash, String(type || "").trim())
      : await verifyEmailOtp(supabase, normalizedEmail, normalizedToken);

    let welcomeEmailSent = true;

    try {
      await sendWelcomeEmail({
        email: normalizedEmail,
        fullName: data.user.user_metadata?.full_name || ""
      });
    } catch (emailError) {
      welcomeEmailSent = false;
      console.error("Welcome email failed:", emailError);
    }

    sendJson(res, 200, {
      user: sanitizeUser(data.user),
      session: sanitizeSession(data.session),
      welcomeEmailSent
    });
  } catch (error) {
    console.error(error);
    sendJson(res, 400, { error: error.message || "Email verification failed." });
  }
};
