import "server-only";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendActivationCodeEmail(
  to: string,
  activationCode: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await transporter.sendMail({
      from: `"Tariff App" <${process.env.SMTP_USER}>`,
      to,
      subject: "Your gift activation code",
      html: `<p>Your gift application has been approved!</p><p>Activation code: <strong>${activationCode}</strong></p><p>Enter it at <a href="${process.env.NEXT_PUBLIC_APP_URL}/activate">${process.env.NEXT_PUBLIC_APP_URL}/activate</a> to activate your access.</p>`,
    });
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
