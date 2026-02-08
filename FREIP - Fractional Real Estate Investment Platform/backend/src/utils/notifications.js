import nodemailer from 'nodemailer';
import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

// Email Service
const emailTransporter = nodemailer.createTransport({
  host: 'smtp.sendgrid.net',
  port: 587,
  auth: {
    user: 'apikey',
    pass: process.env.SENDGRID_API_KEY,
  },
});

export const sendEmail = async (to, subject, htmlContent) => {
  try {
    await emailTransporter.sendMail({
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@freip.com',
      to,
      subject,
      html: htmlContent,
    });
    return true;
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
};

// SMS Service (Twilio)
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export const sendSMS = async (to, message) => {
  try {
    await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to,
    });
    return true;
  } catch (error) {
    console.error('SMS send error:', error);
    return false;
  }
};

// Email Templates
export const emailTemplates = {
  welcomeEmail: (name) => `
    <h2>Welcome to FREIP!</h2>
    <p>Hi ${name},</p>
    <p>Thank you for registering with Fractional Real Estate Investment Platform.</p>
    <p>Complete your KYC verification to start investing in premium properties.</p>
  `,

  investmentConfirmation: (property, amount, shares) => `
    <h2>Investment Confirmation</h2>
    <p>Your investment in <strong>${property}</strong> has been processed.</p>
    <ul>
      <li>Amount Invested: PKR ${amount.toLocaleString()}</li>
      <li>Shares Owned: ${shares}</li>
      <li>Status: Confirmed</li>
    </ul>
  `,

  dividendNotification: (property, amount, date) => `
    <h2>Dividend Distribution</h2>
    <p>You have received dividend from <strong>${property}</strong>.</p>
    <p>Amount: PKR ${amount.toLocaleString()}</p>
    <p>Date: ${date}</p>
  `,

  withdrawalApproval: (amount) => `
    <h2>Withdrawal Approved</h2>
    <p>Your withdrawal request of PKR ${amount.toLocaleString()} has been approved.</p>
    <p>The amount will be transferred to your registered bank account within 2-3 business days.</p>
  `,
};
