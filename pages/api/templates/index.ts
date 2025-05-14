import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { prisma } from '@/lib/prisma';
import { DocumentType } from '@prisma/client';

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
      return getTemplates(req, res, companyId);
    case 'POST':
      return createTemplate(req, res, companyId);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

// Get all templates for the company with filtering options
async function getTemplates(
  req: NextApiRequest,
  res: NextApiResponse,
  companyId: string
) {
  try {
    const {
      type,
      languageCode,
      search,
      sortBy = 'name',
      sortDirection = 'asc',
    } = req.query;

    // Create filter based on provided query parameters
    let where: any = {
      companyId,
    };

    // Filter by document type if provided
    if (type) {
      where.type = type;
    }

    // Filter by language if provided
    if (languageCode) {
      where.languageCode = languageCode;
    }

    // Add search functionality
    if (search) {
      const searchString = search as string;
      where.OR = [
        { name: { contains: searchString, mode: 'insensitive' } },
      ];
    }

    // Determine sort field and direction
    const orderBy: any = {};
    orderBy[sortBy as string] = sortDirection;

    // Get templates with related data
    const templates = await prisma.template.findMany({
      where,
      orderBy,
    });

    return res.status(200).json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Create a new template
async function createTemplate(
  req: NextApiRequest,
  res: NextApiResponse,
  companyId: string
) {
  try {
    const {
      name,
      type,
      languageCode,
      isDefault,
      content,
    } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({ message: 'Template name is required' });
    }

    if (!type) {
      return res.status(400).json({ message: 'Template type is required' });
    }

    if (!languageCode) {
      return res.status(400).json({ message: 'Language is required' });
    }

    if (!content) {
      return res.status(400).json({ message: 'Template content is required' });
    }

    // Check if a default template already exists for this type and language
    let shouldBeDefault = isDefault || false;
    
    if (shouldBeDefault) {
      const existingDefault = await prisma.template.findFirst({
        where: {
          companyId,
          type,
          languageCode,
          isDefault: true,
        },
      });

      if (existingDefault) {
        // Unset isDefault on the existing default template
        await prisma.template.update({
          where: { id: existingDefault.id },
          data: { isDefault: false },
        });
      }
    } else {
      // Check if this is the first template of this type and language
      const existingTemplates = await prisma.template.findMany({
        where: {
          companyId,
          type,
          languageCode,
        },
      });

      if (existingTemplates.length === 0) {
        // Make it default if it's the first one
        shouldBeDefault = true;
      }
    }

    // Create the template
    const template = await prisma.template.create({
      data: {
        name,
        type: type as DocumentType,
        languageCode,
        isDefault: shouldBeDefault,
        content,
        companyId,
      },
    });

    return res.status(201).json(template);
  } catch (error) {
    console.error('Error creating template:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}