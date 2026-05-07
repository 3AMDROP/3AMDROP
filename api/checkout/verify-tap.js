const { createAdminSupabaseClient } = require("../_lib/clients");
const { readJsonBody, sendJson } = require("../_lib/http");
const { verifyTapChargeHash } = require("../_lib/tap");

const tapSecretKey = process.env.TAP_SECRET_KEY;

async function fetchTapCharge(chargeId) {
  const response = await fetch(`https://api.tap.company/v2/charges/${chargeId}`, {
    headers: {
      Authorization: `Bearer ${tapSecretKey}`
    }
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.errors?.[0]?.description || data?.message || "Could not verify Tap payment.");
  }

  return data;
}

module.exports = async (req, res) => {
  if (!["POST", "GET"].includes(req.method)) {
    res.setHeader("Allow", "GET, POST");
    sendJson(res, 405, { error: `Method ${req.method} not allowed.` });
    return;
  }

  if (!tapSecretKey) {
    sendJson(res, 500, { error: "Tap is not configured yet." });
    return;
  }

  try {
    const body = req.method === "POST" ? await readJsonBody(req) : {};
    const tapId = body.tap_id || body.id || req.query?.tap_id;
    const isWebhookPayload = req.method === "POST" && body.id && body.status;
    const charge = isWebhookPayload ? body : await fetchTapCharge(tapId);
    const orderId = charge.metadata?.order_id || charge.reference?.order;

    if (isWebhookPayload) {
      const headerHashString = req.headers.hashstring || req.headers.hashString;

      if (!headerHashString) {
        sendJson(res, 401, { error: "Tap webhook hashstring header is missing." });
        return;
      }

      const valid = verifyTapChargeHash({
        charge,
        secretKey: tapSecretKey,
        headerHashString
      });

      if (!valid) {
        sendJson(res, 401, { error: "Tap webhook signature validation failed." });
        return;
      }
    }

    if (!tapId && !charge.id) {
      sendJson(res, 400, { error: "Tap charge ID is required." });
      return;
    }

    if (!orderId) {
      sendJson(res, 400, { error: "Tap charge does not include an order reference." });
      return;
    }

    const normalizedStatus = String(charge.status || "unknown").toUpperCase();
    const isCaptured = normalizedStatus === "CAPTURED";

    const supabase = createAdminSupabaseClient();
    const { error } = await supabase
      .from("orders")
      .update({
        payment_status: normalizedStatus.toLowerCase(),
        order_status: isCaptured ? "paid" : "payment_review",
        updated_at: new Date().toISOString(),
        provider: "tap",
        provider_reference: charge.id
      })
      .eq("id", orderId);

    if (error) {
      sendJson(res, 500, { error: error.message || "Could not update order payment status." });
      return;
    }

    sendJson(res, 200, {
      orderId,
      tapId: charge.id,
      status: normalizedStatus,
      success: isCaptured
    });
  } catch (error) {
    console.error(error);
    sendJson(res, 500, { error: error.message || "Tap verification failed." });
  }
};
