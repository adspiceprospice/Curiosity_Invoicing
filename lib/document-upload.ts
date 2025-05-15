import { NextApiRequest } from 'next';
import { uploadFileToDrive, updateFileInDrive, isGoogleDriveEnabled } from './google-drive';
import { prisma } from './prisma';

/**
 * Upload a document PDF to Google Drive
 */
export async function uploadDocumentToDrive(
  req: NextApiRequest,
  documentId: string,
  pdfBuffer: Buffer,
  documentType: 'invoice' | 'offer'
) {
  try {
    // Check if Google Drive integration is enabled
    const isEnabled = await isGoogleDriveEnabled();
    if (!isEnabled) {
      console.log('Google Drive integration is not enabled. Skipping upload.');
      return null;
    }

    // Fetch the document with customer details
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: { customer: true },
    });

    if (!document) {
      throw new Error(`Document with ID ${documentId} not found`);
    }

    // Check if the document already has a Google Drive ID
    if (document.pdfGoogleDriveId) {
      // Update the existing file
      const result = await updateFileInDrive(
        req,
        document.pdfGoogleDriveId,
        pdfBuffer,
        'application/pdf'
      );

      // Update the document with the latest Google Drive link
      await prisma.document.update({
        where: { id: documentId },
        data: {
          pdfUrl: result.link,
        },
      });

      return result;
    } else {
      // Upload as a new file
      const result = await uploadFileToDrive(
        req,
        `${documentType === 'invoice' ? 'Invoice' : 'Offer'} ${document.documentNumber}.pdf`,
        pdfBuffer,
        'application/pdf',
        documentType,
        document.documentNumber,
        document.customer.companyName,
        document.languageCode
      );

      // Update the document with the Google Drive ID and link
      await prisma.document.update({
        where: { id: documentId },
        data: {
          pdfGoogleDriveId: result.id,
          pdfUrl: result.link,
        },
      });

      return result;
    }
  } catch (error) {
    console.error('Error uploading document to Google Drive:', error);
    throw error;
  }
}
