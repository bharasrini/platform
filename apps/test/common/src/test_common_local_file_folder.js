const path = require("path");
const common = require("@fyle-ops/common");

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function test_localFileHasExtension()
{
    // Get the function name for logging
    const _fn = test_localFileHasExtension.name;

    common.start_test(_fn);
    
    const file_name = "test_file.csv";
    const ext = "csv";
    const has_ext = common.localFileHasExtension(file_name, "." + ext);
    common.statusMessage(_fn, "Set 1: File name: ", file_name, ", Extension: ", ext, ", Has extension: ", has_ext);

    const file_name_2 = "test_file";
    const ext_2 = "csv";
    const has_ext_2 = common.localFileHasExtension(file_name_2, "." + ext_2);
    common.statusMessage(_fn, "Set 2: File name: ", file_name_2, ", Extension: ", ext_2, ", Has extension: ", has_ext_2);

    common.end_test(_fn);
}


async function test_createLocalFolder()
{
    // Get the function name for logging
    const _fn = test_createLocalFolder.name;

    common.start_test(_fn);

    const base_path = process.cwd();
    const output_dir = path.join(base_path, process.env.DOWNLOADS_FOLDER);
    const folder_path = path.join(output_dir, "test_folder");
    const result = await common.createLocalFolder(folder_path);
    common.statusMessage(_fn, "Create folder result: ", result);

    common.end_test(_fn);
}


async function test_createLocalFile()
{
    // Get the function name for logging
    const _fn = test_createLocalFile.name;

    common.start_test(_fn);

    const base_path = process.cwd();
    const output_dir = path.join(base_path, process.env.DOWNLOADS_FOLDER);
    const folder_path = path.join(output_dir, "test_folder");
    await common.createLocalFolder(folder_path);

    const data_obj = Buffer.from("Test file content");
    let file_name = "test_file.txt";
    await common.createLocalFile(folder_path, file_name, "txt", data_obj);
    common.statusMessage(_fn, "Wrote data to file: ", file_name);

    const image_data  = require("../data/image.json");
    const rocketBmp = Buffer.from(image_data.base64, "base64");
    file_name = "rocket.bmp";
    await common.createLocalFile(folder_path, file_name, "bmp", rocketBmp);
    common.statusMessage(_fn, "Wrote data to file: ", file_name);

    common.end_test(_fn);
}


async function test_getLocalFileContentType()
{
    // Get the function name for logging
    const _fn = test_getLocalFileContentType.name;

    common.start_test(_fn);

    const full_file_path = "C:\\Users\\Bharadwaj\\Downloads\\CS Offsite.xlsx";
    const content_type = await common.getLocalFileContentType(full_file_path);

    common.statusMessage(_fn, "Content type for file ", full_file_path, ": ", content_type);

    common.end_test(_fn);
}


async function test_readFromLocalFile()
{
    // Get the function name for logging
    const _fn = test_readFromLocalFile.name;

    common.start_test(_fn);

    const full_file_path = "C:\\Users\\Bharadwaj\\Downloads\\CS Offsite.xlsx";
    const content = await common.readFromLocalFile(full_file_path);

    common.statusMessage(_fn, "Content length for file ", full_file_path, ": ", content?.length);

    common.end_test(_fn);
}

async function test_getLocalFileAsAttachment()
{
    // Get the function name for logging
    const _fn = test_getLocalFileAsAttachment.name;

    common.start_test(_fn);

    const full_file_path = "C:\\Users\\Bharadwaj\\Downloads\\CS Offsite.xlsx";
    const attachment = await common.getLocalFileAsAttachment(full_file_path);

    if(attachment)
    {
        common.statusMessage(_fn, "Fetched attachment for file ", full_file_path, ": ", attachment.file_name, ", content type: ", attachment.content_type, ", content length: ", attachment.content.length);
    }
    else
    {
        common.statusMessage(_fn, "Failed to fetch attachment for file ", full_file_path);
    }

    common.end_test(_fn);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function test_common_local_file_folder()
{
    // Get the function name for logging
    const _fn = test_common_local_file_folder.name;

    common.start_test_suite("File and Folder functions");
    
    // File and Folder functions
    if(process.env.RUN_TEST_COMMON_LOCAL_FILE_HAS_EXTENSION === "true") await test_localFileHasExtension();
    if(process.env.RUN_TEST_COMMON_CREATE_LOCAL_FOLDER === "true") await test_createLocalFolder();
    if(process.env.RUN_TEST_COMMON_CREATE_LOCAL_FILE === "true") await test_createLocalFile();
    if(process.env.RUN_TEST_COMMON_GET_LOCAL_FILE_CONTENT_TYPE === "true") await test_getLocalFileContentType();
    if(process.env.RUN_TEST_COMMON_READ_FROM_LOCAL_FILE === "true") await test_readFromLocalFile();
    if(process.env.RUN_TEST_COMMON_GET_LOCAL_FILE_AS_ATTACHMENT === "true") await test_getLocalFileAsAttachment();

    common.end_test_suite("File and Folder functions");
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports =
{
    test_common_local_file_folder
}