const Stripe = require("stripe");

const { requireAuthenticatedUser } = require("../_lib/auth");
const { createAdminSupabaseClient } = require("../_lib/clients");
const { allowMethod, readJsonBody, sendJson } = require("../_lib/http");
const { getBaseUrl } = require("../_lib/url");

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

function getStripeClient() {
  if (!stripeSecretKey) {
    throw new Error("Stripe is not configured yet.");
  }

  return new Stripe(stripeSecretKey);
}

function toMinorUnit(amount, currency) {
  const normalizedCurrency = String(currency || "").toLowerCase();
  const threeDecimalCurrencies = new Set(["bhd", "jod", "kwd", "omr", "tnd"]);
  const multiplier = threeDecimalCurrencies.has(normalizedCurrency) ? 1000 : 100;
  return Math.round(Number(amount) * multiplier);
}

module.exports = async (req, res) => {
  if (!allowMethod(req, res, "POST")) {
    return;
  }

  try {
    const stripe = getStripeClient();
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
        provider: "stripe",
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

    const lineItems = cart.map((item) => ({
      quantity: Number(item.quantity) || 1,
      price_data: {
        currency: "bhd",
        unit_amount: toMinorUnit(item.price, "bhd"),
        product_data: {
          name: item.name,
          description: `Size: ${item.size}`
        }
      }
    }));

    lineItems.push({
      quantity: 1,
      price_data: {
        currency: "bhd",
        unit_amount: toMinorUnit(shippingAmount, "bhd"),
        product_data: {
          name: "Shipping",
          description: `Bahrain delivery to ${shippingLocation}`
        }
      }
    });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: orderEmail,
      client_reference_id: orderRecord.id,
      line_items: lineItems,
      success_url: `${baseUrl}/index.html?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/index.html?checkout=cancelled`,
      payment_method_types: ["card"],
      billing_address_collection: "required",
      metadata: {
        ...metadata,
        order_id: orderRecord.id
      }
    });

    if (!session.url || !session.id) {
      sendJson(res, 500, { error: "Could not start Stripe checkout." });
      return;
    }

    await supabase
      .from("orders")
      .update({
        provider_reference: session.id
      })
      .eq("id", orderRecord.id);

    sendJson(res, 200, {
      url: session.url,
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
