import { google } from 'googleapis';
import { getToken } from 'next-auth/jwt';
import { NextApiRequest } from 'next';
import { prisma } from './prisma';
import { format } from 'date-fns';

/**
 * Create a Google Drive API client with a user's credentials
 */
export async function getDriveClient(req: NextApiRequest) {
  const token = await getToken({ req });
  
  if (!token || !token.accessToken) {
    throw new Error('No access token found');
  }
  
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  
  oauth2Client.setCredentials({
    access_token: token.accessToken as string,
    refresh_token: token.refreshToken as string,
  });
  
  return google.drive({ version: 'v3', auth: oauth2Client });
}

/**
 * Check if Google Drive integration is enabled
 */
export async function isGoogleDriveEnabled() {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: 'google-drive.enabled' },
    });
    
    return setting?.value === 'true';
  } catch (error) {
    console.error('Error checking if Google Drive is enabled:', error);
    return false;
  }
}

/**
 * Get Google Drive integration settings
 */
export async function getGoogleDriveSettings() {
  try {
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: [
            'google-drive.enabled',
            'google-drive.baseFolderName',
            'google-drive.useTemplateLanguageFolders',
            'google-drive.fileNamingPattern',
          ],
        },
      },
    });
    
    const settingsObj: Record<string, string> = {};
    settings.forEach(setting => {
      const key = setting.key.replace('google-drive.', '');
      settingsObj[key] = setting.value;
    });
    
    return {
      enabled: settingsObj.enabled === 'true',
      baseFolderName: settingsObj.baseFolderName || 'Curiosity_Invoicing',
      useTemplateLanguageFolders: settingsObj.useTemplateLanguageFolders === 'true',
      fileNamingPattern: settingsObj.fileNamingPattern || '{type}_{number}_{date}_{customer}',
    };
  } catch (error) {
    console.error('Error getting Google Drive settings:', error);
    return {
      enabled: false,
      baseFolderName: 'Curiosity_Invoicing',
      useTemplateLanguageFolders: true,
      fileNamingPattern: '{type}_{number}_{date}_{customer}',
    };
  }
}

/**
 * Upload a file to Google Drive with the configured settings
 */
export async function uploadFileToDrive(
  req: NextApiRequest,
  fileName: string,
  fileContent: Buffer,
  fileType: string,
  documentType: 'invoice' | 'offer',
  documentNumber: string,
  customerName: string,
  languageCode: string,
  folderId?: string
) {
  // Check if Google Drive integration is enabled
  const isEnabled = await isGoogleDriveEnabled();
  if (!isEnabled) {
    throw new Error('Google Drive integration is not enabled');
  }
  
  const settings = await getGoogleDriveSettings();
  const drive = await getDriveClient(req);
  
  try {
    // Create or get folder structure based on settings
    const uploadFolderId = await getUploadFolder(
      drive, 
      settings.baseFolderName,
      documentType,
      languageCode,
      settings.useTemplateLanguageFolders
    );
    
    // Format the file name based on the pattern from settings
    const formattedFileName = formatFileName(
      settings.fileNamingPattern,
      documentType,
      documentNumber,
      customerName
    );
    
    // Add extension to the file name if not already present
    const finalFileName = formattedFileName.endsWith('.pdf') ? formattedFileName : `${formattedFileName}.pdf`;
    
    // Upload the file
    const fileMetadata = {
      name: finalFileName,
      parents: [uploadFolderId],
    };
    
    const media = {
      mimeType: fileType,
      body: fileContent,
    };
    
    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id,webViewLink',
    });
    
    return {
      id: response.data.id,
      link: response.data.webViewLink,
    };
  } catch (error) {
    console.error('Error uploading file to Google Drive:', error);
    throw new Error('Failed to upload file to Google Drive');
  }
}

/**
 * Create or get folder structure for document upload
 */
async function getUploadFolder(
  drive: any,
  baseFolderName: string,
  documentType: 'invoice' | 'offer',
  languageCode: string,
  useLanguageFolders: boolean
) {
  // Create or get base folder
  let baseFolderId = await createOrGetFolder(drive, baseFolderName);
  
  // Create or get document type folder
  const documentTypeFolderName = documentType === 'invoice' ? 'Invoices' : 'Offers';
  let documentTypeFolderId = await createOrGetFolder(drive, documentTypeFolderName, baseFolderId);
  
  // Create or get year folder (always organize by year)
  const currentYear = new Date().getFullYear();
  let yearFolderId = await createOrGetFolder(drive, currentYear.toString(), documentTypeFolderId);
  
  // Create or get language folder if enabled
  if (useLanguageFolders) {
    return await createOrGetFolder(drive, languageCode.toUpperCase(), yearFolderId);
  }
  
  return yearFolderId;
}

/**
 * Create or get a folder in Google Drive
 */
