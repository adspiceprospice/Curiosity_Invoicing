import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { prisma } from '@/lib/prisma';
import { DocumentStatus, DocumentType } from '@prisma/client';

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
    return res.status(400).json({ message: 'Invalid offer ID' });
  }

  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get the offer details
    const offer = await prisma.document.findFirst({
      where: {
        id,
        companyId,
        type: DocumentType.OFFER,
      },
      include: {
        customer: true,
        lineItems: true,
        template: {
          select: {
            id: true,
            name: true,
            type: true,
            languageCode: true,
          },
        },
      },
    });

    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    // Check if the offer status is valid for conversion (ACCEPTED offers can be converted to invoices)
    if (offer.status !== DocumentStatus.ACCEPTED) {
      return res
        .status(400)
        .json({ message: 'Only accepted offers can be converted to invoices' });
    }

    // Find an invoice template with the same language
    const invoiceTemplate = await prisma.template.findFirst({
      where: {
        companyId,
        type: DocumentType.INVOICE,
        languageCode: offer.languageCode,
        isDefault: true,
      },
    });

    if (!invoiceTemplate) {
      return res.status(400).json({
        message: `No default invoice template found for language: ${offer.languageCode}`,
      });
    }

    // Get the latest invoice number to generate the new number
    const latestInvoice = await prisma.document.findFirst({
      where: {
        companyId,
        type: DocumentType.INVOICE,
        documentNumber: {
          startsWith: `INV-${new Date().getFullYear()}-`,
        },
      },
      orderBy: {
        documentNumber: 'desc',
      },
    });

    // Generate new invoice number (INV-YYYY-XXXX)
    let newNumberIndex = 1;
    if (latestInvoice) {
      const parts = latestInvoice.documentNumber.split('-');
      if (parts.length === 3) {
        newNumberIndex = parseInt(parts[2], 10) + 1;
      }
    }

    const documentNumber = `INV-${new Date().getFullYear()}-${newNumberIndex
      .toString()
      .padStart(4, '0')}`;

    // Calculate due date (default: 30 days after issue date)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    // Create the invoice
    const invoice = await prisma.$transaction(async (prisma) => {
      // First, create the invoice
      const newInvoice = await prisma.document.create({
        data: {
          type: DocumentType.INVOICE,
          status: DocumentStatus.DRAFT,
          documentNumber,
          customerId: offer.customerId,
          companyId,
          templateId: invoiceTemplate.id,
          languageCode: offer.languageCode,
          issueDate: new Date(),
          dueDate,
          totalAmount: offer.totalAmount,
          totalTax: offer.totalTax,
          totalDiscount: offer.totalDiscount,
          paymentTerms: offer.paymentTerms,
          notes: offer.notes,
          convertedFromOfferId: offer.id,
        },
      });

      // Copy line items from offer to invoice
      for (const item of offer.lineItems) {
        await prisma.lineItem.create({
          data: {
            documentId: newInvoice.id,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount,
            taxRate: item.taxRate,
          },
        });
      }

      // Update the offer with the reference to the invoice
      await prisma.document.update({
        where: { id: offer.id },
        data: {
          convertedToInvoiceId: newInvoice.id,
        },
      });

      // Return the complete invoice with relations
      return await prisma.document.findUnique({
        where: { id: newInvoice.id },
        include: {
          customer: true,
          lineItems: true,
          template: true,
        },
      });
    });

    return res.status(201).json({
      message: 'Offer successfully converted to invoice',
      invoice,
    });
  } catch (error) {
    console.error('Error converting offer to invoice:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}