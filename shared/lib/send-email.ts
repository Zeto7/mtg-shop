// shared/lib/send-email.ts (ПРИМЕР с Resend для текста)
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async (
    to: string,
    subject: string,
    // Принимаем теперь простую строку для текста
    textContent: string
) => {
    if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
        console.error("Email ENV variables not configured.");
        return;
    }

    try {
        console.log(`Sending simple text email to ${to}`);
        const { data, error } = await resend.emails.send({
            from: `MTG Shop <${process.env.EMAIL_FROM}>`,
            to: [to],
            subject: subject,
            text: textContent, // <-- Используем поле text
        });

        if (error) {
            console.error("Error sending email via Resend:", error);
            return; // или throw error;
        }
        console.log("Email sent successfully:", data?.id);
    } catch (error) {
        console.error("Failed to send email:", error);
    }
};