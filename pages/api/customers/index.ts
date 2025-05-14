import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { prisma } from '@/lib/prisma';

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
      return getCustomers(req, res, companyId);
    case 'POST':
      return createCustomer(req, res, companyId);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

// Get all customers for the company
async function getCustomers(
  req: NextApiRequest,
  res: NextApiResponse,
  companyId: string
) {
  try {
    const customers = await prisma.customer.findMany({
      where: { companyId },
      orderBy: { companyName: 'asc' },
      include: {
        _count: {
          select: {
            documents: true,
          },
        },
      },
    });

    return res.status(200).json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Create a new customer
async function createCustomer(
  req: NextApiRequest,
  res: NextApiResponse,
  companyId: string
) {
  try {
    const {
      companyName,
      contactPerson,
      email,
      phoneNumber,
      billingAddress,
      shippingAddress,
      vatId,
      preferredLanguage,
      notes,
    } = req.body;

    // Validate required fields
    if (!companyName) {
      return res.status(400).json({ message: 'Company name is required' });
    }

    // Create the customer
    const customer = await prisma.customer.create({
      data: {
        companyId,
        companyName,
        contactPerson,
        email,
        phoneNumber,
        billingAddress,
        shippingAddress,
        vatId,
        preferredLanguage,
        notes,
      },
    });

    return res.status(201).json(customer);
  } catch (error) {
    console.error('Error creating customer:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}