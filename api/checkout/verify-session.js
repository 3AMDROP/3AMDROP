const Stripe = require("stripe");

const { createAdminSupabaseClient } = require("../_lib/clients");
const { allowMethod, readJsonBody, sendJson } = require("../_lib/http");

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

function getStripeClient() {
  if (!stripeSecretKey) {
    throw new Error("Stripe is not configured yet.");
  }

  return new Stripe(stripeSecretKey);
}

module.exports = async (req, res) => {
  if (!allowMethod(req, res, ["GET", "POST"])) {
    return;
  }

  try {
    const body = req.method === "POST" ? await readJsonBody(req) : {};
    const sessionId = body.session_id || req.query?.session_id;

    if (!sessionId) {
      sendJson(res, 400, { error: "Stripe session ID is required." });
      return;
    }

    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const orderId = session.metadata?.order_id || session.client_reference_id;

    if (!orderId) {
      sendJson(res, 400, { error: "Stripe session does not include an order reference." });
      return;
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
      sendJson(res, 500, { error: error.message || "Could not update order payment status." });
      return;
    }

    sendJson(res, 200, {
      orderId,
      sessionId: session.id,
      status: paymentStatus,
      success: isPaid
    });
  } catch (error) {
    console.error(error);
    sendJson(res, 500, { error: error.message || "Stripe session verification failed." });
  }
};
