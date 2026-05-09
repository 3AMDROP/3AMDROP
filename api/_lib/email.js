const { createResendClient, getAppName, getFromEmail } = require("./clients");

function getAdminRecipients() {
  return String(process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

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

async function sendNewOrderEmail({ order }) {
  const recipients = getAdminRecipients();

  if (!recipients.length) {
    return { skipped: true };
  }

  const resend = createResendClient();
  const appName = getAppName();
  const from = getFromEmail();
  const cartLines = Array.isArray(order.cart)
    ? order.cart.map((item) => `<li>${item.name} - ${item.size} x${item.quantity}</li>`).join("")
    : "";

  return resend.emails.send({
    from,
    to: recipients,
    subject: `New order received - ${order.id}`,
    html: `
      <div style="font-family: Arial, sans-serif; background: #050505; color: #f3eee7; padding: 32px;">
        <p style="letter-spacing: 0.2em; text-transform: uppercase; color: #d8d0c5; font-size: 12px; margin: 0 0 18px;">${appName} Order Alert</p>
        <h1 style="margin: 0 0 18px; font-size: 30px; line-height: 1.1;">New order received</h1>
        <p style="margin: 0 0 10px; color: #b8b0a5;">Order ID: <strong style="color:#f3eee7;">${order.id}</strong></p>
        <p style="margin: 0 0 10px; color: #b8b0a5;">Customer: <strong style="color:#f3eee7;">${order.customerName}</strong></p>
        <p style="margin: 0 0 10px; color: #b8b0a5;">Email: <strong style="color:#f3eee7;">${order.customerEmail}</strong></p>
        <p style="margin: 0 0 10px; color: #b8b0a5;">Phone: <strong style="color:#f3eee7;">${order.customerPhone}</strong></p>
        <p style="margin: 0 0 10px; color: #b8b0a5;">Location: <strong style="color:#f3eee7;">${order.shippingLocation}</strong></p>
        <p style="margin: 0 0 10px; color: #b8b0a5;">Address: <strong style="color:#f3eee7;">${order.shippingAddress}</strong></p>
        <p style="margin: 0 0 10px; color: #b8b0a5;">Payment: <strong style="color:#f3eee7;">${order.paymentMethod} / ${order.paymentStatus}</strong></p>
        <p style="margin: 0 0 18px; color: #b8b0a5;">Total: <strong style="color:#f3eee7;">${order.totalBhd} ${order.currency || "BHD"}</strong></p>
        <ul style="margin: 0; padding-left: 18px; color: #b8b0a5;">${cartLines}</ul>
      </div>
    `
  });
}

module.exports = {
  sendNewOrderEmail,
  sendWelcomeEmail
};
