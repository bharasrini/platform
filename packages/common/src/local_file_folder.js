const fs = require("fs/promises");
const path = require("path");
const { statusMessage } = require("./logs");

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////// FUNCTIONS ////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/* 
Function: localFileHasExtension
Purpose: Checks if the provided file name has the expected extension
Inputs: file name, expected extension
Output: true if the file has the expected extension, false otherwise
*/
function localFileHasExtension(fileName, expectedExt)
{
    // Get the function name for logging
    const _fn = localFileHasExtension.name;

    const actualExt = path.extname(fileName).toLowerCase();
    return actualExt === expectedExt.toLowerCase();
}


/* 
Function: createLocalFolder
Purpose: Creates a folder at the specified path
Inputs: full folder path
Output: 0 if the folder is created successfully, error message otherwise
*/
async function createLocalFolder(full_folder_path)
{
    // Get the function name for logging
    const _fn = createLocalFolder.name;

    const output_dir = full_folder_path;
    
    try
    {
        await fs.mkdir(output_dir, { recursive: true });        
    }
    catch (e)
    {
        statusMessage(_fn, "Failed to create folder: " , output_dir , ". Error: " , e.message);
    }

    return 0;
}


/* 
Function: createLocalFile
Purpose: Creates a file at the specified path
Inputs: output directory, file name, file extension, file content
Output: 0 if the file is created successfully, error message otherwise
*/
async function createLocalFile(output_dir, file_name, file_ext, file_content)
{
    // Get the function name for logging
    const _fn = createLocalFile.name;
    
    const has_ext = localFileHasExtension(file_name, "." + file_ext);
    const file_name_with_ext = (has_ext == false) ? file_name + "." + file_ext : file_name;
    const full_file_name = path.join(output_dir, file_name_with_ext);
    
    try
    {
        await fs.writeFile(full_file_name, file_content);
    }
    catch (e)
    {
        statusMessage(_fn, "Failed to write file: " , full_file_name , ". Error: " , e.message);
    }

    return 0;
}


/* 
Function: getContentType
Purpose: Gets the MIME type of a file based on its extension
Inputs: full file path
Output: The MIME type if recognized, 'application/octet-stream' otherwise
*/
async function getLocalFileContentType(full_file_path)
{
    const ext = path.extname(full_file_path).toLowerCase();

    const mime_map = 
    {
        ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ".pdf": "application/pdf",
        ".csv": "text/csv",
        ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ".txt": "text/plain",
        ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png"
    };

    return mime_map[ext] || 'application/octet-stream';
}

/* 
Function: readFromFile
Purpose: Reads the content of a file at the specified path
Inputs: full file path
Output: The file content if read successfully, null otherwise
*/
async function readFromLocalFile(full_file_path)
{
    // Get the function name for logging
    const _fn = readFromLocalFile.name;

    try
    {
        const data = await fs.readFile(full_file_path);
        return data;
    }
    catch (e)
    {
        statusMessage(_fn, "Failed to read file: " , full_file_path , ". Error: " , e.message);
        return null;
    }
}


/* 
Function: getLocalFileAsAttachment
Purpose: Gets the content of a local file as an attachment
Inputs: full file path
Output: The file content if read successfully, null otherwise
*/
async function getLocalFileAsAttachment(full_file_path)
{
    // Get the function name for logging
    const _fn = getLocalFileAsAttachment.name;

    // Read the file content
    const content = await readFromLocalFile(full_file_path);
    if(content === null)
    {
        statusMessage(_fn, "Failed to get content for file: " , full_file_path);
        return null;
    }

    // Get the content type and file name for the attachment
    const content_type = await getLocalFileContentType(full_file_path);
    const file_name = path.basename(full_file_path);

    // Construct the attachment object
    const attachment =
    {
        filename: file_name,
        content: Buffer.from(content),
        contentType: content_type,
    }

    return attachment;
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////// EXPORTS /////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// Exporting the functions
module.exports = 
{ 
    localFileHasExtension,
    createLocalFolder,
    createLocalFile,
    getLocalFileContentType,
    readFromLocalFile,
    getLocalFileAsAttachment
};
