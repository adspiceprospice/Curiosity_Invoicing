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
  const { id } = req.query;

  if (!id || Array.isArray(id)) {
    return res.status(400).json({ message: 'Invalid template ID' });
  }

  // Verify the template exists and belongs to the company
  const template = await prisma.template.findFirst({
    where: {
      id,
      companyId,
    },
  });

  if (!template) {
    return res.status(404).json({ message: 'Template not found' });
  }

  // Handle different HTTP methods
  switch (req.method) {
    case 'GET':
      return getTemplate(req, res, id);
    case 'PUT':
      return updateTemplate(req, res, id, companyId);
    case 'DELETE':
      return deleteTemplate(req, res, id, companyId);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

// Get a single template
async function getTemplate(
  req: NextApiRequest,
  res: NextApiResponse,
  id: string
) {
  try {
    const template = await prisma.template.findUnique({
      where: { id },
    });

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    return res.status(200).json(template);
  } catch (error) {
    console.error('Error fetching template:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Update an existing template
async function updateTemplate(
  req: NextApiRequest,
  res: NextApiResponse,
  id: string,
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

    const currentTemplate = await prisma.template.findUnique({
      where: { id },
    });

    if (!currentTemplate) {
      return res.status(404).json({ message: 'Template not found' });
    }

    // Check if this template should be the default
    if (isDefault && !currentTemplate.isDefault) {
      // Unset isDefault on other templates of the same type and language
      await prisma.template.updateMany({
        where: {
          companyId,
          type: currentTemplate.type,
          languageCode: currentTemplate.languageCode,
          isDefault: true,
          id: { not: id },
        },
        data: { isDefault: false },
      });
    }

    // Update the template
    const updatedTemplate = await prisma.template.update({
      where: { id },
      data: {
        name: name || currentTemplate.name,
        type: type || currentTemplate.type,
        languageCode: languageCode || currentTemplate.languageCode,
        isDefault: isDefault !== undefined ? isDefault : currentTemplate.isDefault,
        content: content || currentTemplate.content,
      },
    });

    return res.status(200).json(updatedTemplate);
  } catch (error) {
    console.error('Error updating template:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Delete a template
async function deleteTemplate(
  req: NextApiRequest,
  res: NextApiResponse,
  id: string,
  companyId: string
) {
  try {
    const template = await prisma.template.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            documents: true,
          },
        },
      },
    });

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    // Check if the template is being used by any documents
    if (template._count.documents > 0) {
      return res.status(400).json({
        message: 'Cannot delete template that is being used by documents',
        documentsCount: template._count.documents,
      });
    }

    // Delete the template
    await prisma.template.delete({
      where: { id },
    });

    // If the deleted template was the default, set a new default template
    if (template.isDefault) {
      const nextTemplate = await prisma.template.findFirst({
        where: {
          companyId,
          type: template.type,
          languageCode: template.languageCode,
        },
      });

      if (nextTemplate) {
        await prisma.template.update({
          where: { id: nextTemplate.id },
          data: { isDefault: true },
        });
      }
    }

    return res.status(200).json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error deleting template:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}