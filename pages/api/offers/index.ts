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

  // Handle different HTTP methods
  switch (req.method) {
    case 'GET':
      return getOffers(req, res, companyId);
    case 'POST':
      return createOffer(req, res, companyId);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

// Get all offers for the company with filtering options
async function getOffers(
  req: NextApiRequest,
  res: NextApiResponse,
  companyId: string
) {
  try {
    const {
      status,
      customerId,
      search,
      startDate,
      endDate,
      languageCode,
      sortBy = 'issueDate',
      sortDirection = 'desc',
      page = 1,
      limit = 10,
    } = req.query;

    // Create filter based on provided query parameters
    let where: any = {
      companyId,
      type: DocumentType.OFFER,
    };

    // Filter by status if provided
    if (status) {
      where.status = status;
    }

    // Filter by customer if provided
    if (customerId) {
      where.customerId = customerId;
    }

    // Filter by language if provided
    if (languageCode) {
      where.languageCode = languageCode;
    }

    // Filter by date range if provided
    if (startDate || endDate) {
      where.issueDate = {};
      if (startDate) {
        where.issueDate.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.issueDate.lte = new Date(endDate as string);
      }
    }

    // Add search functionality
    if (search) {
      const searchString = search as string;
      where.OR = [
        { documentNumber: { contains: searchString, mode: 'insensitive' } },
        { customer: { companyName: { contains: searchString, mode: 'insensitive' } } },
        { notes: { contains: searchString, mode: 'insensitive' } },
      ];
    }

    // Calculate pagination values
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    // Determine sort field and direction
    const orderBy: any = {};
    orderBy[sortBy as string] = sortDirection;

    // Get total count for pagination
    const totalCount = await prisma.document.count({ where });

    // Get offers with related data
    const offers = await prisma.document.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            companyName: true,
            email: true,
          },
        },
        lineItems: true,
        template: {
          select: {
            id: true,
            name: true,
            languageCode: true,
          },
        },
      },
      orderBy,
      skip,
      take,
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / Number(limit));
    const hasNextPage = Number(page) < totalPages;
    const hasPreviousPage = Number(page) > 1;

    return res.status(200).json({
      offers,
      pagination: {
        totalCount,
        totalPages,
        currentPage: Number(page),
        pageSize: Number(limit),
        hasNextPage,
        hasPreviousPage,
      },
    });
  } catch (error) {
    console.error('Error fetching offers:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Create a new offer
async function createOffer(
  req: NextApiRequest,
  res: NextApiResponse,
  companyId: string
) {
  try {
    const {
      customerId,
      languageCode,
      issueDate,
      validUntil,
      paymentTerms,
      notes,
      templateId,
      lineItems,
    } = req.body;

    // Validate required fields
    if (!customerId) {
      return res.status(400).json({ message: 'Customer is required' });
    }

    if (!languageCode) {
      return res.status(400).json({ message: 'Language is required' });
    }

    if (!templateId) {
      return res.status(400).json({ message: 'Template is required' });
    }

    // Get the latest offer number to generate the new number
    const latestOffer = await prisma.document.findFirst({
      where: {
        companyId,
        type: DocumentType.OFFER,
        documentNumber: {
          startsWith: `OFFER-${new Date().getFullYear()}-`,
        },
      },
      orderBy: {
        documentNumber: 'desc',
      },
    });

    // Generate new offer number (OFFER-YYYY-XXXX)
    let newNumberIndex = 1;
    if (latestOffer) {
      const parts = latestOffer.documentNumber.split('-');
      if (parts.length === 3) {
        newNumberIndex = parseInt(parts[2], 10) + 1;
      }
    }

    const documentNumber = `OFFER-${new Date().getFullYear()}-${newNumberIndex.toString().padStart(4, '0')}`;

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

    // Create the offer with line items
    const offer = await prisma.document.create({
      data: {
        type: DocumentType.OFFER,
        status: DocumentStatus.DRAFT,
        documentNumber,
        customerId,
        companyId,
        templateId,
        languageCode,
        issueDate: issueDate ? new Date(issueDate) : new Date(),
        validUntil: validUntil ? new Date(validUntil) : undefined,
        totalAmount,
        totalTax,
        totalDiscount,
        paymentTerms,
        notes,
        lineItems: {
          create: lineItems.map((item: any) => ({
            description: item.description,
            quantity: parseFloat(item.quantity),
            unitPrice: parseFloat(item.unitPrice),
            discount: parseFloat(item.discount) || 0,
            taxRate: parseFloat(item.taxRate) || 0,
          })),
        },
      },
      include: {
        customer: true,
        lineItems: true,
        template: true,
      },
    });

    return res.status(201).json(offer);
  } catch (error) {
    console.error('Error creating offer:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}