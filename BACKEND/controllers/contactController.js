const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

const submitContactForm = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, projectDetails } = req.body;

    if (!firstName || !lastName || !email || !projectDetails) {
      return res
        .status(400)
        .json({
          message:
            "First name, last name, email, and project details are required.",
        });
    }

    const fullName = `${firstName} ${lastName}`.trim();
    const subject = `New contact enquiry from ${fullName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
        <h2 style="color: #2563eb; margin-bottom: 8px;">New Contact Enquiry</h2>
        <p><strong>Name:</strong> ${fullName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || "Not provided"}</p>
        <p><strong>Project Details:</strong></p>
        <p style="white-space: pre-wrap; background: #f8fafc; padding: 12px; border-radius: 8px;">${projectDetails}</p>
      </div>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: "codeanova26@gmail.com",
      replyTo: email,
      subject,
      html,
    });

    res
      .status(200)
      .json({
        message:
          "Your message has been sent successfully. We will get back to you soon.",
      });
  } catch (error) {
    console.error("[Contact] Email send failed:", error);
    res
      .status(500)
      .json({
        message: "Failed to send your message. Please try again later.",
      });
  }
};

module.exports = { submitContactForm };
