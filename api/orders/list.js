const { createAdminSupabaseClient } = require("../_lib/clients");
const { requireAuthenticatedUser } = require("../_lib/auth");
const { allowMethod, sendJson } = require("../_lib/http");
const { sanitizeOrder } = require("../_lib/orders");

module.exports = async (req, res) => {
  if (!allowMethod(req, res, "GET")) {
    return;
  }

  try {
    const user = await requireAuthenticatedUser(req);
    const supabase = createAdminSupabaseClient();

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(25);

    if (error) {
      sendJson(res, 500, { error: error.message || "Could not load orders." });
      return;
    }

    sendJson(res, 200, {
      orders: (data || []).map(sanitizeOrder)
    });
  } catch (error) {
    sendJson(res, 401, { error: error.message || "Unauthorized." });
  }
};
