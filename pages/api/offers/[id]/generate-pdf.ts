import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { prisma } from '@/lib/prisma';
import { generatePDF } from '@/lib/pdfGenerator';
import { uploadDocumentToDrive } from '@/lib/document-upload';

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
    return res.status(400).json({ message: 'Invalid offer ID' });
  }

  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get the offer with all necessary related data
    const offer = await prisma.document.findFirst({
      where: {
        id,
        companyId,
        type: 'OFFER',
      },
      include: {
        customer: true,
        lineItems: true,
        template: true,
        company: {
          include: {
            companyTranslation: {
              where: {
                languageCode: {
                  equals: 'en', // Default to English, will be overridden below
                }
              }
            }
          }
        }
      },
    });

    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    // Override the company translation language to match the offer language
    const fullOffer = await prisma.document.findFirst({
      where: {
        id,
        companyId,
        type: 'OFFER',
      },
      include: {
        customer: true,
        lineItems: true,
        template: true,
        company: {
          include: {
            companyTranslation: {
              where: {
                languageCode: offer.languageCode
              }
            }
          }
        }
      },
    });

    if (!fullOffer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    // Generate the PDF
    const pdfBuffer = await generatePDF(fullOffer);

    // Store the PDF URL for local storage (could be a file system or database)
    let pdfUrl = `/api/offers/${id}/pdf`; // Default URL for local access
    
    try {
      // Try to upload to Google Drive if integration is enabled
      const driveResult = await uploadDocumentToDrive(req, id as string, pdfBuffer, 'offer');
      
      // If successfully uploaded to Google Drive, use the Drive link
      if (driveResult) {
        pdfUrl = driveResult.link;
      }
    } catch (driveError) {
      // Log the error but don't fail the entire operation
      console.error('Error uploading to Google Drive:', driveError);
      // Continue with local PDF storage
    }

    // Update the offer with the PDF URL (either Google Drive or local)
    const updatedOffer = await prisma.document.update({
      where: { id },
      data: {
        pdfUrl,
      },
    });

    return res.status(200).json({
      message: 'PDF generated successfully',
      pdfUrl: updatedOffer.pdfUrl,
      pdfGoogleDriveId: updatedOffer.pdfGoogleDriveId,
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
