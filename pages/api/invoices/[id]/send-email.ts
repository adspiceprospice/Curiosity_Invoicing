import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/emailService';
import { DocumentStatus } from '@prisma/client';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getSession({ req });

  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Get user and check if they have a company
  const user = await prisma.user.findUnique({
    where: { email: session.user?.email as string },
    include: { company: true },
  });

  if (!user || !user.company) {
    return res.status(403).json({ message: 'Company profile required' });
  }

  const companyId = user.company.id;
  const { id } = req.query;

  if (!id || Array.isArray(id)) {
    return res.status(400).json({ message: 'Invalid invoice ID' });
  }

  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { subject, body, recipientEmail } = req.body;

    if (!subject || !body) {
      return res.status(400).json({ message: 'Email subject and body are required' });
    }

    // Get the invoice with necessary related data
    const invoice = await prisma.document.findFirst({
      where: {
        id,
        companyId,
        type: 'INVOICE',
      },
      include: {
        customer: true,
      },
    });

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Verify the invoice has a PDF generated
    if (!invoice.pdfUrl || !invoice.pdfGoogleDriveId) {
      return res.status(400).json({
        message: 'PDF must be generated before sending the invoice via email',
      });
    }

    // Determine the recipient email
    const toEmail = recipientEmail || invoice.customer?.email;
    
    if (!toEmail) {
      return res.status(400).json({
        message: 'No recipient email provided and customer has no email',
      });
    }

    // Send the email with the invoice PDF attached
    const emailResult = await sendEmail({
      to: toEmail,
      from: user.company.email || user.email as string,
      subject,
      html: body,
      attachments: [
        {
          filename: `${invoice.documentNumber}.pdf`,
          path: invoice.pdfUrl,
        },
      ],
    });

    // Update the invoice status to SENT and record email sent information
    const updatedInvoice = await prisma.document.update({
      where: { id },
      data: {
        status: DocumentStatus.SENT,
        emailSent: true,
        lastEmailSentAt: new Date(),
      },
    });

    return res.status(200).json({
      message: 'Invoice sent successfully via email',
      emailResult,
    });
  } catch (error) {
    console.error('Error sending invoice via email:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}