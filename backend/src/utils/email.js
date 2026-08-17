import { Resend } from "resend";
import { env } from "../config/env.js";

function missingEmailConfig(name) {
  const message = `${name} is not configured.`;
  // eslint-disable-next-line no-console
  console.warn(`[Email] ${message}`);
  return { success: false, error: message };
}

export async function sendVerificationEmail(email, verificationToken) {
  if (!env.resendApiKey) {
    return missingEmailConfig("RESEND_API_KEY");
  }

  const from = env.emailSystemFrom || env.emailFrom;
  if (!from) {
    return missingEmailConfig("EMAIL_SYSTEM_FROM or EMAIL_FROM");
  }

  const resend = new Resend(env.resendApiKey);
  const verificationUrl = `${env.clientOrigin}/verify-email?token=${verificationToken}`;

  try {
    const result = await resend.emails.send({
      from,
      to: email,
      subject: "Verify your URBA TECH email address",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #333; margin: 0;">Welcome to URBA TECH!</h2>
          </div>
          
          <p style="color: #666; line-height: 1.6;">
            Thank you for signing up. Click the button below to verify your email address and activate your account.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="padding: 12px 30px; background-color: #FFA500; color: white; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Verify Email
            </a>
          </div>
          
          <p style="color: #999; font-size: 14px;">
            Or copy and paste this link:<br>
            <code style="background: #f5f5f5; padding: 4px 8px; border-radius: 3px;">${verificationUrl}</code>
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          
          <p style="color: #999; font-size: 12px;">
            This link expires in 24 hours. If you didn't sign up for URBA TECH, you can ignore this email.
          </p>
        </div>
      `
    });

    if (result.error) {
      // eslint-disable-next-line no-console
      console.error("[Email] Resend error:", result.error);
      return { success: false, error: result.error };
    }

    // eslint-disable-next-line no-console
    console.log("[Email] Verification email sent to", email);
    return { success: true, messageId: result.data?.id };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[Email] Failed to send verification email:", error.message);
    return { success: false, error: error.message };
  }
}

export async function sendPasswordResetEmail(email, resetToken) {
  if (!env.resendApiKey) {
    return missingEmailConfig("RESEND_API_KEY");
  }

  const from = env.emailSystemFrom || env.emailFrom;
  if (!from) {
    return missingEmailConfig("EMAIL_SYSTEM_FROM or EMAIL_FROM");
  }

  const resend = new Resend(env.resendApiKey);
  const resetUrl = `${env.clientOrigin}/reset-password?token=${resetToken}`;

  try {
    const result = await resend.emails.send({
      from,
      to: email,
      subject: "Reset your URBA TECH password",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #333; margin: 0;">Password Reset Request</h2>
          </div>
          
          <p style="color: #666; line-height: 1.6;">
            Click the button below to reset your password. This link is valid for 15 minutes.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="padding: 12px 30px; background-color: #FFA500; color: white; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Reset Password
            </a>
          </div>
          
          <p style="color: #999; font-size: 14px;">
            Or copy and paste this link:<br>
            <code style="background: #f5f5f5; padding: 4px 8px; border-radius: 3px;">${resetUrl}</code>
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          
          <p style="color: #999; font-size: 12px;">
            If you didn't request a password reset, you can ignore this email. Your password hasn't changed.
          </p>
        </div>
      `
    });

    if (result.error) {
      // eslint-disable-next-line no-console
      console.error("[Email] Resend error:", result.error);
      return { success: false, error: result.error };
    }

    // eslint-disable-next-line no-console
    console.log("[Email] Password reset email sent to", email);
    return { success: true, messageId: result.data?.id };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[Email] Failed to send password reset email:", error.message);
    return { success: false, error: error.message };
  }
}
