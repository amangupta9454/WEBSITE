const { google } = require('googleapis');
const { Readable } = require('stream');

/**
 * Initializes the Google Drive API client using environment variables.
 */
const getDriveService = () => {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!clientEmail || !privateKey) {
    throw new Error('Google Drive credentials (GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_PRIVATE_KEY) are missing.');
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey
    },
    scopes: ['https://www.googleapis.com/auth/drive.file']
  });

  return google.drive({ version: 'v3', auth });
};

/**
 * Uploads a PDF buffer to a specific Google Drive folder.
 * @param {Buffer} pdfBuffer - The PDF file as a buffer
 * @param {string} fileName - The desired name of the file
 * @returns {Promise<string>} The shareable webViewLink of the uploaded file
 */
const uploadPdfToDrive = async (pdfBuffer, fileName) => {
  try {
    const driveService = getDriveService();
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    if (!folderId) {
      throw new Error('GOOGLE_DRIVE_FOLDER_ID environment variable is missing.');
    }

    const fileMetadata = {
      name: fileName,
      parents: [folderId]
    };

    // Convert Buffer to a Readable Stream for the Drive API
    const media = {
      mimeType: 'application/pdf',
      body: Readable.from(pdfBuffer)
    };

    console.log(`Uploading ${fileName} to Google Drive...`);
    const file = await driveService.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id, webViewLink'
    });

    console.log(`Successfully uploaded ${fileName} to Drive. File ID: ${file.data.id}`);
    
    // Set permissions to "anyone with the link can view"
    await driveService.permissions.create({
      fileId: file.data.id,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    return file.data.webViewLink;
  } catch (error) {
    console.error('Error uploading file to Google Drive:', error);
    throw error;
  }
};

module.exports = {
  uploadPdfToDrive
};
