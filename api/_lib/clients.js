const { createClient } = require("@supabase/supabase-js");
const { Resend } = require("resend");

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

function createResendClient() {
  const apiKey = requireEnv("RESEND_API_KEY");
  return new Resend(apiKey);
}

function createOptionalResendClient() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return null;
  }

  return new Resend(apiKey);
}

function getAppName() {
  return process.env.PUBLIC_APP_NAME || "3AM Worldwide";
}

function getFromEmail() {
  return requireEnv("RESEND_FROM_EMAIL");
}

module.exports = {
  createAdminSupabaseClient,
  createOptionalResendClient,
  createPublicSupabaseClient,
  createResendClient,
  getAppName,
  getFromEmail,
  requireEnv
};
