import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { geminiService } from '@/lib/gemini';
import { prisma } from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const session = await getSession({ req });

  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ message: 'Message is required' });
    }

    // Get the user's company information for context
    const user = await prisma.user.findUnique({
      where: { email: session.user?.email as string },
      include: {
        company: {
          include: {
            companyTranslation: true,
          },
        },
      },
    });

    if (!user || !user.company) {
      return res.status(400).json({ message: 'User company not found' });
    }

    // Create context about the user's company
    const companyContext = `
      You are an AI assistant for ${user.company.name}.
      Company details:
      - Name: ${user.company.name}
      - Address: ${user.company.addressLine1 || ''} ${user.company.addressLine2 || ''}, ${user.company.postalCode || ''} ${user.company.city || ''}, ${user.company.country || ''}
      - VAT/BTW: ${user.company.vatId || 'Not specified'}
      - Email: ${user.company.email || 'Not specified'}
      - Phone: ${user.company.phoneNumber || 'Not specified'}
      - Bank Account: ${user.company.bankAccountNumber || 'Not specified'}
      - BIC: ${user.company.bankAccountBIC || 'Not specified'}
      
      You're helping the user (${user.name || 'the user'}) manage their invoices and offers in a multilingual environment (primarily Dutch and English).
      
      When the user asks you to create a document or perform an action, respond as if you're preparing the action, but clarify that you're simulating the process.
      For example, if they ask to create an invoice, explain what information you'd need and how the process would work.
      
      Your primary functions are:
      1. Help with document creation (offers, invoices)
      2. Assist with customer management
      3. Provide guidance on template customization
      4. Support multilingual document handling
      5. Suggest automation workflows
      
      Always maintain a helpful, professional tone.
    `;

    // Send the message to Gemini with the company context
    const response = await geminiService.sendMessage(`${companyContext}\n\nUser message: ${message}`);

    // Store the conversation in the database (optional - implement later)
    // await prisma.aiConversation.create({
    //   data: {
    //     userId: user.id,
    //     userMessage: message,
    //     aiResponse: response,
    //     createdAt: new Date(),
    //   },
    // });

    return res.status(200).json({ content: response });
  } catch (error) {
    console.error('Error processing AI request:', error);
    return res.status(500).json({ message: 'Failed to process request' });
  }
}