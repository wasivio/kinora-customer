import { Order } from '../types';

export const ADMIN_WHATSAPP_NUMBER = '918810519646'; // +91 8810519646

/**
 * Formats complete order details into a clean, WhatsApp-friendly text message.
 */
export const formatOrderForWhatsApp = (order: Partial<Order>, baseUrl?: string): string => {
  const origin = baseUrl || (typeof window !== 'undefined' && window.location ? window.location.origin : '');

  const itemsText = (order.items || [])
    .map((item, idx) => {
      const variantStr = item.variant ? ` [${item.variant}]` : '';
      const productLink = item.productId && origin 
        ? `\n   🔗 Link: ${origin}/product/${item.productId}` 
        : '';
      return `${idx + 1}. *${item.name}*${variantStr}\n   Qty: ${item.quantity} × ₹${item.price} = *₹${item.price * item.quantity}*${productLink}`;
    })
    .join('\n\n');

  const paymentMethodLabel = order.paymentMethod === 'RAZORPAY'
    ? 'Online Payment (Razorpay)'
    : order.paymentMethod === 'COD'
    ? 'Cash on Delivery (COD)'
    : order.paymentMethod || 'COD';

  const paymentStatusLabel = order.paymentStatus === 'paid'
    ? 'PAID ✅'
    : 'PENDING (Collect on Delivery) ⏳';

  const address = order.shippingAddress;
  const addressText = address
    ? `${address.name}\n${address.street}, ${address.city}, ${address.state} - ${address.zip}\nPhone: ${address.phone}`
    : 'Not provided';

  const discountText = (order.discountAmount && order.discountAmount > 0)
    ? `• Discount: -₹${order.discountAmount}\n`
    : '';

  const deliveryText = (order.shippingAmount && order.shippingAmount > 0)
    ? `₹${order.shippingAmount}`
    : 'FREE';

  const razorpayDetails = order.razorpayPaymentId
    ? `\n• Razorpay Payment ID: ${order.razorpayPaymentId}`
    : '';

  const dateStr = order.createdAt 
    ? new Date(order.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : new Date().toLocaleDateString('en-IN');

  return `🛍️ *NEW ORDER RECEIVED ON KINORA!*
------------------------------------
🔖 *Order Number:* #${order.orderNumber}
📅 *Date:* ${dateStr}

👤 *Customer Info:*
• Name: ${order.customerName || address?.name || 'Customer'}
• Phone: ${order.customerPhone || address?.phone || 'N/A'}
• Email: ${order.customerEmail || 'N/A'}

📍 *Delivery Address:*
${addressText}

📦 *Items Ordered:*
${itemsText}

💰 *Price Summary:*
• Subtotal: ₹${order.subtotal || 0}
${discountText}• Delivery Fee: ${deliveryText}
• *Total Payable: ₹${order.totalAmount || 0}*

💳 *Payment Info:*
• Method: ${paymentMethodLabel}
• Status: ${paymentStatusLabel}${razorpayDetails}
------------------------------------`;
};

/**
 * Returns a direct WhatsApp URL to open chat with the admin number and prefill the message.
 */
export const getWhatsAppOrderUrl = (
  order: Partial<Order>, 
  phoneNumber: string = ADMIN_WHATSAPP_NUMBER,
  baseUrl?: string
): string => {
  const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
  const message = formatOrderForWhatsApp(order, baseUrl);
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
};

/**
 * Opens WhatsApp chat with the prefilled order summary in a new tab or WhatsApp app.
 */
export const sendOrderToWhatsApp = (
  order: Partial<Order>, 
  phoneNumber: string = ADMIN_WHATSAPP_NUMBER,
  baseUrl?: string
): void => {
  const url = getWhatsAppOrderUrl(order, phoneNumber, baseUrl);
  if (typeof window !== 'undefined') {
    window.open(url, '_blank');
  }
};
