const { createAdminSupabaseClient } = require("../_lib/clients");
const { allowMethod, readJsonBody, sendJson } = require("../_lib/http");

module.exports = async (req, res) => {
  if (!allowMethod(req, res, "POST")) {
    return;
  }

  try {
    const {
      user = null,
      cart = [],
      delivery = {},
      payment = {}
    } = await readJsonBody(req);

    if (!Array.isArray(cart) || !cart.length) {
      sendJson(res, 400, { error: "Your cart is empty." });
      return;
    }

    const customerName = String(delivery.customerName || "").trim();
    const customerPhone = String(delivery.phone || "").trim();
    const shippingLocation = String(delivery.location || "").trim();
    const shippingAddress = String(delivery.address || "").trim();
    const customerEmail = String(user?.email || "").trim().toLowerCase();
    const paymentMethod = String(payment.method || "").trim();
    const paymentStatus = String(payment.status || "pending").trim();
    const provider = payment.provider ? String(payment.provider).trim() : null;
    const providerReference = payment.reference ? String(payment.reference).trim() : null;

    if (!customerEmail || !customerName || !customerPhone || !shippingLocation || !shippingAddress) {
      sendJson(res, 400, { error: "Customer and shipping details are required." });
      return;
    }

    if (!["cod", "card"].includes(paymentMethod)) {
      sendJson(res, 400, { error: "A valid payment method is required." });
      return;
    }

    const subtotal = cart.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);
    const shipping = 2.5;
    const total = subtotal + shipping;

    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
      .from("orders")
      .insert({
        user_id: user?.id || null,
        customer_email: customerEmail,
        customer_name: customerName,
        customer_phone: customerPhone,
        shipping_location: shippingLocation,
        shipping_address: shippingAddress,
        payment_method: paymentMethod,
        payment_status: paymentStatus,
        order_status: paymentMethod === "cod" ? "confirmed" : "pending_payment",
        provider,
        provider_reference: providerReference,
        subtotal_bhd: subtotal.toFixed(3),
        shipping_bhd: shipping.toFixed(3),
        total_bhd: total.toFixed(3),
        cart_snapshot: cart
      })
      .select("id")
      .single();

    if (error) {
      sendJson(res, 500, { error: error.message || "Could not create order record." });
      return;
    }

    sendJson(res, 201, { orderId: data.id });
  } catch (error) {
    console.error(error);
    sendJson(res, 500, { error: error.message || "Order creation failed." });
  }
};
