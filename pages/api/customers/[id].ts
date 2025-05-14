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
  const customerId = req.query.id as string;

  if (!customerId) {
    return res.status(400).json({ message: 'Customer ID is required' });
  }

  // Verify the customer belongs to the user's company
  const customer = await prisma.customer.findFirst({
    where: {
      id: customerId,
      companyId,
    },
  });

  if (!customer) {
    return res.status(404).json({ message: 'Customer not found' });
  }

  // Handle different HTTP methods
  switch (req.method) {
    case 'GET':
      return getCustomer(req, res, customerId);
    case 'PUT':
      return updateCustomer(req, res, customerId);
    case 'DELETE':
      return deleteCustomer(req, res, customerId);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

// Get a single customer
async function getCustomer(
  req: NextApiRequest,
  res: NextApiResponse,
  customerId: string
) {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        documents: {
          orderBy: {
            issueDate: 'desc',
          },
          include: {
            _count: {
              select: {
                lineItems: true,
              },
            },
          },
        },
      },
    });

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    return res.status(200).json(customer);
  } catch (error) {
    console.error('Error fetching customer:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Update a customer
async function updateCustomer(
  req: NextApiRequest,
  res: NextApiResponse,
  customerId: string
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

    // Update the customer
    const updatedCustomer = await prisma.customer.update({
      where: { id: customerId },
      data: {
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

    return res.status(200).json(updatedCustomer);
  } catch (error) {
    console.error('Error updating customer:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Delete a customer
async function deleteCustomer(
  req: NextApiRequest,
  res: NextApiResponse,
  customerId: string
) {
  try {
    // Check if customer has any documents
    const customerWithDocuments = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        _count: {
          select: {
            documents: true,
          },
        },
      },
    });

    if (customerWithDocuments?._count.documents && customerWithDocuments._count.documents > 0) {
      // Delete all documents associated with this customer first
      // This cascades to line items due to the onDelete: Cascade in the schema
      await prisma.document.deleteMany({
        where: { customerId },
      });
    }

    // Now delete the customer
    await prisma.customer.delete({
      where: { id: customerId },
    });

    return res.status(200).json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Error deleting customer:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}