import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { prisma } from '@/lib/prisma';
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

  // Verify the invoice exists and belongs to the company
  const invoice = await prisma.document.findFirst({
    where: {
      id,
      companyId,
      type: 'INVOICE',
    },
  });

  if (!invoice) {
    return res.status(404).json({ message: 'Invoice not found' });
  }

  // Handle different HTTP methods
  switch (req.method) {
    case 'GET':
      return getInvoice(req, res, id);
    case 'PUT':
      return updateInvoice(req, res, id, companyId);
    case 'DELETE':
      return deleteInvoice(req, res, id);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

// Get a single invoice with all details
async function getInvoice(
  req: NextApiRequest,
  res: NextApiResponse,
  id: string
) {
  try {
    const invoice = await prisma.document.findUnique({
      where: { id },
      include: {
        customer: true,
        lineItems: true,
        template: true,
      },
    });

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    return res.status(200).json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Update an existing invoice
async function updateInvoice(
  req: NextApiRequest,
  res: NextApiResponse,
  id: string,
  companyId: string
) {
  try {
    const {
      customerId,
      languageCode,
      issueDate,
      dueDate,
      status,
      paymentTerms,
      notes,
      templateId,
      lineItems,
    } = req.body;

    // Get the current invoice to check its status
    const currentInvoice = await prisma.document.findUnique({
      where: { id },
      include: { lineItems: true },
    });

    if (!currentInvoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Only allow editing of draft invoices or status changes for non-draft invoices
    if (currentInvoice.status !== DocumentStatus.DRAFT && 
        req.body.status === currentInvoice.status) {
      const fieldsChanged = Object.keys(req.body).filter(key => 
        key !== 'id' && key !== 'status' && 
        JSON.stringify(req.body[key]) !== JSON.stringify(currentInvoice[key as keyof typeof currentInvoice])
      );
      
      if (fieldsChanged.length > 0) {
        return res.status(400).json({ 
          message: 'Only draft invoices can be fully edited. You can only change the status of a sent invoice.' 
        });
      }
    }

    // Calculate totals
    let totalAmount = 0;
    let totalTax = 0;
    let totalDiscount = 0;

    if (lineItems && lineItems.length > 0) {
      for (const item of lineItems) {
        const subtotal = parseFloat(item.quantity) * parseFloat(item.unitPrice);
        const discount = parseFloat(item.discount) || 0;
        const discountAmount = discount > 0 ? (subtotal * discount) / 100 : 0;
        const afterDiscount = subtotal - discountAmount;
        const tax = parseFloat(item.taxRate) || 0;
        const taxAmount = tax > 0 ? (afterDiscount * tax) / 100 : 0;

        totalAmount += afterDiscount;
        totalTax += taxAmount;
        totalDiscount += discountAmount;
      }
    }

    // Update the invoice record
    const updatedInvoice = await prisma.$transaction(async (prisma) => {
      // If this is a status update from DRAFT to SENT, update the issueDate to now
      const statusUpdate = status && status !== currentInvoice.status;
      const issueDateToUse = statusUpdate && status === DocumentStatus.SENT
        ? new Date()
        : issueDate ? new Date(issueDate) : currentInvoice.issueDate;

      // First, delete existing line items if we're updating a draft
      if (currentInvoice.status === DocumentStatus.DRAFT && lineItems) {
        await prisma.lineItem.deleteMany({
          where: { documentId: id },
        });
      }

      // Now update the invoice
      return await prisma.document.update({
        where: { id },
        data: {
          customerId: customerId || currentInvoice.customerId,
          languageCode: languageCode || currentInvoice.languageCode,
          issueDate: issueDateToUse,
          dueDate: dueDate ? new Date(dueDate) : currentInvoice.dueDate,
          status: status || currentInvoice.status,
          totalAmount: currentInvoice.status === DocumentStatus.DRAFT ? totalAmount : currentInvoice.totalAmount,
          totalTax: currentInvoice.status === DocumentStatus.DRAFT ? totalTax : currentInvoice.totalTax,
          totalDiscount: currentInvoice.status === DocumentStatus.DRAFT ? totalDiscount : currentInvoice.totalDiscount,
          paymentTerms: paymentTerms !== undefined ? paymentTerms : currentInvoice.paymentTerms,
          notes: notes !== undefined ? notes : currentInvoice.notes,
          templateId: templateId || currentInvoice.templateId,
          // Add line items if we're updating a draft
          ...(currentInvoice.status === DocumentStatus.DRAFT && lineItems && {
            lineItems: {
              create: lineItems.map((item: any) => ({
                description: item.description,
                quantity: parseFloat(item.quantity),
                unitPrice: parseFloat(item.unitPrice),
                discount: parseFloat(item.discount) || 0,
                taxRate: parseFloat(item.taxRate) || 0,
              })),
            },
          }),
        },
        include: {
          customer: true,
          lineItems: true,
          template: true,
        },
      });
    });

    return res.status(200).json(updatedInvoice);
  } catch (error) {
    console.error('Error updating invoice:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Delete an invoice
async function deleteInvoice(
  req: NextApiRequest,
  res: NextApiResponse,
  id: string
) {
  try {
    // Check if it's a draft and can be deleted
    const invoice = await prisma.document.findUnique({
      where: { id },
    });

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    if (invoice.status !== DocumentStatus.DRAFT) {
      return res.status(400).json({ message: 'Only draft invoices can be deleted' });
    }

    // Delete line items first (cascade should handle this, but being explicit)
    await prisma.lineItem.deleteMany({
      where: { documentId: id },
    });

    // Delete the invoice
    await prisma.document.delete({
      where: { id },
    });

    return res.status(200).json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}