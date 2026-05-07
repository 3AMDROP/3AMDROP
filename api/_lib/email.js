const { createResendClient, getAppName, getFromEmail } = require("./clients");

async function sendWelcomeEmail({ email, fullName }) {
  const resend = createResendClient();
  const appName = getAppName();
  const from = getFromEmail();
  const greetingName = fullName || "there";

  return resend.emails.send({
    from,
    to: [email],
    subject: `Welcome to ${appName}`,
    html: `
      <div style="font-family: Arial, sans-serif; background: #050505; color: #f3eee7; padding: 32px;">
        <p style="letter-spacing: 0.2em; text-transform: uppercase; color: #d8d0c5; font-size: 12px; margin: 0 0 18px;">${appName}</p>
        <h1 style="margin: 0 0 18px; font-size: 32px; line-height: 1.1;">Welcome, ${greetingName}.</h1>
        <p style="margin: 0 0 14px; color: #b8b0a5; line-height: 1.7;">
          Your account is now active and ready for future drops, product updates, and order access.
        </p>
        <p style="margin: 0; color: #b8b0a5; line-height: 1.7;">
          Thanks for joining ${appName}. We are glad to have you inside the brand.
        </p>
      </div>
    `
  });
}

module.exports = {
  sendWelcomeEmail
};
