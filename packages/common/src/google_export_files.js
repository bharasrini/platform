const { google } = require('googleapis');
const path = require('path');
const { createGoogleAuth } = require("./google_auth");
const { statusMessage } = require("./logs");



/*
Function: getExportConfig
Purpose: Retrieves the export configuration for a given MIME type and preferred format.
Inputs: MIME type of the Google file, optional preferred format
Output: Export configuration on success, null otherwise
*/
function getExportConfig(mime_type, preferred_format = null)
{
    // Get the function name for logging purposes
    const _fn = getExportConfig.name;

    // Get the list of export configurations for Google file types from the JSON file
    const GOOGLE_EXPORT_OPTIONS = require("../data/google_export_options.json");

    // Check if the mime_type is in the export options
    const options = GOOGLE_EXPORT_OPTIONS[mime_type];  
    if (!options)
    {
        statusMessage(_fn, `No export options found for mime type: ${mime_type}`);
        return null;
    }

    // If a preferred format is provided, check if it's available
    if (preferred_format && options[preferred_format])
    {
        return options[preferred_format];
    }

    // Default export format per Google file type
    if (mime_type === 'application/vnd.google-apps.spreadsheet')
    {
        return options.xlsx;
    }

    if (mime_type === 'application/vnd.google-apps.document')
    {
        return options.pdf;
    }

    if (mime_type === 'application/vnd.google-apps.presentation')
    {
        return options.pdf;
    }

    if (mime_type === 'application/vnd.google-apps.drawing')
    {
        return options.png;
    }

    // If we are here, its an unsupported type
    statusMessage(_fn, `No default export format configured for mime type: ${mime_type}`);
    return null;
}



/*
Function: replaceExtension
Purpose: Replaces the file extension of a given file name with a new extension.
Inputs: file_name - the original file name, extension - the new extension
Output: The file name with the new extension
*/
function replaceExtension(file_name, extension)
{
    // Get the function name for logging purposes
    const _fn = replaceExtension.name;

    const parsed = path.parse(file_name);
    return `${parsed.name}${extension}`;
}



/*
Function: getDriveFileAsAttachment
Purpose: Retrieves a Google Drive file as an attachment.
Inputs: file_id - the ID of the Google Drive file
Output: An object containing the file's name, content, and content type
*/
async function getDriveFileAsAttachment(file_id, preferred_format = null)
{
    // Get the function name for logging purposes
    const _fn = getDriveFileAsAttachment.name;

    // Get authentication and drive instance
    const auth = createGoogleAuth();
    const drive = google.drive({ version: 'v3', auth });

    let res = null;

    try
    {
        res = await drive.files.get(
        {
            fileId: file_id,
            fields: 'id,name,mimeType',
            supportsAllDrives: true,
        });
    }
    catch(e)
    {
        statusMessage(_fn, `Error fetching file metadata for fileId ${file_id}: `, e);
        return null;
    }

    // Get the file name and MIME type from the response
    const { name: name, mimeType: mime_type } = res.data;

    const export_config = getExportConfig(mime_type, preferred_format);

    // Check if this is a Google-native file that needs to be exported
    if(export_config)
    {
        let file_res = null;

        // Parameters and options for the export call
        const parameters =
        {
            fileId: file_id,
            mimeType: export_config.mime_type,
        };

        const options = 
        {
            responseType: 'arraybuffer',
        };

        // Export the file from Google Drive
        try
        {
            file_res = await drive.files.export(
                parameters,
                options
            );
        }
        catch(e)
        {
            statusMessage(_fn, `Error exporting file with fileId ${file_id} as ${export_config.mime_type}: `, e);
            return null;
        }

        // Construct the attachment object to be returned
        const ret_attachment = 
        {
            filename: replaceExtension(name, export_config.extension),
            content: Buffer.from(file_res.data),
            contentType: export_config.mime_type,
         };
        return ret_attachment;
    }
    // This non-Google-native file, we can fetch the content directly without exporting
    else
    {
        let file_res = null;

        // Parameters and options for the get call
        const parameters =
        {
            fileId: file_id,
            alt: 'media',
            supportsAllDrives: true,
        };

        const options = 
        {
            responseType: 'arraybuffer',
        };

        try
        {
            file_res = await drive.files.get(
                parameters,
                options
            );
        }
        catch(e)
        {
            statusMessage(_fn, `Error fetching file content for fileId ${file_id}: `, e);
            return null;
        }

        // Construct the attachment object to be returned
        const ret_attachment = 
        {
            filename: name,
            content: Buffer.from(file_res.data),
            contentType: mime_type,
        };
        
        return ret_attachment;
    }
}


/*
Function: getDriveFilesAsAttachments
Purpose: Retrieves a set of Google Drive files as attachments.
Inputs: file_list - an array of objects containing the file IDs and preferred formats
Output: An array of objects, each containing a file's name, content, and content type
*/
async function getDriveFilesAsAttachments(file_list)
{
    // Get the function name for logging purposes
    const _fn = getDriveFilesAsAttachments.name;

    // List of attachments to be returned
    const attachments = [];

    // Loop through the list of files and fetch each one as an attachment
    for (const file of file_list)
    {
        const this_attachment = await getDriveFileAsAttachment(file.file_id, file.preferred_format);
        attachments.push(this_attachment);
    }

    return attachments;
}



/*
Function: getExtensionFromMimeType
Purpose: Retrieves the file extension for a given MIME type.
Inputs: mime_type - the MIME type of the file
Output: The corresponding file extension, or an empty string if not found
*/
function getExtensionFromMimeType(mime_type)
{
    const MIME_TO_EXTENSION = 
    {
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
        'application/pdf': '.pdf',
        'text/csv': '.csv',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
        'text/plain': '.txt',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
        'application/vnd.google-apps.spreadsheet': '.xlsx',
        'application/vnd.google-apps.document': '.docx',
        'application/vnd.google-apps.presentation': '.pptx',
        'application/vnd.google-apps.drawing': '.png',
        'image/jpeg': '.jpg',
        'image/png': '.png',
    };

    return MIME_TO_EXTENSION[mime_type] || "";
}



module.exports =
{
    getDriveFileAsAttachment,
    getDriveFilesAsAttachments,
    getExtensionFromMimeType,
};