import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { prisma } from '@/lib/prisma';
import { generatePDF } from '@/lib/pdfGenerator';

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
    return res.status(400).json({ message: 'Invalid template ID' });
  }

  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get the template
    const template = await prisma.template.findFirst({
      where: {
        id,
        companyId,
      },
    });

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    // Get a sample customer
    let customer = await prisma.customer.findFirst({
      where: { companyId },
    });

    // If no customers exist, create a dummy customer object
    if (!customer) {
      customer = {
        id: 'dummy-id',
        companyName: 'Sample Company',
        contactPerson: 'John Doe',
        email: 'john@example.com',
        phoneNumber: '+1 234 567 890',
        billingAddress: '123 Main St, Sample City',
        shippingAddress: null,
        vatId: 'SAMPLE123',
        notes: null,
        preferredLanguage: template.languageCode,
        createdAt: new Date(),
        updatedAt: new Date(),
        companyId,
      };
    }

    // Create a sample document for preview
    const previewDocument = {
      id: 'dummy-id',
      documentNumber: template.type === 'OFFER' ? 'OFFER-PREVIEW' : 'INVOICE-PREVIEW',
      type: template.type,
      status: 'DRAFT',
      issueDate: new Date(),
      dueDate: template.type === 'INVOICE' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null,
      languageCode: template.languageCode,
      validUntil: template.type === 'OFFER' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null,
      totalAmount: 1000,
      totalTax: 210,
      totalDiscount: 100,
      paymentTerms: 'Payment within 30 days',
      notes: 'This is a sample document for template preview',
      pdfUrl: null,
      pdfGoogleDriveId: null,
      emailSent: false,
      lastEmailSentAt: null,
      convertedToInvoiceId: null,
      convertedFromOfferId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      customerId: customer.id,
      companyId: companyId,
      templateId: template.id,
      customer: customer,
      lineItems: [
        {
          id: 'dummy-line-1',
          description: 'Sample Product 1',
          quantity: 2,
          unitPrice: 400,
          discount: 10,
          taxRate: 21,
          createdAt: new Date(),
          updatedAt: new Date(),
          documentId: 'dummy-id',
        },
        {
          id: 'dummy-line-2',
          description: 'Sample Product 2',
          quantity: 1,
          unitPrice: 300,
          discount: 0,
          taxRate: 21,
          createdAt: new Date(),
          updatedAt: new Date(),
          documentId: 'dummy-id',
        },
      ],
      template: template,
      company: user.company,
    };

    // Generate a preview PDF
    const pdfBuffer = await generatePDF(previewDocument);

    // Return the PDF as a base64 string
    const base64Pdf = pdfBuffer.toString('base64');

    return res.status(200).json({
      message: 'Preview generated successfully',
      previewPdf: base64Pdf,
    });
  } catch (error) {
    console.error('Error generating template preview:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}