const { createClient } = require("@supabase/supabase-js");

function requireEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function createPublicSupabaseClient() {
  const url = requireEnv("SUPABASE_URL");
  const anonKey = requireEnv("SUPABASE_ANON_KEY");

  return createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  });
}

function createAdminSupabaseClient() {
  const url = requireEnv("SUPABASE_URL");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

function getAppName() {
  return process.env.PUBLIC_APP_NAME || "3AM Worldwide";
}

function getFromEmail() {
  return requireEnv("BREVO_FROM_EMAIL");
}

function createOptionalBrevoClient() {
  const apiKey = process.env.BREVO_API_KEY;

  if (!apiKey) {
    return null;
  }

  return {
    async sendEmail({ from, to, subject, html }) {
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": apiKey,
          accept: "application/json"
        },
        body: JSON.stringify({
          sender: normalizeSender(from),
          to: normalizeRecipients(to),
          subject,
          htmlContent: html
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Brevo email send failed (${response.status}): ${errorText}`);
      }

      return response.json();
    }
  };
}

function normalizeSender(from) {
  const match = String(from).match(/^(.*)<([^>]+)>$/);

  if (!match) {
    return { email: String(from).trim() };
  }

  return {
    name: match[1].trim().replace(/^"|"$/g, ""),
    email: match[2].trim()
  };
}

function normalizeRecipients(to) {
  return []
    .concat(to || [])
    .map((value) => String(value).trim())
    .filter(Boolean)
    .map((email) => ({ email }));
}

module.exports = {
  createAdminSupabaseClient,
  createOptionalBrevoClient,
  createPublicSupabaseClient,
  getAppName,
  getFromEmail,
  requireEnv
};
