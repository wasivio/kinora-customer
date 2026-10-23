const FIRESTORE_BASE_URL = 'https://firestore.googleapis.com/v1/projects/kinora-62da7/databases/(default)/documents/products';

function parseFirestoreFields(fields: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  if (!fields) return result;
  for (const [key, val] of Object.entries(fields)) {
    if (val.stringValue !== undefined) result[key] = val.stringValue;
    else if (val.integerValue !== undefined) result[key] = Number(val.integerValue);
    else if (val.doubleValue !== undefined) result[key] = Number(val.doubleValue);
    else if (val.booleanValue !== undefined) result[key] = val.booleanValue;
    else if (val.timestampValue !== undefined) result[key] = val.timestampValue;
    else if (val.mapValue?.fields !== undefined) result[key] = parseFirestoreFields(val.mapValue.fields);
  }
  return result;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { items, paymentMethod = 'online', shippingFee = 0, couponDiscount = 0 } = req.body || {};

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        valid: false,
        error: 'Cart contains no items to validate',
      });
    }

    const fetchedProducts = await Promise.all(
      items.map(async (item: { productId: string; quantity: number }) => {
        try {
          const resp = await fetch(`${FIRESTORE_BASE_URL}/${item.productId}`);
          if (!resp.ok) {
            return {
              id: item.productId,
              name: 'Unknown Item',
              price: 0,
              allowCOD: true,
              allowUPI: true,
              codCharge: 0,
              quantity: item.quantity || 1,
            };
          }
          const docData = await resp.json();
          const parsed = parseFirestoreFields(docData.fields);
          
          const allowCOD = parsed.allowCOD !== undefined 
            ? parsed.allowCOD 
            : parsed.paymentSettings?.allowCOD !== undefined 
            ? parsed.paymentSettings.allowCOD 
            : true;

          const allowUPI = parsed.allowUPI !== undefined 
            ? parsed.allowUPI 
            : parsed.paymentSettings?.allowUPI !== undefined 
            ? parsed.paymentSettings.allowUPI 
            : true;

          const codCharge = Number(parsed.codCharge ?? parsed.paymentSettings?.codCharge ?? 0);

          let unitPrice = Number(parsed.price || 0);
          if (parsed.discount && Number(parsed.discount) > 0) {
            const disc = Number(parsed.discount);
            if (disc < unitPrice) {
              // Flat discount or percentage: if <= 100, treat as percentage
              unitPrice = disc <= 100 ? Math.round(unitPrice * (1 - disc / 100)) : unitPrice - disc;
            }
          }

          return {
            id: item.productId,
            name: parsed.name || 'Product',
            price: Math.max(0, unitPrice),
            allowCOD,
            allowUPI,
            codCharge: Math.max(0, codCharge),
            quantity: Math.max(1, item.quantity || 1),
          };
        } catch {
          return {
            id: item.productId,
            name: 'Product',
            price: 0,
            allowCOD: true,
            allowUPI: true,
            codCharge: 0,
            quantity: item.quantity || 1,
          };
        }
      })
    );

    // Rule 1: Validate Cash on Delivery eligibility
    if (paymentMethod === 'cod') {
      const codDisallowed = fetchedProducts.find((p) => p.allowCOD === false);
      if (codDisallowed) {
        return res.status(200).json({
          success: true,
          valid: false,
          error: `Product "${codDisallowed.name}" is not eligible for Cash on Delivery. Please choose Online Payment.`,
        });
      }
    }

    // Rule 2: Validate Online Payment eligibility
    if (paymentMethod === 'online') {
      const upiDisallowed = fetchedProducts.find((p) => p.allowUPI === false);
      if (upiDisallowed) {
        return res.status(200).json({
          success: true,
          valid: false,
          error: `Product "${upiDisallowed.name}" does not support Online Payment. Please choose Cash on Delivery.`,
        });
      }
    }

    // Rule 3: Calculate applicable COD charge
    const applicableCodCharge =
      paymentMethod === 'cod'
        ? Math.max(0, ...fetchedProducts.map((p) => p.codCharge || 0))
        : 0;

    // Rule 4: Compute verified subtotal
    const verifiedSubtotal = fetchedProducts.reduce((sum, p) => sum + p.price * p.quantity, 0);
    const verifiedTotal = Math.max(
      0,
      verifiedSubtotal - Number(couponDiscount || 0) + Number(shippingFee || 0) + applicableCodCharge
    );

    return res.status(200).json({
      success: true,
      valid: true,
      subtotal: verifiedSubtotal,
      codCharge: applicableCodCharge,
      totalAmount: verifiedTotal,
    });
  } catch (err: any) {
    console.error('Error in validate-checkout API:', err);
    return res.status(500).json({
      success: false,
      valid: false,
      error: err?.message || 'Server-side checkout validation failed',
    });
  }
}
