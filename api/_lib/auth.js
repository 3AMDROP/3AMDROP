const { createPublicSupabaseClient } = require("./clients");

function sanitizeUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    fullName: user.user_metadata?.full_name || user.user_metadata?.name || "",
    createdAt: user.created_at
  };
}

function sanitizeSession(session) {
  if (!session) {
    return null;
  }

  return {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at,
    expires_in: session.expires_in,
    token_type: session.token_type
  };
}

function getBearerToken(req) {
  const header = req.headers.authorization || "";

  if (!header.startsWith("Bearer ")) {
    return null;
  }

  return header.slice(7);
}

async function requireAuthenticatedUser(req) {
  const accessToken = getBearerToken(req);

  if (!accessToken) {
    throw new Error("Authorization token is required.");
  }

  const supabase = createPublicSupabaseClient();
  const { data, error } = await supabase.auth.getUser(accessToken);

  if (error || !data.user) {
    throw new Error(error?.message || "Invalid or expired session.");
  }

  return data.user;
}

function getAdminEmails() {
  return String(process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

async function requireAdminUser(req) {
  const user = await requireAuthenticatedUser(req);
  const adminEmails = getAdminEmails();

  if (!adminEmails.length) {
    throw new Error("No admin emails are configured.");
  }

  if (!adminEmails.includes(String(user.email || "").toLowerCase())) {
    throw new Error("Admin access required.");
  }

  return user;
}

module.exports = {
  getBearerToken,
  requireAdminUser,
  requireAuthenticatedUser,
  sanitizeSession,
  sanitizeUser
};
