import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.EMAIL_FROM || 'onboarding@resend.dev';
interface EmailPayload {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export async function sendEmail({ to, subject, html, text, from = FROM_EMAIL }: EmailPayload): Promise<{ success: boolean; message?: string; error?: any }> {
  if (!process.env.RESEND_API_KEY) {
    console.error('Resend API key is not configured.');
    return { success: false, message: 'Email service is not configured.' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'gleb.by2005@gmail.com',
      subject: subject,
      html: html,
      text: text,
    });

    if (error) {
      console.error('Error sending email via Resend:', error);
      return { success: false, message: 'Failed to send email.', error: error };
    }

    console.log('Email sent successfully via Resend:', data);
    return { success: true };
  } catch (exception: any) {
    console.error('Exception during email sending:', exception);
    return { success: false, message: 'An unexpected error occurred while sending the email.', error: exception };
  }
}