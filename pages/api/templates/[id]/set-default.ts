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
    // Get the template to be made default
    const template = await prisma.template.findFirst({
      where: {
        id,
        companyId,
      },
    });

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    // If the template is already default, nothing to do
    if (template.isDefault) {
      return res.status(200).json({
        message: 'Template is already the default',
        template,
      });
    }

    // Remove default flag from any other template of the same type and language
    await prisma.template.updateMany({
      where: {
        companyId,
        type: template.type,
        languageCode: template.languageCode,
        isDefault: true,
      },
      data: {
        isDefault: false,
      },
    });

    // Set this template as the default
    const updatedTemplate = await prisma.template.update({
      where: { id },
      data: {
        isDefault: true,
      },
    });

    return res.status(200).json({
      message: 'Template set as default successfully',
      template: updatedTemplate,
    });
  } catch (error) {
    console.error('Error setting template as default:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}