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

                  const geminiKey = data.geminiApiKey || env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
                  const fashnKey = env.FASHN_API_KEY || process.env.FASHN_API_KEY;
                  const replicateToken = env.REPLICATE_API_TOKEN || process.env.REPLICATE_API_TOKEN;

                  if (!geminiKey && !fashnKey && !replicateToken) {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({
                      success: false,
                      needApiKey: true,
                      message: 'AI Virtual Try-On requires an API key (Google AI Studio GEMINI_API_KEY, FASHN, or Replicate) to photorealistically swap clothing onto the person body.',
                    }));
                    return;
                  }

                  if (!personImage || !garmentImage) {
                    res.statusCode = 400;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ success: false, error: 'Missing personImage or garmentImage' }));
                    return;
                  }

                  // 1. Google AI Studio (Gemini Multimodal VTON) Integration
                  if (geminiKey) {
                    let lastGeminiError = '';
                    try {
                      // Extract pure base64 for person image
                      const personBase64 = personImage.includes('base64,')
                        ? personImage.split('base64,')[1]
                        : personImage;

                      // Fetch garment image and convert to base64 if it is a URL
                      let garmentBase64 = '';
                      let garmentMime = 'image/jpeg';
                      if (garmentImage.startsWith('data:')) {
                        const match = garmentImage.match(/data:([^;]+);base64,(.+)/);
                        if (match) {
                          garmentMime = match[1];
                          garmentBase64 = match[2];
                        }
                      } else {
                        const gRes = await fetch(garmentImage);
                        const gBuffer = await gRes.arrayBuffer();
                        garmentBase64 = Buffer.from(gBuffer).toString('base64');
                        const contentType = gRes.headers.get('content-type');
                        if (contentType) garmentMime = contentType;
                      }

                      const promptText = `TASK: Photorealistic Virtual Clothing Try-On.
Image 1 is the customer photo. Image 2 is the clothing product (${garmentName || 'clothing'}, ${garmentType === 'upper' ? 'Upper Wear like shirt/top/jacket' : 'Lower Wear like pant/trouser/jeans'}).
INSTRUCTIONS:
1. Seamlessly replace whatever clothing the person in Image 1 is wearing with this exact garment from Image 2.
2. Accurately wrap and fit the garment onto the person's body, shoulders, chest, and waist according to their pose and body structure.
3. Keep the person's face, facial features, hair, head, skin tone, hands, posture, and the original background completely intact and authentic.
4. Output the resulting photorealistic image of the person wearing the garment.`;

                      const modelsToTry = [
                        'gemini-2.0-flash-exp',
                        'gemini-2.0-flash-exp-image-generation',
                        'gemini-2.5-flash-image',
                        'gemini-3.1-flash-image',
                        'gemini-2.0-flash',
                      ];

                      let generatedImageBase64 = '';

                      for (const model of modelsToTry) {
                        try {
                          const geminiRes = await fetch(
                            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
                            {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                contents: [
                                  {
                                    parts: [
                                      { text: promptText },
                                      {
                                        inline_data: {
                                          mime_type: 'image/jpeg',
                                          data: personBase64,
                                        },
                                      },
                                      {
                                        inline_data: {
                                          mime_type: garmentMime,
                                          data: garmentBase64,
                                        },
                                      },
                                    ],
                                  },
                                ],
                                generationConfig: {
                                  responseModalities: ['TEXT', 'IMAGE'],
                                },
                              }),
                            }
                          );

                          if (geminiRes.ok) {
                            const geminiData = await geminiRes.json();
                            const parts = geminiData?.candidates?.[0]?.content?.parts || [];
                            for (const part of parts) {
                              const inlineData = part.inlineData || part.inline_data;
                              if (inlineData && inlineData.data) {
                                generatedImageBase64 = `data:${inlineData.mimeType || inlineData.mime_type || 'image/jpeg'};base64,${inlineData.data}`;
                                break;
                              }
                            }
                            if (generatedImageBase64) break;
                          } else {
                            const errText = await geminiRes.text();
                            lastGeminiError = `Model ${model} returned ${geminiRes.status}: ${errText}`;
                            console.warn(`[Google AI Studio] ${lastGeminiError}`);
                          }
                        } catch (mErr: any) {
                          lastGeminiError = mErr?.message || String(mErr);
                          console.warn(`[Google AI Studio] Model ${model} try failed:`, mErr);
                        }
                      }

                      if (generatedImageBase64) {
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({
                          success: true,
                          imageUrl: generatedImageBase64,
                        }));
                        return;
                      }

                      // 1b. AI Body Contour & Landmark Detection using Gemini 2.5 Flash
                      try {
                        const landmarkRes = await fetch(
                          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
                          {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              contents: [
                                {
                                  parts: [
                                    {
                                      text: 'Analyze this customer photo for virtual clothing fitting. Detect where their neck/chin ends and shoulders begin (neck_y_percent, 0-100 from top of image), shoulder width (shoulder_width_percent, 0-100), torso center (center_x_percent, 0-100), waist line (waist_y_percent, 0-100). Return ONLY JSON: {"detected": boolean, "neck_y_percent": number, "shoulder_width_percent": number, "center_x_percent": number, "waist_y_percent": number}',
                                    },
                                    {
                                      inline_data: {
                                        mime_type: 'image/jpeg',
                                        data: personBase64,
                                      },
                                    },
                                  ],
                                },
                              ],
                              generationConfig: { responseMimeType: 'application/json' },
                            }),
                          }
                        );

                        if (landmarkRes.ok) {
                          const lData = await landmarkRes.json();
                          const rawText = lData?.candidates?.[0]?.content?.parts?.[0]?.text;
                          if (rawText) {
                            const parsed = JSON.parse(rawText);
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(
                              JSON.stringify({
                                success: true,
                                aiFit: {
                                  neckY: Number(parsed.neck_y_percent) || 45,
                                  shoulderWidth: Number(parsed.shoulder_width_percent) || 70,
                                  centerX: Number(parsed.center_x_percent) || 50,
                                  waistY: Number(parsed.waist_y_percent) || 70,
                                },
                                message: 'Gemini AI successfully analyzed body contours & landmarks.',
                              })
                            );
                            return;
                          }
                        }
                      } catch (lErr) {
                        console.warn('[Google AI Studio] Landmark fallback error:', lErr);
                      }

                      if (!fashnKey && !replicateToken && lastGeminiError) {
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({
                          success: false,
                          error: `Google AI Studio response: ${lastGeminiError}`,
                        }));
                        return;
                      }
                    } catch (gErr: any) {
                      console.warn('[Google AI Studio] API attempt error:', gErr);
                      if (!fashnKey && !replicateToken) {
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({
                          success: false,
                          error: gErr?.message || 'Google AI Studio request failed',
                        }));
                        return;
                      }
                    }
                  }

                  // 2. FASHN.ai Integration (Specialized for Virtual Try-On)
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
