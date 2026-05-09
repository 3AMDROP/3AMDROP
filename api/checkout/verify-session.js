const Stripe = require("stripe");

const { createAdminSupabaseClient } = require("../_lib/clients");
const { allowMethod, readJsonBody, sendJson } = require("../_lib/http");

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

function getStripeClient() {
  if (!stripeSecretKey) {
    throw new Error("Stripe is not configured yet.");
  }

  return new Stripe(stripeSecretKey);
}

async function readRawBody(req) {
  if (typeof req.body === "string") {
    return req.body;
  }

  if (Buffer.isBuffer(req.body)) {
    return req.body.toString("utf8");
  }

  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

async function updateOrderFromSession(session) {
  const orderId = session.metadata?.order_id || session.client_reference_id;

  if (!orderId) {
    throw new Error("Stripe session does not include an order reference.");
  }

  const paymentStatus = String(session.payment_status || "unpaid").toLowerCase();
  const isPaid = paymentStatus === "paid";

  const supabase = createAdminSupabaseClient();
  const { error } = await supabase
    .from("orders")
    .update({
      payment_status: paymentStatus,
      order_status: isPaid ? "paid" : "payment_review",
      updated_at: new Date().toISOString(),
      provider: "stripe",
      provider_reference: session.id
    })
    .eq("id", orderId);

  if (error) {
    throw new Error(error.message || "Could not update order payment status.");
  }

  return {
    orderId,
    sessionId: session.id,
    status: paymentStatus,
    success: isPaid
  };
}

module.exports = async (req, res) => {
  if (!allowMethod(req, res, ["GET", "POST"])) {
    return;
  }

  try {
    const stripe = getStripeClient();
    const signature = req.headers["stripe-signature"];
    const isWebhook = req.method === "POST" && Boolean(signature);

    if (isWebhook) {
      if (!stripeWebhookSecret) {
        sendJson(res, 500, { error: "Stripe webhook secret is not configured yet." });
        return;
      }

      const rawBody = await readRawBody(req);
      const event = stripe.webhooks.constructEvent(rawBody, signature, stripeWebhookSecret);

      if (
        event.type === "checkout.session.completed" ||
        event.type === "checkout.session.async_payment_succeeded" ||
        event.type === "checkout.session.async_payment_failed"
      ) {
        const result = await updateOrderFromSession(event.data.object);
        sendJson(res, 200, { received: true, ...result });
        return;
      }

      sendJson(res, 200, { received: true, ignored: true, type: event.type });
      return;
    }

    const body = req.method === "POST" ? await readJsonBody(req) : {};
    const sessionId = body.session_id || req.query?.session_id;

    if (!sessionId) {
      sendJson(res, 400, { error: "Stripe session ID is required." });
      return;
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const result = await updateOrderFromSession(session);
    sendJson(res, 200, result);
  } catch (error) {
    console.error(error);
    sendJson(res, 500, { error: error.message || "Stripe session verification failed." });
  }
};
