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

    // Payment is valid, update user credits
    const user = await InterviewUser.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

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
