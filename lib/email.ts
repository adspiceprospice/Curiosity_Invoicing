import { Resend } from 'resend';

// Initialize the Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailAttachment {
  filename: string;
  content: Buffer;
}

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  from?: string;
  cc?: string[];
  bcc?: string[];
  attachments?: EmailAttachment[];
  replyTo?: string;
}

/**
 * Send an email using Resend
 */
export async function sendEmail({
  to,
  subject,
  html,
  from = `Curiosity Invoicing <invoicing@${process.env.RESEND_DOMAIN || 'resend.dev'}>`,
  cc,
  bcc,
  attachments,
  replyTo,
}: SendEmailParams) {
  try {
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
      cc,
      bcc,
      attachments,
      reply_to: replyTo,
    });

    if (error) {
      console.error('Error sending email:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error with Resend service:', error);
    throw new Error('Failed to send email');
  }
}

/**
 * Generate email templates for offers and invoices in different languages
 */
export function getEmailTemplate(
  type: 'offer' | 'invoice',
  languageCode: 'en' | 'nl',
  data: {
    documentNumber: string;
    companyName: string;
    amount: string;
    dueDate?: string;
    validUntil?: string;
    recipientName?: string;
    senderName: string;
    companyDetails: string;
  }
) {
  // Default English templates
  let subject = '';
  let template = '';

  if (type === 'offer') {
    if (languageCode === 'en') {
      subject = `Offer ${data.documentNumber} from ${data.senderName}`;
      template = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Offer ${data.documentNumber}</h2>
          <p>Dear ${data.recipientName || data.companyName},</p>
          <p>Please find attached our offer ${data.documentNumber} for a total amount of ${data.amount}.</p>
          ${data.validUntil ? `<p>This offer is valid until ${data.validUntil}.</p>` : ''}
          <p>If you have any questions, please don't hesitate to contact us.</p>
          <p>Best regards,<br>${data.senderName}</p>
          <hr>
          <p style="font-size: 12px; color: #666;">${data.companyDetails}</p>
        </div>
      `;
    } else if (languageCode === 'nl') {
      subject = `Offerte ${data.documentNumber} van ${data.senderName}`;
      template = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Offerte ${data.documentNumber}</h2>
          <p>Beste ${data.recipientName || data.companyName},</p>
          <p>Hierbij ontvangt u onze offerte ${data.documentNumber} voor een totaalbedrag van ${data.amount}.</p>
          ${data.validUntil ? `<p>Deze offerte is geldig tot ${data.validUntil}.</p>` : ''}
          <p>Als u vragen heeft, aarzel dan niet om contact met ons op te nemen.</p>
          <p>Met vriendelijke groet,<br>${data.senderName}</p>
          <hr>
          <p style="font-size: 12px; color: #666;">${data.companyDetails}</p>
        </div>
      `;
    }
  } else if (type === 'invoice') {
    if (languageCode === 'en') {
      subject = `Invoice ${data.documentNumber} from ${data.senderName}`;
      template = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Invoice ${data.documentNumber}</h2>
          <p>Dear ${data.recipientName || data.companyName},</p>
          <p>Please find attached our invoice ${data.documentNumber} for a total amount of ${data.amount}.</p>
          ${data.dueDate ? `<p>Please ensure payment is made by ${data.dueDate}.</p>` : ''}
          <p>If you have any questions, please don't hesitate to contact us.</p>
          <p>Best regards,<br>${data.senderName}</p>
          <hr>
          <p style="font-size: 12px; color: #666;">${data.companyDetails}</p>
        </div>
      `;
    } else if (languageCode === 'nl') {
      subject = `Factuur ${data.documentNumber} van ${data.senderName}`;
      template = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Factuur ${data.documentNumber}</h2>
          <p>Beste ${data.recipientName || data.companyName},</p>
          <p>Hierbij ontvangt u onze factuur ${data.documentNumber} voor een totaalbedrag van ${data.amount}.</p>
          ${data.dueDate ? `<p>Gelieve te betalen vóór ${data.dueDate}.</p>` : ''}
          <p>Als u vragen heeft, aarzel dan niet om contact met ons op te nemen.</p>
          <p>Met vriendelijke groet,<br>${data.senderName}</p>
          <hr>
          <p style="font-size: 12px; color: #666;">${data.companyDetails}</p>
        </div>
      `;
    }
  }

  return {
    subject,
    html: template,
  };
}