const crypto = require("crypto");

const CURRENCY_DECIMALS = {
  BHD: 3,
  KWD: 3,
  OMR: 3,
  JOD: 3
};

function formatTapAmount(amount, currency) {
  const decimals = CURRENCY_DECIMALS[String(currency || "").toUpperCase()] || 2;
  return Number(amount || 0).toFixed(decimals);
}

function buildChargeHashString(charge) {
  return [
    "x_id",
    charge.id || "",
    "x_amount",
    formatTapAmount(charge.amount, charge.currency),
    "x_currency",
    charge.currency || "",
    "x_gateway_reference",
    charge.reference?.gateway || "",
    "x_payment_reference",
    charge.reference?.payment || "",
    "x_status",
    charge.status || "",
    "x_created",
    charge.transaction?.created || ""
  ].join("");
}

function verifyTapChargeHash({ charge, secretKey, headerHashString }) {
  const payloadString = buildChargeHashString(charge);
  const computedHash = crypto
    .createHmac("sha256", secretKey)
    .update(payloadString)
    .digest("hex");

  const expected = Buffer.from(computedHash);
  const provided = Buffer.from(String(headerHashString || ""));

  if (expected.length !== provided.length) {
    return false;
  }

  return crypto.timingSafeEqual(expected, provided);
}

module.exports = {
  verifyTapChargeHash
};
