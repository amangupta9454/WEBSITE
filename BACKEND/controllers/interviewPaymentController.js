const Razorpay = require('razorpay');
const crypto = require('crypto');
const InterviewUser = require('../models/InterviewUser');

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.createOrder = async (req, res) => {
  try {
    const { packageId } = req.body;
    let amount = 0;

    switch (packageId) {
      case '5_tokens':
        amount = 199;
        break;
      case '10_tokens':
        amount = 299;
        break;
      case '20_tokens':
        amount = 499;
        break;
      case 'unlimited':
        amount = 999;
        break;
      default:
        return res.status(400).json({ success: false, message: 'Invalid package selected' });
    }

    const options = {
      amount: amount * 100, // amount in smallest currency unit (paise)
      currency: "INR",
      receipt: `receipt_order_${Math.floor(Math.random() * 10000)}`,
    };

    const order = await razorpayInstance.orders.create(options);
    
    if (!order) {
      return res.status(500).json({ success: false, message: 'Failed to create Razorpay order' });
    }

    // Save the pending order to the user's document
    const userId = req.user.id || req.user.userId;
    await InterviewUser.findByIdAndUpdate(userId, {
      $push: {
        pendingOrders: {
          orderId: order.id,
          packageId,
          amount
        }
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
    const userId = req.user.id || req.user.userId;

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    // Check if the order is still pending
    const user = await InterviewUser.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const pendingOrderIndex = user.pendingOrders.findIndex(o => o.orderId === razorpay_order_id);
    
    // If the order is not in pendingOrders, it was already fulfilled (e.g. by Webhook)
    if (pendingOrderIndex === -1) {
      return res.status(200).json({ success: true, message: 'Payment already processed successfully', credits: user.credits, isUnlimited: user.isUnlimited });
    }

    // Remove from pending
    user.pendingOrders.splice(pendingOrderIndex, 1);

    if (packageId === 'unlimited') {
      user.isUnlimited = true;
    } else {
      let tokensToAdd = 0;
      if (packageId === '5_tokens') tokensToAdd = 5;
      if (packageId === '10_tokens') tokensToAdd = 10;
      if (packageId === '20_tokens') tokensToAdd = 20;
      user.credits += tokensToAdd;
    }

    // Record payment history
    const amountMap = { '5_tokens': 199, '10_tokens': 299, '20_tokens': 499, 'unlimited': 999 };
    user.payments.push({
      packageId,
      amount: amountMap[packageId] || 0,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      paidAt: new Date(),
    });

    await user.save();

    res.status(200).json({ success: true, message: 'Payment successful', credits: user.credits, isUnlimited: user.isUnlimited });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ success: false, message: 'Server error verifying payment' });
  }
};

exports.webhookHandler = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];
    
    // Validate signature
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

      // Find user who has this pending order
      const user = await InterviewUser.findOne({ 'pendingOrders.orderId': orderId });
      if (!user) {
        // Order either already processed by frontend or doesn't exist
        return res.status(200).json({ success: true, message: 'Order already processed or not found' });
      }

      const pendingOrderIndex = user.pendingOrders.findIndex(o => o.orderId === orderId);
      if (pendingOrderIndex !== -1) {
        const pendingOrder = user.pendingOrders[pendingOrderIndex];
        const packageId = pendingOrder.packageId;

        // Remove from pending
        user.pendingOrders.splice(pendingOrderIndex, 1);

        if (packageId === 'unlimited') {
          user.isUnlimited = true;
        } else {
          let tokensToAdd = 0;
          if (packageId === '5_tokens') tokensToAdd = 5;
          if (packageId === '10_tokens') tokensToAdd = 10;
          if (packageId === '20_tokens') tokensToAdd = 20;
          user.credits += tokensToAdd;
        }

        // Add to payments
        user.payments.push({
          packageId,
          amount: pendingOrder.amount,
          razorpayOrderId: orderId,
          razorpayPaymentId: paymentId,
          paidAt: new Date(),
        });

        await user.save();
        console.log(`Webhook successfully processed order ${orderId} for user ${user.email}`);
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ success: false, message: 'Server error in webhook' });
  }
};
