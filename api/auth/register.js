const { createAdminSupabaseClient, createPublicSupabaseClient } = require("../_lib/clients");
const { sendWelcomeEmail } = require("../_lib/email");
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

    const adminClient = createAdminSupabaseClient();
    const { error: createError } = await adminClient.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: normalizedName
      }
    });

    if (createError) {
      const isDuplicate = createError.message?.toLowerCase().includes("already");
      sendJson(res, isDuplicate ? 409 : 400, {
        error: isDuplicate ? "This email is already registered." : createError.message
      });
      return;
    }

    const publicClient = createPublicSupabaseClient();
    const { data, error: signInError } = await publicClient.auth.signInWithPassword({
      email: normalizedEmail,
      password
    });

    if (signInError || !data.session || !data.user) {
      sendJson(res, 500, {
        error: signInError?.message || "Account created, but the session could not be started."
      });
      return;
    }

    let welcomeEmailSent = true;

    try {
      await sendWelcomeEmail({
        email: normalizedEmail,
        fullName: normalizedName
      });
    } catch (emailError) {
      welcomeEmailSent = false;
      console.error("Welcome email failed:", emailError);
    }

    sendJson(res, 201, {
      user: sanitizeUser(data.user),
      session: sanitizeSession(data.session),
      welcomeEmailSent
    });
  } catch (error) {
    console.error(error);
    sendJson(res, 500, { error: error.message || "Registration failed." });
  }
};
