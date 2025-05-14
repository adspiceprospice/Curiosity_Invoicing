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

  // Get the user
  const user = await prisma.user.findUnique({
    where: { email: session.user?.email as string },
    include: { company: true },
  });

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Handle different HTTP methods
  switch (req.method) {
    case 'GET':
      return getCompanyProfile(res, user);
    case 'POST':
      return createOrUpdateCompanyProfile(req, res, user);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

// Get company profile
async function getCompanyProfile(
  res: NextApiResponse,
  user: any
) {
  try {
    // If company exists, return it
    if (user.company) {
      return res.status(200).json(user.company);
    }

    // Otherwise, return a 404
    return res.status(404).json({ message: 'Company profile not found' });
  } catch (error) {
    console.error('Error fetching company profile:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Create or update company profile
async function createOrUpdateCompanyProfile(
  req: NextApiRequest,
  res: NextApiResponse,
  user: any
) {
  try {
    const {
      name,
      addressLine1,
      addressLine2,
      city,
      postalCode,
      country,
      vatId,
      phoneNumber,
      email,
      website,
      bankAccountName,
      bankAccountNumber,
      bankAccountBIC,
      logoUrl,
    } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({ message: 'Company name is required' });
    }

    // If company exists, update it
    if (user.company) {
      const updatedCompany = await prisma.company.update({
        where: { id: user.company.id },
        data: {
          name,
          addressLine1,
          addressLine2,
          city,
          postalCode,
          country,
          vatId,
          phoneNumber,
          email,
          website,
          bankAccountName,
          bankAccountNumber,
          bankAccountBIC,
          logoUrl,
        },
      });

      return res.status(200).json(updatedCompany);
    }

    // Otherwise, create a new company
    const newCompany = await prisma.company.create({
      data: {
        name,
        addressLine1,
        addressLine2,
        city,
        postalCode,
        country,
        vatId,
        phoneNumber,
        email,
        website,
        bankAccountName,
        bankAccountNumber,
        bankAccountBIC,
        logoUrl,
        userId: user.id,
      },
    });

    return res.status(201).json(newCompany);
  } catch (error) {
    console.error('Error creating/updating company profile:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}