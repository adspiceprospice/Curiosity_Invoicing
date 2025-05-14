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

  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get the source template
    const sourceTemplate = await prisma.template.findFirst({
      where: {
        id,
        companyId,
      },
    });

    if (!sourceTemplate) {
      return res.status(404).json({ message: 'Template not found' });
    }

    // Create a new template based on the source template
    const newName = req.body.name || `${sourceTemplate.name} (Copy)`;
    
    const duplicatedTemplate = await prisma.template.create({
      data: {
        name: newName,
        type: sourceTemplate.type,
        languageCode: sourceTemplate.languageCode,
        isDefault: false, // Never make the duplicate the default
        content: sourceTemplate.content,
        companyId,
      },
    });

    return res.status(201).json({
      message: 'Template duplicated successfully',
      template: duplicatedTemplate,
    });
  } catch (error) {
    console.error('Error duplicating template:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}