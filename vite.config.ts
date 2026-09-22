import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import Razorpay from 'razorpay';
import crypto from 'crypto';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      {
        name: 'razorpay-api-dev-server',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            // Handle /api/create-razorpay-order in local dev
            if (req.method === 'POST' && req.url === '/api/create-razorpay-order') {
              let body = '';
              req.on('data', (chunk) => { body += chunk; });
              req.on('end', async () => {
                try {
                  const data = body ? JSON.parse(body) : {};
                  const keyId = env.RAZORPAY_KEY_ID || env.VITE_RAZORPAY_KEY_ID;
                  const keySecret = env.RAZORPAY_KEY_SECRET;

                  if (!keyId || !keySecret) {
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({
                      success: false,
                      error: 'Razorpay credentials not found in .env. Please configure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.',
                    }));
                    return;
                  }

                  const { amount, currency = 'INR', receipt, notes } = data;
                  if (!amount || Number(amount) <= 0) {
                    res.statusCode = 400;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ success: false, error: 'Invalid order amount' }));
                    return;
                  }

                  const instance = new Razorpay({ key_id: keyId, key_secret: keySecret });
                  const order = await instance.orders.create({
                    amount: Math.round(Number(amount) * 100),
                    currency,
                    receipt: receipt || `rcpt_${Date.now()}`,
                    notes: notes || {},
                  });

                  res.statusCode = 200;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({
                    success: true,
                    orderId: order.id,
                    amount: order.amount,
                    currency: order.currency,
                    keyId,
                  }));
                } catch (err: any) {
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({
                    success: false,
                    error: err?.error?.description || err?.message || 'Failed to create Razorpay order',
                  }));
                }
              });
              return;
            }

            // Handle /api/verify-razorpay-payment in local dev
            if (req.method === 'POST' && req.url === '/api/verify-razorpay-payment') {
              let body = '';
              req.on('data', (chunk) => { body += chunk; });
              req.on('end', async () => {
                try {
                  const data = body ? JSON.parse(body) : {};
                  const keySecret = env.RAZORPAY_KEY_SECRET;
                  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = data;

                  if (!keySecret) {
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ success: false, verified: false, error: 'Razorpay secret missing in .env' }));
                    return;
                  }

                  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
                    res.statusCode = 400;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ success: false, verified: false, error: 'Missing verification parameters' }));
                    return;
                  }

                  const expectedSignature = crypto
                    .createHmac('sha256', keySecret)
                    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
                    .digest('hex');

                  if (expectedSignature !== razorpay_signature) {
                    res.statusCode = 400;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ success: false, verified: false, error: 'Invalid payment signature' }));
                    return;
                  }

                  res.statusCode = 200;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({
                    success: true,
                    verified: true,
                    orderId: razorpay_order_id,
                    paymentId: razorpay_payment_id,
                  }));
                } catch (err: any) {
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ success: false, verified: false, error: err?.message || 'Verification failed' }));
                }
              });
              return;
            }

            next();
          });
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  };
});
