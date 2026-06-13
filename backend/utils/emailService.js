import nodemailer from "nodemailer";

export const sendConfirmationEmail = async (user, purchaseDetails) => {
  try {
    // Generate an Ethereal test account automatically
    const testAccount = await nodemailer.createTestAccount();

    const transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    const info = await transporter.sendMail({
      from: '"Tanvi Boutique" <noreply@tanviboutique.com>',
      to: user.email || "customer@example.com",
      subject: "Purchase Confirmation - Tanvi Boutique",
      text: `Hello ${user.name},\n\nYour payment was successful! Here are your purchase details:\n\n${purchaseDetails}\n\nThank you for shopping with us!`,
      html: `
        <h3>Hello ${user.name},</h3>
        <p>Your payment was successful! Here are your purchase details:</p>
        <div style="background: #f9f9f9; padding: 15px; border-radius: 8px;">
          ${purchaseDetails.replace(/\n/g, "<br>")}
        </div>
        <p>Thank you for shopping with us!</p>
      `,
    });

    console.log("-----------------------------------------");
    console.log("✉️  Confirmation Email Sent Successfully!");
    console.log("Message ID: %s", info.messageId);
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    console.log("-----------------------------------------");

  } catch (error) {
    console.error("Failed to send confirmation email", error);
  }
};

export const sendOTPEmail = async (user, otp) => {
  try {
    const transporter = await createTransporter();

    const info = await transporter.sendMail({
      from: '"Tanvi Boutique" <noreply@tanviboutique.com>',
      to: user.email || "customer@example.com",
      subject: "Your Payment OTP - Tanvi Boutique",
      text: `Hello ${user.name},\n\nYour OTP for the purchase is: ${otp}\n\nPlease do not share this OTP with anyone.`,
      html: `
        <h3>Hello ${user.name},</h3>
        <p>Your OTP for the purchase is: <b style="font-size: 24px;">${otp}</b></p>
        <p>Please do not share this OTP with anyone.</p>
      `,
    });

    console.log("-----------------------------------------");
    console.log("🔑  OTP Email Sent Successfully!");
    console.log("Message ID: %s", info.messageId);
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    console.log("-----------------------------------------");

  } catch (error) {
    console.error("Failed to send OTP email", error);
  }
};

export const sendPasswordResetEmail = async (user, resetLink) => {
  try {
    const testAccount = await nodemailer.createTestAccount();

    const transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    const info = await transporter.sendMail({
      from: '"Tanvi Boutique" <noreply@tanviboutique.com>',
      to: user.email || "customer@example.com",
      subject: "Password Reset Request - Tanvi Boutique",
      text: `Hello ${user.name},\n\nYou requested to reset your password. Please click the following link to reset your password:\n\n${resetLink}\n\nIf you did not request this, please ignore this email.`,
      html: `
        <h3>Hello ${user.name},</h3>
        <p>You requested to reset your password. Please click the button below to reset it:</p>
        <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background: #8b2f4d; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px;">Reset Password</a>
        <p style="margin-top: 20px; font-size: 12px; color: #666;">If you did not request this, please ignore this email.</p>
      `,
    });

    console.log("-----------------------------------------");
    console.log("🔒  Password Reset Email Sent Successfully!");
    console.log("Message ID: %s", info.messageId);
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    console.log("-----------------------------------------");

  } catch (error) {
    console.error("Failed to send Password Reset email", error);
  }
};
