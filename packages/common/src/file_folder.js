const fs = require("fs/promises");
const path = require("path");
const { statusMessage } = require("./logs");

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////// FUNCTIONS ////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/* 
Function: hasExtension
Purpose: Checks if the provided file name has the expected extension
Inputs: file name, expected extension
Output: true if the file has the expected extension, false otherwise
*/
function hasExtension(fileName, expectedExt)
{
    // Get the function name for logging
    const fn = hasExtension.name;

    const actualExt = path.extname(fileName).toLowerCase();
    return actualExt === expectedExt.toLowerCase();
}


/* 
Function: createFolder
Purpose: Creates a folder at the specified path
Inputs: full folder path
Output: 0 if the folder is created successfully, error message otherwise
*/
async function createFolder(full_folder_path)
{
    // Get the function name for logging
    const fn = createFolder.name;

    const output_dir = full_folder_path;
    
    try
    {
        await fs.mkdir(output_dir, { recursive: true });        
    }
    catch (e)
    {
        statusMessage(fn, "Failed to create folder: " , output_dir , ". Error: " , e.message);
    }

    return 0;
}


/* 
Function: createFile
Purpose: Creates a file at the specified path
Inputs: output directory, file name, file extension, file content
Output: 0 if the file is created successfully, error message otherwise
*/
async function createFile(output_dir, file_name, file_ext, file_content)
{
    // Get the function name for logging
    const fn = createFile.name;
    
    const has_ext = hasExtension(file_name, "." + file_ext);
    const file_name_with_ext = (has_ext == false) ? file_name + "." + file_ext : file_name;
    const full_file_name = path.join(output_dir, file_name_with_ext);
    
    try
    {
        await fs.writeFile(full_file_name, file_content);
    }
    catch (e)
    {
        statusMessage(fn, "Failed to write file: " , full_file_name , ". Error: " , e.message);
    }

    return 0;
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////// EXPORTS /////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// Exporting the functions
module.exports = 
{ 
    hasExtension,
    createFolder,
    createFile,
};
