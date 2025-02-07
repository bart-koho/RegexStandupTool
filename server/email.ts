import { MailService } from '@sendgrid/mail';
import crypto from 'crypto';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY environment variable must be set");
}

const mailService = new MailService();
mailService.setApiKey(process.env.SENDGRID_API_KEY);

export function generateActivationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function sendActivationEmail(email: string, name: string, token: string) {
  const activationLink = `${process.env.BASE_URL || 'http://localhost:5000'}/activate/${token}`;
  
  try {
    await mailService.send({
      to: email,
      from: 'noreply@asyncstandup.com', // Update this with your verified sender
      subject: 'Welcome to Async Standup - Activate Your Account',
      html: `
        <h1>Welcome to Async Standup, ${name}!</h1>
        <p>You've been added as a team member. To get started, please set up your password by clicking the link below:</p>
        <p><a href="${activationLink}">Set Up Your Password</a></p>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't expect this invite, please ignore this email.</p>
      `,
    });
    return true;
  } catch (error) {
    console.error('Failed to send activation email:', error);
    return false;
  }
}
