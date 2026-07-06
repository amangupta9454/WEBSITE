const Otp = require("../models/Otp");
const { queueWhatsAppMessage } = require("../utils/whatsappClient");

exports.sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    // Generate a 3-digit random OTP (100 to 999)
    const otpCode = Math.floor(100 + Math.random() * 900).toString();

    // Delete any existing OTP for this number to avoid conflicts
    await Otp.deleteMany({ phone });

    // Save the new OTP
    const newOtp = new Otp({
      phone,
      otp: otpCode,
    });
    await newOtp.save();

    // Send the OTP via WhatsApp
    const message = `🔐 *Verification Code*\n\nYour Code-A-Nova verification code is: *${otpCode}*\n\n_This code is only for verifying your phone number in the application form. If you did not request this, please ignore it. Do not share this code with anyone._`;
    await queueWhatsAppMessage(phone, message);

    res.status(200).json({ success: true, message: "OTP sent successfully via WhatsApp" });
  } catch (error) {
    console.error("[Backend] Error sending OTP:", error);
    res.status(500).json({ success: false, message: "Failed to send OTP" });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ message: "Phone and OTP are required" });
    }

    // Find the OTP record
    const otpRecord = await Otp.findOne({ phone, otp });

    if (!otpRecord) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    }

    // If verified successfully, delete the OTP record so it can't be reused
    await Otp.deleteOne({ _id: otpRecord._id });

    res.status(200).json({ success: true, message: "OTP verified successfully" });
  } catch (error) {
    console.error("[Backend] Error verifying OTP:", error);
    res.status(500).json({ success: false, message: "Failed to verify OTP" });
  }
};
