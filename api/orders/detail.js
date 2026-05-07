const { createAdminSupabaseClient } = require("../_lib/clients");
const { requireAuthenticatedUser } = require("../_lib/auth");
const { allowMethod, readJsonBody, sendJson } = require("../_lib/http");
const { sanitizeOrder } = require("../_lib/orders");

module.exports = async (req, res) => {
  if (!allowMethod(req, res, "POST")) {
    return;
  }

  try {
    const user = await requireAuthenticatedUser(req);
    const { orderId } = await readJsonBody(req);

    if (!orderId) {
      sendJson(res, 400, { error: "Order ID is required." });
      return;
    }

    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .eq("user_id", user.id)
      .single();

    if (error || !data) {
      sendJson(res, 404, { error: "Order not found." });
      return;
    }

    sendJson(res, 200, {
      order: sanitizeOrder(data)
    });
  } catch (error) {
    sendJson(res, 401, { error: error.message || "Unauthorized." });
  }
};
