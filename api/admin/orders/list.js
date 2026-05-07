const { createAdminSupabaseClient } = require("../../_lib/clients");
const { requireAdminUser } = require("../../_lib/auth");
const { allowMethod, sendJson } = require("../../_lib/http");
const { sanitizeOrder } = require("../../_lib/orders");

module.exports = async (req, res) => {
  if (!allowMethod(req, res, "GET")) {
    return;
  }

  try {
    await requireAdminUser(req);

    const status = req.query?.status ? String(req.query.status).trim() : "";
    const paymentStatus = req.query?.payment_status ? String(req.query.payment_status).trim() : "";
    const supabase = createAdminSupabaseClient();

    let query = supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (status) {
      query = query.eq("order_status", status);
    }

    if (paymentStatus) {
      query = query.eq("payment_status", paymentStatus);
    }

    const { data, error } = await query;

    if (error) {
      sendJson(res, 500, { error: error.message || "Could not load admin orders." });
      return;
    }

    sendJson(res, 200, {
      orders: (data || []).map(sanitizeOrder)
    });
  } catch (error) {
    sendJson(res, 401, { error: error.message || "Unauthorized." });
  }
};
