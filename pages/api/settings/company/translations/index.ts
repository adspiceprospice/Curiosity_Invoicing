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
      return getCompanyTranslations(req, res, companyId);
    case 'POST':
      return createOrUpdateCompanyTranslation(req, res, companyId);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

// Get all company translations
async function getCompanyTranslations(
  req: NextApiRequest,
  res: NextApiResponse,
  companyId: string
) {
  try {
    const translations = await prisma.companyTranslation.findMany({
      where: { companyId },
    });

    return res.status(200).json(translations);
  } catch (error) {
    console.error('Error fetching company translations:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Create or update a company translation
async function createOrUpdateCompanyTranslation(
  req: NextApiRequest,
  res: NextApiResponse,
  companyId: string
) {
  try {
    const {
      languageCode,
      addressLine1,
      addressLine2,
      paymentTermsText,
      invoiceFooterText,
      offerFooterText,
    } = req.body;

    // Validate required fields
    if (!languageCode) {
      return res.status(400).json({ message: 'Language code is required' });
    }

    // Check if translation already exists for this language
    const existingTranslation = await prisma.companyTranslation.findUnique({
      where: {
        companyId_languageCode: {
          companyId,
          languageCode,
        },
      },
    });

    let translation;

    if (existingTranslation) {
      // Update existing translation
      translation = await prisma.companyTranslation.update({
        where: { id: existingTranslation.id },
        data: {
          addressLine1,
          addressLine2,
          paymentTermsText,
          invoiceFooterText,
          offerFooterText,
        },
      });
    } else {
      // Create new translation
      translation = await prisma.companyTranslation.create({
        data: {
          companyId,
          languageCode,
          addressLine1,
          addressLine2,
          paymentTermsText,
          invoiceFooterText,
          offerFooterText,
        },
      });
    }

    return res.status(200).json(translation);
  } catch (error) {
    console.error('Error creating/updating company translation:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}