async function createOrGetFolder(drive: any, folderName: string, parentId?: string) {
  let query = `mimeType='application/vnd.google-apps.folder' and name='${folderName}'`;
  
  if (parentId) {
    query += ` and '${parentId}' in parents`;
  }
  
  const folderResponse = await drive.files.list({
    q: query,
    fields: 'files(id)',
  });
  
  if (folderResponse.data.files && folderResponse.data.files.length > 0) {
    return folderResponse.data.files[0].id;
  }
  
  // Create the folder
  const folderMetadata = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
    parents: parentId ? [parentId] : undefined,
  };
  
  const folder = await drive.files.create({
    requestBody: folderMetadata,
    fields: 'id',
  });
  
  return folder.data.id;
}

/**
 * Format file name based on pattern
 */
function formatFileName(
  pattern: string,
  documentType: 'invoice' | 'offer',
  documentNumber: string,
  customerName: string
) {
  const date = format(new Date(), 'yyyy-MM-dd');
  const type = documentType === 'invoice' ? 'Invoice' : 'Offer';
  const sanitizedCustomerName = customerName.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_');
  
  return pattern
    .replace('{type}', type)
    .replace('{number}', documentNumber)
    .replace('{date}', date)
    .replace('{customer}', sanitizedCustomerName);
}

/**
 * Create a folder structure for invoices and offers (legacy function for backward compatibility)
 */
export async function createOrGetFolderStructure(
  req: NextApiRequest,
  documentType: 'invoice' | 'offer',
  languageCode: string,
  year: number
) {
  const drive = await getDriveClient(req);
  const settings = await getGoogleDriveSettings();
  
  try {
    // Look for the application folder
    let appFolderId = await createOrGetFolder(drive, settings.baseFolderName);
    
    // Create/get the document type folder (Invoices or Offers)
    const documentTypeFolderName = documentType === 'invoice' ? 'Invoices' : 'Offers';
    let documentTypeFolderId = await createOrGetFolder(drive, documentTypeFolderName, appFolderId);
    
    // Create/get the year folder
    let yearFolderId = await createOrGetFolder(drive, year.toString(), documentTypeFolderId);
    
    // Create/get the language folder if enabled
    if (settings.useTemplateLanguageFolders) {
      return await createOrGetFolder(drive, languageCode.toUpperCase(), yearFolderId);
    }
    
    return yearFolderId;
  } catch (error) {
    console.error('Error creating folder structure in Google Drive:', error);
    throw new Error('Failed to create folder structure in Google Drive');
  }
}

/**
 * Update a file in Google Drive
 */
export async function updateFileInDrive(
  req: NextApiRequest,
  fileId: string,
  fileContent: Buffer,
  fileType: string
) {
  // Check if Google Drive integration is enabled
  const isEnabled = await isGoogleDriveEnabled();
  if (!isEnabled) {
    throw new Error('Google Drive integration is not enabled');
  }
  
  const drive = await getDriveClient(req);
  
  try {
    // Update the file
    const media = {
      mimeType: fileType,
      body: fileContent,
    };
    
    const response = await drive.files.update({
      fileId: fileId,
      media: media,
      fields: 'id,webViewLink',
    });
    
    return {
      id: response.data.id,
      link: response.data.webViewLink,
    };
  } catch (error) {
    console.error('Error updating file in Google Drive:', error);
    throw new Error('Failed to update file in Google Drive');
  }
}

/**
 * Delete a file from Google Drive
 */
export async function deleteFileFromDrive(
  req: NextApiRequest,
  fileId: string
) {
  // Check if Google Drive integration is enabled
  const isEnabled = await isGoogleDriveEnabled();
  if (!isEnabled) {
    throw new Error('Google Drive integration is not enabled');
  }
  
  const drive = await getDriveClient(req);
  
  try {
    // Delete the file
    await drive.files.delete({
      fileId: fileId,
    });
    
    return true;
  } catch (error) {
    console.error('Error deleting file from Google Drive:', error);
    throw new Error('Failed to delete file from Google Drive');
  }
}

/**
 * Share a file with specific users
 */
export async function shareFileWithUsers(
  req: NextApiRequest,
  fileId: string,
  emailAddresses: string[],
  role: 'reader' | 'commenter' | 'writer' = 'reader'
) {
  // Check if Google Drive integration is enabled
  const isEnabled = await isGoogleDriveEnabled();
  if (!isEnabled) {
    throw new Error('Google Drive integration is not enabled');
  }
  
  const drive = await getDriveClient(req);
  
  try {
    // Create permissions for each email
    const permissionPromises = emailAddresses.map(email => 
      drive.permissions.create({
        fileId: fileId,
        requestBody: {
          type: 'user',
          role: role,
          emailAddress: email,
        },
      })
    );
    
    await Promise.all(permissionPromises);
    return true;
  } catch (error) {
    console.error('Error sharing file in Google Drive:', error);
    throw new Error('Failed to share file in Google Drive');
  }
}
