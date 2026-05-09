const { createPublicSupabaseClient } = require("../_lib/clients");
const { allowMethod, readJsonBody, sendJson } = require("../_lib/http");
const { sanitizeSession, sanitizeUser } = require("../_lib/auth");

module.exports = async (req, res) => {
  if (!allowMethod(req, res, "POST")) {
    return;
  }

  try {
    const { fullName, email, password } = await readJsonBody(req);
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedName = String(fullName || "").trim();

    if (!normalizedName || !normalizedEmail || !password) {
      sendJson(res, 400, { error: "Full name, email, and password are required." });
      return;
    }

    if (String(password).length < 8) {
      sendJson(res, 400, { error: "Password must be at least 8 characters." });
      return;
    }

    const publicClient = createPublicSupabaseClient();
    const { data, error: signUpError } = await publicClient.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          full_name: normalizedName
        }
      }
    });

    if (signUpError) {
      const isDuplicate = signUpError.message?.toLowerCase().includes("already");
      sendJson(res, isDuplicate ? 409 : 400, {
        error: isDuplicate ? "This email is already registered." : signUpError.message
      });
      return;
    }

    sendJson(res, 201, {
      requiresEmailVerification: !data.session,
      email: normalizedEmail,
      user: data.user ? sanitizeUser(data.user) : null,
      session: data.session ? sanitizeSession(data.session) : null,
      message: data.session
        ? "Account created successfully."
        : "We sent a verification code to your email. Enter it below to confirm your account."
    });
  } catch (error) {
    console.error(error);
    sendJson(res, 500, { error: error.message || "Registration failed." });
  }
};
