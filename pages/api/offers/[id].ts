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
    return res.status(400).json({ message: 'Invalid offer ID' });
  }

  // Verify the offer exists and belongs to the company
  const offer = await prisma.document.findFirst({
    where: {
      id,
      companyId,
      type: 'OFFER',
    },
  });

  if (!offer) {
    return res.status(404).json({ message: 'Offer not found' });
  }

  // Handle different HTTP methods
  switch (req.method) {
    case 'GET':
      return getOffer(req, res, id);
    case 'PUT':
      return updateOffer(req, res, id, companyId);
    case 'DELETE':
      return deleteOffer(req, res, id);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

// Get a single offer with all details
async function getOffer(
  req: NextApiRequest,
  res: NextApiResponse,
  id: string
) {
  try {
    const offer = await prisma.document.findUnique({
      where: { id },
      include: {
        customer: true,
        lineItems: true,
        template: true,
      },
    });

    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    return res.status(200).json(offer);
  } catch (error) {
    console.error('Error fetching offer:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Update an existing offer
async function updateOffer(
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
      validUntil,
      status,
      paymentTerms,
      notes,
      templateId,
      lineItems,
    } = req.body;

    // Get the current offer to check its status
    const currentOffer = await prisma.document.findUnique({
      where: { id },
      include: { lineItems: true },
    });

    if (!currentOffer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    // Only allow editing of draft offers or status changes for non-draft offers
    if (currentOffer.status !== DocumentStatus.DRAFT && 
        req.body.status === currentOffer.status) {
      const fieldsChanged = Object.keys(req.body).filter(key => 
        key !== 'id' && key !== 'status' && 
        JSON.stringify(req.body[key]) !== JSON.stringify(currentOffer[key as keyof typeof currentOffer])
      );
      
      if (fieldsChanged.length > 0) {
        return res.status(400).json({ 
          message: 'Only draft offers can be fully edited. You can only change the status of a sent offer.' 
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

    // Update the offer record
    const updatedOffer = await prisma.$transaction(async (prisma) => {
      // If this is a status update from DRAFT to SENT, update the issueDate to now
      const statusUpdate = status && status !== currentOffer.status;
      const issueDateToUse = statusUpdate && status === DocumentStatus.SENT
        ? new Date()
        : issueDate ? new Date(issueDate) : currentOffer.issueDate;

      // First, delete existing line items if we're updating a draft
      if (currentOffer.status === DocumentStatus.DRAFT && lineItems) {
        await prisma.lineItem.deleteMany({
          where: { documentId: id },
        });
      }

      // Now update the offer
      return await prisma.document.update({
        where: { id },
        data: {
          customerId: customerId || currentOffer.customerId,
          languageCode: languageCode || currentOffer.languageCode,
          issueDate: issueDateToUse,
          validUntil: validUntil ? new Date(validUntil) : currentOffer.validUntil,
          status: status || currentOffer.status,
          totalAmount: currentOffer.status === DocumentStatus.DRAFT ? totalAmount : currentOffer.totalAmount,
          totalTax: currentOffer.status === DocumentStatus.DRAFT ? totalTax : currentOffer.totalTax,
          totalDiscount: currentOffer.status === DocumentStatus.DRAFT ? totalDiscount : currentOffer.totalDiscount,
          paymentTerms: paymentTerms !== undefined ? paymentTerms : currentOffer.paymentTerms,
          notes: notes !== undefined ? notes : currentOffer.notes,
          templateId: templateId || currentOffer.templateId,
          // Add line items if we're updating a draft
          ...(currentOffer.status === DocumentStatus.DRAFT && lineItems && {
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

    return res.status(200).json(updatedOffer);
  } catch (error) {
    console.error('Error updating offer:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Delete an offer
async function deleteOffer(
  req: NextApiRequest,
  res: NextApiResponse,
  id: string
) {
  try {
    // Check if it's a draft and can be deleted
    const offer = await prisma.document.findUnique({
      where: { id },
    });

    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    if (offer.status !== DocumentStatus.DRAFT) {
      return res.status(400).json({ message: 'Only draft offers can be deleted' });
    }

    // Delete line items first (cascade should handle this, but being explicit)
    await prisma.lineItem.deleteMany({
      where: { documentId: id },
    });

    // Delete the offer
    await prisma.document.delete({
      where: { id },
    });

    return res.status(200).json({ message: 'Offer deleted successfully' });
  } catch (error) {
    console.error('Error deleting offer:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}