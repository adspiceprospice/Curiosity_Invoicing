import { google } from 'googleapis';
import { getToken } from 'next-auth/jwt';
import { NextApiRequest } from 'next';

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
 * Upload a file to Google Drive
 */
export async function uploadFileToDrive(
  req: NextApiRequest,
  fileName: string,
  fileContent: Buffer,
  fileType: string,
  folderId?: string
) {
  const drive = await getDriveClient(req);
  
  try {
    // Look for the application folder
    let appFolderId = folderId;
    
    if (!appFolderId) {
      // Create a base folder for the application if it doesn't exist
      const folderResponse = await drive.files.list({
        q: "mimeType='application/vnd.google-apps.folder' and name='Curiosity_Invoicing'",
        fields: 'files(id)',
      });
      
      if (folderResponse.data.files && folderResponse.data.files.length > 0) {
        appFolderId = folderResponse.data.files[0].id;
      } else {
        // Create the folder
        const folderMetadata = {
          name: 'Curiosity_Invoicing',
          mimeType: 'application/vnd.google-apps.folder',
        };
        
        const folder = await drive.files.create({
          requestBody: folderMetadata,
          fields: 'id',
        });
        
        appFolderId = folder.data.id;
      }
    }
    
    // Upload the file
    const fileMetadata = {
      name: fileName,
      parents: appFolderId ? [appFolderId] : undefined,
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
 * Create a folder structure for invoices and offers
 */
export async function createOrGetFolderStructure(
  req: NextApiRequest,
  documentType: 'invoice' | 'offer',
  languageCode: string,
  year: number
) {
  const drive = await getDriveClient(req);
  
  try {
    // Look for the application folder
    let appFolderId;
    
    const appFolderResponse = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.folder' and name='Curiosity_Invoicing'",
      fields: 'files(id)',
    });
    
    if (appFolderResponse.data.files && appFolderResponse.data.files.length > 0) {
      appFolderId = appFolderResponse.data.files[0].id;
    } else {
      // Create the app folder
      const appFolderMetadata = {
        name: 'Curiosity_Invoicing',
        mimeType: 'application/vnd.google-apps.folder',
      };
      
      const appFolder = await drive.files.create({
        requestBody: appFolderMetadata,
        fields: 'id',
      });
      
      appFolderId = appFolder.data.id;
    }
    
    // Create/get the document type folder (Invoices or Offers)
    const documentTypeFolderName = documentType === 'invoice' ? 'Invoices' : 'Offers';
    let documentTypeFolderId;
    
    const documentTypeFolderResponse = await drive.files.list({
      q: `mimeType='application/vnd.google-apps.folder' and name='${documentTypeFolderName}' and '${appFolderId}' in parents`,
      fields: 'files(id)',
    });
    
    if (documentTypeFolderResponse.data.files && documentTypeFolderResponse.data.files.length > 0) {
      documentTypeFolderId = documentTypeFolderResponse.data.files[0].id;
    } else {
      // Create the document type folder
      const documentTypeFolderMetadata = {
        name: documentTypeFolderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [appFolderId],
      };
      
      const documentTypeFolder = await drive.files.create({
        requestBody: documentTypeFolderMetadata,
        fields: 'id',
      });
      
      documentTypeFolderId = documentTypeFolder.data.id;
    }
    
    // Create/get the year folder
    let yearFolderId;
    
    const yearFolderResponse = await drive.files.list({
      q: `mimeType='application/vnd.google-apps.folder' and name='${year}' and '${documentTypeFolderId}' in parents`,
      fields: 'files(id)',
    });
    
    if (yearFolderResponse.data.files && yearFolderResponse.data.files.length > 0) {
      yearFolderId = yearFolderResponse.data.files[0].id;
    } else {
      // Create the year folder
      const yearFolderMetadata = {
        name: `${year}`,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [documentTypeFolderId],
      };
      
      const yearFolder = await drive.files.create({
        requestBody: yearFolderMetadata,
        fields: 'id',
      });
      
      yearFolderId = yearFolder.data.id;
    }
    
    // Create/get the language folder
    let languageFolderId;
    
    const languageFolderResponse = await drive.files.list({
      q: `mimeType='application/vnd.google-apps.folder' and name='${languageCode.toUpperCase()}' and '${yearFolderId}' in parents`,
      fields: 'files(id)',
    });
    
    if (languageFolderResponse.data.files && languageFolderResponse.data.files.length > 0) {
      languageFolderId = languageFolderResponse.data.files[0].id;
    } else {
      // Create the language folder
      const languageFolderMetadata = {
        name: languageCode.toUpperCase(),
        mimeType: 'application/vnd.google-apps.folder',
        parents: [yearFolderId],
      };
      
      const languageFolder = await drive.files.create({
        requestBody: languageFolderMetadata,
        fields: 'id',
      });
      
      languageFolderId = languageFolder.data.id;
    }
    
    return languageFolderId;
  } catch (error) {
    console.error('Error creating folder structure in Google Drive:', error);
    throw new Error('Failed to create folder structure in Google Drive');
  }
}