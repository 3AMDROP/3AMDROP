const { requireAuthenticatedUser } = require("../_lib/auth");
const { createAdminSupabaseClient } = require("../_lib/clients");
const { allowMethod, readJsonBody, sendJson } = require("../_lib/http");
const { getBaseUrl } = require("../_lib/url");

const tapSecretKey = process.env.TAP_SECRET_KEY;

module.exports = async (req, res) => {
  if (!allowMethod(req, res, "POST")) {
    return;
  }

  if (!tapSecretKey) {
    sendJson(res, 500, { error: "Tap is not configured yet." });
    return;
  }

  try {
    const authenticatedUser = await requireAuthenticatedUser(req);
    const { cart = [], customer = {}, shipping = {} } = await readJsonBody(req);

    if (!Array.isArray(cart) || !cart.length) {
      sendJson(res, 400, { error: "Your cart is empty." });
      return;
    }

    const orderName = String(customer.name || authenticatedUser.user_metadata?.full_name || "").trim();
    const orderEmail = String(authenticatedUser.email || "").trim().toLowerCase();

    if (!orderName || !orderEmail) {
      sendJson(res, 400, { error: "Customer name and email are required." });
      return;
    }

    const shippingLocation = String(shipping.location || "").trim();
    const shippingAddress = String(shipping.address || "").trim();
    const customerPhone = String(customer.phone || "").trim();

    if (!customerPhone || !shippingLocation || !shippingAddress) {
      sendJson(res, 400, { error: "Shipping location, address, and phone number are required." });
      return;
    }

    const supabase = createAdminSupabaseClient();
    const baseUrl = getBaseUrl(req);
    const subtotal = cart.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);
    const shippingAmount = 2.5;
    const total = subtotal + shippingAmount;
    const metadata = {
      customer_name: orderName,
      customer_email: orderEmail,
      shipping_location: shippingLocation,
      shipping_address: shippingAddress,
      order_note: "3AM Worldwide order",
      cart_summary: cart.map((item) => `${item.name} (${item.size}) x${item.quantity}`).join(", ")
    };

    const { data: orderRecord, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: authenticatedUser.id,
        customer_email: orderEmail,
        customer_name: orderName,
        customer_phone: customerPhone,
        shipping_location: shippingLocation,
        shipping_address: shippingAddress,
        payment_method: "card",
        payment_status: "pending",
        order_status: "pending_payment",
        provider: "tap",
        subtotal_bhd: subtotal.toFixed(3),
        shipping_bhd: shippingAmount.toFixed(3),
        total_bhd: total.toFixed(3),
        cart_snapshot: cart
      })
      .select("id")
      .single();

    if (orderError) {
      sendJson(res, 500, { error: orderError.message || "Could not create order record." });
      return;
    }

    const tapResponse = await fetch("https://api.tap.company/v2/charges", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tapSecretKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount: Number(total.toFixed(3)),
        currency: "BHD",
        customer_initiated: true,
        threeDSecure: true,
        save_card: false,
        description: "3AM Worldwide order",
        metadata: {
          ...metadata,
          order_id: orderRecord.id
        },
        receipt: {
          email: true,
          sms: false
        },
        customer: {
          first_name: orderName,
          email: orderEmail,
          phone: {
            country_code: 973,
            number: customerPhone
          }
        },
        source: {
          id: "src_all"
        },
        redirect: {
          url: `${baseUrl}/index.html?checkout=pending`
        },
        post: {
          url: `${baseUrl}/api/checkout/verify-tap`
        },
        reference: {
          transaction: orderRecord.id,
          order: orderRecord.id
        }
      })
    });

    const charge = await tapResponse.json().catch(() => ({}));

    if (!tapResponse.ok || !charge.transaction?.url || !charge.id) {
      sendJson(res, 500, {
        error: charge?.errors?.[0]?.description || charge?.message || "Could not start Tap checkout."
      });
      return;
    }

    await supabase
      .from("orders")
      .update({
        provider_reference: charge.id
      })
      .eq("id", orderRecord.id);

    sendJson(res, 200, {
      url: charge.transaction.url,
      orderId: orderRecord.id
    });
  } catch (error) {
    console.error(error);
    const statusCode = error.message?.toLowerCase().includes("token") || error.message?.toLowerCase().includes("session")
      ? 401
      : 500;
    sendJson(res, statusCode, { error: error.message || "Could not create checkout session." });
  }
};
