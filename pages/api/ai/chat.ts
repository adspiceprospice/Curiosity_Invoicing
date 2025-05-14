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
      return res.status(400).json({ message: 'Invalid request body' });
    }

    // Get user and company information for context
    const user = await prisma.user.findUnique({
      where: { email: session.user?.email as string },
      include: { company: true },
    });

    if (!user || !user.company) {
      return res.status(400).json({ message: 'User or company not found' });
    }

    // Define the available functions for the AI
    const availableFunctions = [
      {
        name: 'create_customer',
        description: 'Create a new customer',
        parameters: {
          type: 'object',
          properties: {
            companyName: { type: 'string', description: 'Name of the customer company' },
            contactPerson: { type: 'string', description: 'Name of the contact person' },
            email: { type: 'string', description: 'Email address of the customer' },
            phoneNumber: { type: 'string', description: 'Phone number of the customer' },
            billingAddress: { type: 'string', description: 'Billing address of the customer' },
            shippingAddress: { type: 'string', description: 'Shipping address of the customer (if different from billing)' },
            vatId: { type: 'string', description: 'VAT ID or BTW-nummer of the customer' },
            notes: { type: 'string', description: 'Additional notes about the customer' },
            preferredLanguage: { type: 'string', description: 'Preferred language for documents (e.g., "en", "nl")' },
          },
          required: ['companyName'],
        },
      },
      {
        name: 'create_document_draft',
        description: 'Create a draft offer or invoice',
        parameters: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['OFFER', 'INVOICE'], description: 'Type of document to create' },
            customerId: { type: 'string', description: 'ID of the customer' },
            languageCode: { type: 'string', description: 'Language code for the document (e.g., "en", "nl")' },
            dueDate: { type: 'string', description: 'Due date for the document (ISO format)' },
            validUntil: { type: 'string', description: 'Valid until date for offers (ISO format)' },
            lineItems: {
              type: 'array',
              description: 'Line items for the document',
              items: {
                type: 'object',
                properties: {
                  description: { type: 'string', description: 'Description of the item' },
                  quantity: { type: 'number', description: 'Quantity of the item' },
                  unitPrice: { type: 'number', description: 'Unit price of the item' },
                  discount: { type: 'number', description: 'Discount for the item (percentage)' },
                  taxRate: { type: 'number', description: 'Tax rate for the item (percentage)' },
                },
                required: ['description', 'quantity', 'unitPrice'],
              },
            },
            notes: { type: 'string', description: 'Additional notes for the document' },
          },
          required: ['type', 'customerId', 'languageCode', 'lineItems'],
        },
      },
      {
        name: 'get_customers',
        description: 'Get a list of customers',
        parameters: {
          type: 'object',
          properties: {
            search: { type: 'string', description: 'Search term for customer name or contact person' },
            limit: { type: 'number', description: 'Maximum number of customers to return' },
          },
        },
      },
      {
        name: 'get_documents',
        description: 'Get a list of documents (offers or invoices)',
        parameters: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['OFFER', 'INVOICE'], description: 'Type of documents to retrieve' },
            status: { type: 'string', description: 'Status of documents to retrieve (comma-separated for multiple)' },
            customerId: { type: 'string', description: 'Filter by customer ID' },
            limit: { type: 'number', description: 'Maximum number of documents to return' },
          },
          required: ['type'],
        },
      },
      {
        name: 'update_template',
        description: 'Update a document template',
        parameters: {
          type: 'object',
          properties: {
            templateId: { type: 'string', description: 'ID of the template to update' },
            name: { type: 'string', description: 'Name of the template' },
            content: { type: 'string', description: 'Content of the template (HTML/JSON)' },
          },
          required: ['templateId'],
        },
      },
      {
        name: 'convert_offer_to_invoice',
        description: 'Convert an offer to an invoice',
        parameters: {
          type: 'object',
          properties: {
            offerId: { type: 'string', description: 'ID of the offer to convert' },
            dueDate: { type: 'string', description: 'Due date for the invoice (ISO format)' },
          },
          required: ['offerId'],
        },
      },
    ];

    // Prepare a system prompt with context
    const systemPrompt = `
You are an AI assistant for "${user.company.name}" integrated into a multilingual (Dutch/English) invoicing application.
Your task is to help the user manage customers, offers, invoices, and templates.
You can call functions to perform actions in the system.

Current user: ${user.name || 'User'} (${user.email})
Company: ${user.company.name}

Follow these guidelines:
1. Be concise and professional in your responses
2. For new customers or documents, collect necessary information before calling functions
3. Handle language choices properly (default: English)
4. Always confirm before taking critical actions
5. Respect Dutch language requests and respond in Dutch when asked
`;

    // Send message to Gemini with system prompt and function calling
    const result = await geminiService.callFunction(
      `${systemPrompt}\n\nUser: ${message}`,
      availableFunctions
    );

    // Handle function calls if present
    if (result.functionCalls && result.functionCalls.length > 0) {
      const functionCall = result.functionCalls[0];
      let functionResponse = '';

      // Here you would implement actual function handlers
      switch (functionCall.name) {
        case 'create_customer':
          functionResponse = `I'd be happy to create a new customer for you. Before I do that, let me confirm the details:\n\n${JSON.stringify(functionCall.args, null, 2)}\n\nWould you like me to proceed with creating this customer?`;
          break;
        case 'create_document_draft':
          functionResponse = `I can create a draft ${functionCall.args.type.toLowerCase()} for you. Here are the details:\n\n${JSON.stringify(functionCall.args, null, 2)}\n\nWould you like me to proceed?`;
          break;
        case 'get_customers':
          functionResponse = 'I can help you find customers. Let me search for that information.';
          break;
        case 'get_documents':
          functionResponse = `I'll find the ${functionCall.args.type.toLowerCase()}s for you.`;
          break;
        case 'update_template':
          functionResponse = 'I can help you update that template. Would you like to see a preview first?';
          break;
        case 'convert_offer_to_invoice':
          functionResponse = `I can convert that offer to an invoice. Would you like me to proceed?`;
          break;
        default:
          functionResponse = 'I understand what you want to do, but I need to implement that function first.';
      }

      return res.status(200).json({
        content: functionResponse,
        functionCall: {
          name: functionCall.name,
          args: functionCall.args,
        },
      });
    }

    // If no function call, just return the text response
    return res.status(200).json({
      content: result.text || 'I understood your request but I'm not sure how to help with that specific task yet.',
    });
  } catch (error) {
    console.error('Error processing AI request:', error);
    return res.status(500).json({ message: 'Error processing your request' });
  }
}