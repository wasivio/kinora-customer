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

            // Handle /api/virtual-tryon in local dev
            if (req.method === 'POST' && req.url === '/api/virtual-tryon') {
              let body = '';
              req.on('data', (chunk) => { body += chunk; });
              req.on('end', async () => {
                try {
                  const data = body ? JSON.parse(body) : {};
                  const { personImage, garmentImage, garmentType, garmentName } = data;

                  const fashnKey = env.FASHN_API_KEY || process.env.FASHN_API_KEY;
                  const replicateToken = env.REPLICATE_API_TOKEN || process.env.REPLICATE_API_TOKEN;

                  if (!fashnKey && !replicateToken) {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({
                      success: false,
                      needApiKey: true,
                      message: 'AI Virtual Try-On requires an API key (FASHN.ai or Replicate) to photorealistically swap clothing onto the person body.',
                    }));
                    return;
                  }

                  if (!personImage || !garmentImage) {
                    res.statusCode = 400;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ success: false, error: 'Missing personImage or garmentImage' }));
                    return;
                  }

                  // 1. FASHN.ai Integration (Specialized for Virtual Try-On)
                  if (fashnKey) {
                    const category = garmentType === 'lower' ? 'bottoms' : 'tops';
                    const runRes = await fetch('https://api.fashn.ai/v1/run', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${fashnKey}`,
                      },
                      body: JSON.stringify({
                        model_name: 'tryon-max',
                        inputs: {
                          model_image: personImage,
                          product_image: garmentImage,
                          category,
                        },
                      }),
                    });

                    const runData = await runRes.json();
                    if (!runRes.ok || !runData.id) {
                      throw new Error(runData.error?.message || runData.message || 'FASHN.ai request failed');
                    }

                    // Poll for completion
                    let status = runData.status;
                    let resultUrl = '';
                    let attempts = 0;

                    while (status !== 'completed' && status !== 'failed' && attempts < 35) {
                      await new Promise((r) => setTimeout(r, 2500));
                      const statusRes = await fetch(`https://api.fashn.ai/v1/status/${runData.id}`, {
                        headers: { 'Authorization': `Bearer ${fashnKey}` },
                      });
                      const statusData = await statusRes.json();
                      status = statusData.status;
                      if (status === 'completed' && statusData.output && statusData.output.length > 0) {
                        resultUrl = statusData.output[0];
                        break;
                      }
                      if (status === 'failed') {
                        throw new Error(statusData.error?.message || 'FASHN try-on processing failed');
                      }
                      attempts++;
                    }

                    if (!resultUrl) {
                      throw new Error('AI Generation timed out. Please try again.');
                    }

                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({
                      success: true,
                      imageUrl: resultUrl,
                    }));
                    return;
                  }

                  // 2. Replicate IDM-VTON Integration
                  if (replicateToken) {
                    const category = garmentType === 'lower' ? 'lower_body' : 'upper_body';
                    const repRes = await fetch('https://api.replicate.com/v1/predictions', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Token ${replicateToken}`,
                      },
                      body: JSON.stringify({
                        version: 'c871bb9b046607b680449ecbae55fd8c6d945e0a1948644bf2361b3d021d3ff4',
                        input: {
                          human_img: personImage,
                          garm_img: garmentImage,
                          garment_des: garmentName || 'clothing',
                          category,
                        },
                      }),
                    });

                    const repData = await repRes.json();
                    if (!repRes.ok || !repData.id) {
                      throw new Error(repData.detail || 'Replicate prediction failed');
                    }

                    let status = repData.status;
                    let resultUrl = '';
                    let attempts = 0;

                    while (status !== 'succeeded' && status !== 'failed' && attempts < 35) {
                      await new Promise((r) => setTimeout(r, 2500));
                      const statusRes = await fetch(`https://api.replicate.com/v1/predictions/${repData.id}`, {
                        headers: { 'Authorization': `Token ${replicateToken}` },
                      });
                      const statusData = await statusRes.json();
                      status = statusData.status;
                      if (status === 'succeeded' && statusData.output) {
                        resultUrl = Array.isArray(statusData.output) ? statusData.output[0] : statusData.output;
                        break;
                      }
                      if (status === 'failed') {
                        throw new Error(statusData.error || 'Replicate try-on processing failed');
                      }
                      attempts++;
                    }

                    if (!resultUrl) {
                      throw new Error('AI try-on generation timed out');
                    }

                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({
                      success: true,
                      imageUrl: resultUrl,
                    }));
                    return;
                  }
                } catch (err: any) {
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ success: false, error: err?.message || 'Virtual Try-On generation failed' }));
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
