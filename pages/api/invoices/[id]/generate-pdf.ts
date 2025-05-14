import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { prisma } from '@/lib/prisma';
import { generatePDF } from '@/lib/pdfGenerator';
import { uploadToGoogleDrive } from '@/lib/googleDrive';
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
    // Get the invoice with all necessary related data
    const invoice = await prisma.document.findFirst({
      where: {
        id,
        companyId,
        type: 'INVOICE',
      },
      include: {
        customer: true,
        lineItems: true,
        template: true,
        company: {
          include: {
            companyTranslation: {
              where: {
                languageCode: {
                  equals: 'en', // Default to English, will be overridden below
                }
              }
            }
          }
        }
      },
    });

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Override the company translation language to match the invoice language
    const fullInvoice = await prisma.document.findFirst({
      where: {
        id,
        companyId,
        type: 'INVOICE',
      },
      include: {
        customer: true,
        lineItems: true,
        template: true,
        company: {
          include: {
            companyTranslation: {
              where: {
                languageCode: invoice.languageCode
              }
            }
          }
        }
      },
    });

    if (!fullInvoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Generate the PDF
    const pdfBuffer = await generatePDF(fullInvoice);

    // Create a folder structure in Google Drive
    // Format: [App Name]/Invoices/[Year]/[LanguageCode]/
    const year = new Date(fullInvoice.issueDate).getFullYear();
    const folderPath = `Curiosity Invoicing/Invoices/${year}/${fullInvoice.languageCode}`;
    
    // Upload to Google Drive
    const uploadResult = await uploadToGoogleDrive({
      buffer: pdfBuffer,
      fileName: `${fullInvoice.documentNumber}.pdf`,
      folderPath,
      mimeType: 'application/pdf',
    });

    // Update the invoice with the PDF URL and Google Drive ID
    const updatedInvoice = await prisma.document.update({
      where: { id },
      data: {
        pdfUrl: uploadResult.webViewLink,
        pdfGoogleDriveId: uploadResult.id,
      },
    });

    return res.status(200).json({
      message: 'PDF generated and uploaded successfully',
      pdfUrl: updatedInvoice.pdfUrl,
      pdfGoogleDriveId: updatedInvoice.pdfGoogleDriveId,
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}