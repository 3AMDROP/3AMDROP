const { createAdminSupabaseClient } = require("../../_lib/clients");
const { requireAdminUser } = require("../../_lib/auth");
const { allowMethod, readJsonBody, sendJson } = require("../../_lib/http");
const { sanitizeOrder } = require("../../_lib/orders");

module.exports = async (req, res) => {
  if (!allowMethod(req, res, "POST")) {
    return;
  }

  try {
    await requireAdminUser(req);
    const { orderId, orderStatus, paymentStatus, internalNote } = await readJsonBody(req);

    if (!orderId) {
      sendJson(res, 400, { error: "Order ID is required." });
      return;
    }

    const updates = {
      updated_at: new Date().toISOString()
    };

    if (orderStatus) {
      updates.order_status = String(orderStatus).trim();
    }

    if (paymentStatus) {
      updates.payment_status = String(paymentStatus).trim();
    }

    if (typeof internalNote === "string") {
      updates.internal_note = internalNote.trim();
    }

    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
      .from("orders")
      .update(updates)
      .eq("id", orderId)
      .select("*")
      .single();

    if (error || !data) {
      sendJson(res, 404, { error: error?.message || "Order not found." });
      return;
    }

    sendJson(res, 200, {
      order: sanitizeOrder(data)
    });
  } catch (error) {
    sendJson(res, 401, { error: error.message || "Unauthorized." });
  }
};
