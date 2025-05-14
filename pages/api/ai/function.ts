import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { geminiService } from '@/lib/gemini';
import { prisma } from '@/lib/prisma';

// Define the function schema for Gemini
const functionDefinitions = [
  {
    name: 'create_customer',
    description: 'Create a new customer record',
    parameters: {
      type: 'object',
      properties: {
        companyName: {
          type: 'string',
          description: 'Name of the customer\'s company',
        },
        contactPerson: {
          type: 'string',
          description: 'Name of the primary contact person',
        },
        email: {
          type: 'string',
          description: 'Email address of the customer',
        },
        phoneNumber: {
          type: 'string',
          description: 'Phone number of the customer',
        },
        billingAddress: {
          type: 'string',
          description: 'Billing address of the customer',
        },
        vatId: {
          type: 'string',
          description: 'VAT ID or BTW number of the customer',
        },
        preferredLanguage: {
          type: 'string',
          description: 'Preferred language of the customer (en or nl)',
        },
      },
      required: ['companyName'],
    },
  },
  {
    name: 'create_offer_draft',
    description: 'Create a new offer draft',
    parameters: {
      type: 'object',
      properties: {
        customerId: {
          type: 'string',
          description: 'ID of the customer for this offer',
        },
        languageCode: {
          type: 'string',
          description: 'Language code for the offer (en or nl)',
        },
        validUntil: {
          type: 'string',
          description: 'Date until which the offer is valid (YYYY-MM-DD)',
        },
        lineItems: {
          type: 'array',
          description: 'Line items for the offer',
          items: {
            type: 'object',
            properties: {
              description: {
                type: 'string',
                description: 'Description of the item',
              },
              quantity: {
                type: 'number',
                description: 'Quantity of the item',
              },
              unitPrice: {
                type: 'number',
                description: 'Unit price of the item',
              },
              discount: {
                type: 'number',
                description: 'Discount percentage for this item',
              },
              taxRate: {
                type: 'number',
                description: 'Tax rate for this item',
              },
            },
            required: ['description', 'quantity', 'unitPrice'],
          },
        },
        notes: {
          type: 'string',
          description: 'Additional notes for the offer',
        },
      },
      required: ['customerId', 'languageCode', 'lineItems'],
    },
  },
  {
    name: 'create_invoice_draft',
    description: 'Create a new invoice draft',
    parameters: {
      type: 'object',
      properties: {
        customerId: {
          type: 'string',
          description: 'ID of the customer for this invoice',
        },
        languageCode: {
          type: 'string',
          description: 'Language code for the invoice (en or nl)',
        },
        dueDate: {
          type: 'string',
          description: 'Due date for the invoice (YYYY-MM-DD)',
        },
        lineItems: {
          type: 'array',
          description: 'Line items for the invoice',
          items: {
            type: 'object',
            properties: {
              description: {
                type: 'string',
                description: 'Description of the item',
              },
              quantity: {
                type: 'number',
                description: 'Quantity of the item',
              },
              unitPrice: {
                type: 'number',
                description: 'Unit price of the item',
              },
              discount: {
                type: 'number',
                description: 'Discount percentage for this item',
              },
              taxRate: {
                type: 'number',
                description: 'Tax rate for this item',
              },
            },
            required: ['description', 'quantity', 'unitPrice'],
          },
        },
        notes: {
          type: 'string',
          description: 'Additional notes for the invoice',
        },
      },
      required: ['customerId', 'languageCode', 'lineItems'],
    },
  },
  {
    name: 'convert_offer_to_invoice',
    description: 'Convert an existing offer to an invoice',
    parameters: {
      type: 'object',
      properties: {
        offerId: {
          type: 'string',
          description: 'ID of the offer to convert',
        },
        dueDate: {
          type: 'string',
          description: 'Due date for the invoice (YYYY-MM-DD)',
        },
      },
      required: ['offerId'],
    },
  },
  {
    name: 'get_customer_by_name_or_email',
    description: 'Find a customer by name or email',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Customer name or email to search for',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_document_by_number',
    description: 'Find a document by its number',
    parameters: {
      type: 'object',
      properties: {
        documentNumber: {
          type: 'string',
          description: 'Document number to search for (e.g., INV-2025-0001 or OFFER-2025-0001)',
        },
      },
      required: ['documentNumber'],
    },
  },
];

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
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ message: 'Prompt is required' });
    }

    // Get the user's company information for context
    const user = await prisma.user.findUnique({
      where: { email: session.user?.email as string },
      include: {
        company: true,
      },
    });

    if (!user || !user.company) {
      return res.status(400).json({ message: 'User company not found' });
    }

    // Create context about available functions
    const functionContext = `
      You are an AI assistant that can help the user perform actions in their invoicing system.
      You have access to functions that can create customers, draft offers, draft invoices, and more.
      When the user asks you to perform a task, determine if you can use one of the available functions.
      If you need more information to execute a function, ask the user for it.
      Always explain what you're doing and get confirmation before executing critical actions.
    `;

    // Call Gemini with function calling
    const result = await geminiService.callFunction(
      `${functionContext}\n\nUser prompt: ${prompt}`,
      functionDefinitions
    );

    // Process function calls (in a real implementation, we would execute these functions)
    if (result.functionCalls && result.functionCalls.length > 0) {
      // Process each function call
      const processedFunctionCalls = result.functionCalls.map(functionCall => {
        const { name, args } = functionCall;
        
        // For demonstration, we're not actually executing the functions
        // In a real implementation, you would call the appropriate handlers
        
        return {
          functionName: name,
          arguments: args,
          status: 'simulated',
          message: `Function ${name} would be called with the provided arguments.`
        };
      });

      return res.status(200).json({
        content: result.text,
        functionCalls: processedFunctionCalls
      });
    }

    // If no function calls were made, just return the text response
    return res.status(200).json({
      content: result.text,
      functionCalls: []
    });
  } catch (error) {
    console.error('Error processing AI function call:', error);
    return res.status(500).json({ message: 'Failed to process request' });
  }
}