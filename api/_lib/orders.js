function sanitizeOrder(order) {
  if (!order) {
    return null;
  }

  return {
    id: order.id,
    customerEmail: order.customer_email,
    customerName: order.customer_name,
    customerPhone: order.customer_phone,
    shippingLocation: order.shipping_location,
    shippingAddress: order.shipping_address,
    paymentMethod: order.payment_method,
    paymentStatus: order.payment_status,
    orderStatus: order.order_status,
    internalNote: order.internal_note,
    provider: order.provider,
    providerReference: order.provider_reference,
    subtotalBhd: order.subtotal_bhd,
    shippingBhd: order.shipping_bhd,
    totalBhd: order.total_bhd,
    currency: order.currency,
    cart: order.cart_snapshot,
    createdAt: order.created_at,
    updatedAt: order.updated_at
  };
}

module.exports = {
  sanitizeOrder
};
