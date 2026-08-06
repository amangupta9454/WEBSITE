const Razorpay = require('razorpay');
const crypto = require('crypto');
const User = require('../models/User');

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'dummy_key',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret',
});

const getPackageDetails = (packageId, customAmountBody = null) => {
  const staticMap = {
    'pack_199': { amount: 199, tokens: 219, description: '199 Tokens + 20 Free Bonus Coins' },
    'pack_499': { amount: 499, tokens: 549, description: '499 Tokens + 50 Free Bonus Coins' },
    'pack_999': { amount: 999, tokens: 1099, description: '999 Tokens + 100 Free Bonus Coins' },
    // Legacy mapping:
    '50_tokens': { amount: 199, tokens: 50, description: '50 Tokens Package' },
    '100_tokens': { amount: 299, tokens: 100, description: '100 Tokens Package' },
    '200_tokens': { amount: 499, tokens: 200, description: '200 Tokens Package' },
    'unlimited': { amount: 999, tokens: 0, unlimited: true, description: 'Unlimited Interviews (30 Days)' }
  };

  if (staticMap[packageId]) {
    return staticMap[packageId];
  }

  if (packageId && typeof packageId === 'string' && packageId.startsWith('custom_')) {
    const parsed = parseInt(packageId.replace('custom_', ''), 10);
    if (!isNaN(parsed) && parsed >= 1) {
      return { amount: parsed, tokens: parsed, description: `${parsed} Tokens (Custom Recharge at ₹1 = 1 Token)` };
    }
  } else if (packageId === 'custom' && customAmountBody) {
    const parsed = parseInt(customAmountBody, 10);
    if (!isNaN(parsed) && parsed >= 1) {
      return { amount: parsed, tokens: parsed, description: `${parsed} Tokens (Custom Recharge at ₹1 = 1 Token)`, effectiveId: `custom_${parsed}` };
    }
  }

  return null;
};

exports.createOrder = async (req, res) => {
  try {
    const { packageId, customAmount } = req.body;
    const pkg = getPackageDetails(packageId, customAmount);
    if (!pkg) {
      return res.status(400).json({ success: false, message: 'Invalid package or custom token amount selected' });
    }
    const amount = pkg.amount;
    const storedPackageId = pkg.effectiveId || packageId;

    const options = {
      amount: amount * 100, // paise
      currency: "INR",
      receipt: `receipt_order_${Math.floor(Math.random() * 100000)}`,
    };

    const order = await razorpayInstance.orders.create(options);
    if (!order) {
      return res.status(500).json({ success: false, message: 'Failed to create Razorpay order' });
    }

    // Save pending order to user's main account
    const userId = req.user.id || req.user.unifiedUserId;
    await User.findByIdAndUpdate(userId, {
      $push: {
        interviewPendingOrders: { orderId: order.id, packageId: storedPackageId, amount }
      }
    });

    res.status(200).json({ success: true, order, amount });
  } catch (error) {
    console.error('Error creating razorpay order:', error);
    res.status(500).json({ success: false, message: 'Server error creating order' });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, packageId } = req.body;
    const userId = req.user.id || req.user.unifiedUserId;

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const pendingOrderIndex = user.interviewPendingOrders.findIndex(o => o.orderId === razorpay_order_id);

    // Already fulfilled by webhook
    if (pendingOrderIndex === -1) {
      return res.status(200).json({ success: true, message: 'Payment already processed successfully', credits: user.interviewCredits, isUnlimited: user.interviewIsUnlimited });
    }

    const pendingOrder = user.interviewPendingOrders[pendingOrderIndex];
    const actualPackageId = pendingOrder.packageId || packageId;
    user.interviewPendingOrders.splice(pendingOrderIndex, 1);

    const pkg = getPackageDetails(actualPackageId) || { amount: pendingOrder.amount || 0, tokens: pendingOrder.amount || 0, description: `Purchased ${pendingOrder.amount || 0} Tokens` };

    if (pkg.unlimited) {
      user.interviewIsUnlimited = true;
      user.interviewUnlimitedExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
    } else {
      user.interviewCredits = (user.interviewCredits || 0) + (pkg.tokens || 0);
      user.tokenHistory = user.tokenHistory || [];
      user.tokenHistory.push({
        type: 'PURCHASE',
        amount: pkg.tokens || 0,
        reason: pkg.description || `Purchased ${pkg.tokens || 0} Tokens`,
        date: new Date()
      });
    }

    user.interviewPayments.push({
      packageId: actualPackageId,
      amount: pkg.amount || pendingOrder.amount || 0,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      paidAt: new Date(),
    });

    await user.save();
    res.status(200).json({ success: true, message: 'Payment successful', credits: user.interviewCredits, isUnlimited: user.interviewIsUnlimited });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ success: false, message: 'Server error verifying payment' });
  }
};

exports.webhookHandler = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (expectedSignature !== signature) {
      return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
    }

    const event = req.body.event;
    if (event === 'payment.captured' || event === 'order.paid') {
      const paymentEntity = req.body.payload.payment.entity;
      const orderId = paymentEntity.order_id;
      const paymentId = paymentEntity.id;

      const user = await User.findOne({ 'interviewPendingOrders.orderId': orderId });
      if (!user) {
        return res.status(200).json({ success: true, message: 'Order already processed or not found' });
      }

      const pendingOrderIndex = user.interviewPendingOrders.findIndex(o => o.orderId === orderId);
      if (pendingOrderIndex !== -1) {
        const pendingOrder = user.interviewPendingOrders[pendingOrderIndex];
        const packageId = pendingOrder.packageId;

        user.interviewPendingOrders.splice(pendingOrderIndex, 1);
        const pkg = getPackageDetails(packageId) || { amount: pendingOrder.amount || 0, tokens: pendingOrder.amount || 0, description: `Purchased ${pendingOrder.amount || 0} Tokens` };

        if (pkg.unlimited) {
          user.interviewIsUnlimited = true;
          user.interviewUnlimitedExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
        } else {
          user.interviewCredits = (user.interviewCredits || 0) + (pkg.tokens || 0);
          user.tokenHistory = user.tokenHistory || [];
          user.tokenHistory.push({
            type: 'PURCHASE',
            amount: pkg.tokens || 0,
            reason: pkg.description || `Purchased ${pkg.tokens || 0} Tokens via Webhook`,
            date: new Date()
          });
        }

        user.interviewPayments.push({
          packageId,
          amount: pendingOrder.amount,
          razorpayOrderId: orderId,
          razorpayPaymentId: paymentId,
          paidAt: new Date(),
        });

        await user.save();
        console.log(`Webhook: credited user ${user.email} for order ${orderId}`);
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ success: false, message: 'Server error in webhook' });
  }
};
