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
  });

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Handle different HTTP methods
  switch (req.method) {
    case 'GET':
      return getUserProfile(req, res, user.id);
    case 'PATCH':
      return updateUserProfile(req, res, user.id);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

// Get user profile
async function getUserProfile(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Update user profile
async function updateUserProfile(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  try {
    const { name, image } = req.body;

    // Validate required fields
    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Name is required' });
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        image,
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(200).json(updatedUser);
  } catch (error) {
    console.error('Error updating user profile:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}