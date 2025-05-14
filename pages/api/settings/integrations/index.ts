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

  // Only admins can manage integration settings
  // For simplicity, we'll consider anyone with a company as an admin
  if (!user.company) {
    return res.status(403).json({ message: 'Company profile required' });
  }

  // Handle different HTTP methods
  switch (req.method) {
    case 'GET':
      return getIntegrationSettings(req, res);
    case 'POST':
      return updateIntegrationSettings(req, res);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

// Get integration settings
async function getIntegrationSettings(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Define the keys we want to retrieve
    const integrationKeys = [
      'resend.enabled',
      'resend.domain',
      'resend.fromEmail',
      'resend.fromName',
      'google-drive.enabled',
      'google-drive.baseFolderName',
      'google-drive.useTemplateLanguageFolders',
      'google-drive.fileNamingPattern',
      'gemini.enabled',
      'gemini.temperature',
      'gemini.maxTokens',
    ];

    // Fetch all integration settings
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: integrationKeys,
        },
      },
    });

    // Convert to an object for easier consumption
    const settingsObject: Record<string, string> = {};
    integrationKeys.forEach(key => {
      const setting = settings.find(s => s.key === key);
      settingsObject[key] = setting ? setting.value : '';
    });

    return res.status(200).json(settingsObject);
  } catch (error) {
    console.error('Error fetching integration settings:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Update integration settings
async function updateIntegrationSettings(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const settings = req.body;

    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ message: 'Invalid settings data' });
    }

    // Update or create each setting
    const updates = Object.entries(settings).map(async ([key, value]) => {
      return prisma.setting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      });
    });

    await Promise.all(updates);

    return res.status(200).json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Error updating integration settings:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}