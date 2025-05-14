import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { prisma } from '@/lib/prisma';
import { DocumentStatus } from '@prisma/client';

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
    return res.status(400).json({ message: 'Invalid invoice ID' });
  }

  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Verify the invoice exists and belongs to the company
    const invoice = await prisma.document.findFirst({
      where: {
        id,
        companyId,
        type: 'INVOICE',
      },
    });

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Check if the invoice is already marked as paid
    if (invoice.status === DocumentStatus.PAID) {
      return res.status(400).json({ message: 'Invoice is already marked as paid' });
    }

    // Mark the invoice as partially paid
    const updatedInvoice = await prisma.document.update({
      where: { id },
      data: {
        status: DocumentStatus.PARTIALLY_PAID,
      },
      include: {
        customer: true,
      },
    });

    return res.status(200).json({
      message: 'Invoice marked as partially paid successfully',
      invoice: updatedInvoice,
    });
  } catch (error) {
    console.error('Error marking invoice as partially paid:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}