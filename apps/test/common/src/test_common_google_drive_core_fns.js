const { google } = require('googleapis');
const common = require("@fyle-ops/common");

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function test_common_google_drive_core_fns_get_folder()
{
    // Get the function name for logging
    const fn = test_common_google_drive_core_fns_get_folder.name;

    common.start_test(fn);

    // Get authentication and drive instance
    const auth = common.createGoogleAuth();
    const drive = google.drive({ version: 'v3', auth });

    const folder_id = "1RQWnc1dSkRnUDxkO4Tm_tjBjyyL1qpr-";  // "Test Folder" under "Customer Success Shared Drive"
    const res = await common.GoogleDrive_getFolder(drive, folder_id);
    if(res) common.statusMessage(fn, "Get folder result - ID: ", res.data.id, " Name: ", res.data.name);
    else common.statusMessage(fn, "Get folder result - No folder found");

    common.end_test(fn);
}

async function test_common_google_drive_core_fns_get_files_in_folder()
{
    // Get the function name for logging
    const fn = test_common_google_drive_core_fns_get_files_in_folder.name;

    common.start_test(fn);

    // Get authentication and drive instance
    const auth = common.createGoogleAuth();
    const drive = google.drive({ version: 'v3', auth });

    const folder_id = "1RQWnc1dSkRnUDxkO4Tm_tjBjyyL1qpr-";  // "Test Folder" under "Customer Success Shared Drive"

    // Test with a file name that exists in the folder
    const res = await common.GoogleDrive_getFilesInFolder(drive, folder_id, "Test Spreadsheet");
    if(res && res.data.files.length > 0) common.statusMessage(fn, "[1]. Get files in folder result - ID: ", res.data.files[0].id, " Name: ", res.data.files[0].name);
    else common.statusMessage(fn, "[1]. Get files in folder result - No file found");

    // Test with a file name that doesn't exist in the folder
    const res2 = await common.GoogleDrive_getFilesInFolder(drive, folder_id, "Non Existent File Name");
    if(res2 && res2.data.files.length > 0) common.statusMessage(fn, "[2]. Get files in folder result - ID: ", res2.data.files[0].id, " Name: ", res2.data.files[0].name);
    else common.statusMessage(fn, "[2]. Get files in folder result - No file found");

    common.end_test(fn);
}

async function test_common_google_drive_core_fns_get_folder_in_folder()
{
    // Get the function name for logging
    const fn = test_common_google_drive_core_fns_get_folder_in_folder.name;

    common.start_test(fn);

    // Get authentication and drive instance
    const auth = common.createGoogleAuth();
    const drive = google.drive({ version: 'v3', auth });

    const folder_id = "1RQWnc1dSkRnUDxkO4Tm_tjBjyyL1qpr-";  // "Test Folder" under "Customer Success Shared Drive"

    // Test with a folder name that exists in the folder
    const res = await common.GoogleDrive_getFolderInFolder(drive,folder_id, "Check123");
    if(res) common.statusMessage(fn, "[1]. Get folder in folder result - ID: ", res.data.files[0].id, " Name: ", res.data.files[0].name);
    else common.statusMessage(fn, "[1]. Get folder in folder result - No folder found");

    // Test with a folder name that doesn't exist in the folder
    const res2 = await common.GoogleDrive_getFolderInFolder(drive, folder_id, "Non Existent Folder Name");
    if(res2) common.statusMessage(fn, "[2]. Get folder in folder result - ID: ", res2.data.files[0].id, " Name: ", res2.data.files[0].name);
    else common.statusMessage(fn, "[2]. Get folder in folder result - No folder found");

    common.end_test(fn);
}

async function test_common_google_drive_core_fns_copy_file_to_folder()
{
    // Get the function name for logging
    const fn = test_common_google_drive_core_fns_copy_file_to_folder.name;

    common.start_test(fn);

    // Get authentication and drive instance
    const auth = common.createGoogleAuth();
    const drive = google.drive({ version: 'v3', auth });

    const source_file_id = "1IWlRG96NFZhyAfhk-ncUpp4uMIpbCe7f"; // "Copied Test File - XUL Brewing Company" in "Test Folder" under "Customer Success Shared Drive"
    const dest_folder_id = "1RQWnc1dSkRnUDxkO4Tm_tjBjyyL1qpr-";  // "Test Folder" under "Customer Success Shared Drive"
    const file_name_to_use = "Modified Core Test File - XUL Brewing Company.pdf";

    const res = await common.GoogleDrive_copyFileToFolder(drive, source_file_id, dest_folder_id, file_name_to_use);
    if(res && res.data) common.statusMessage(fn, "Copy file to folder result - ID: ", res.data.id, " Name: ", res.data.name, " Parent: ", res.data.parents);
    else common.statusMessage(fn, "Copy file to folder result - No file found");

    common.end_test(fn);
}

async function test_common_google_drive_core_fns_trash_file()
{
    // Get the function name for logging
    const fn = test_common_google_drive_core_fns_trash_file.name;

    common.start_test(fn);

    // Get authentication and drive instance
    const auth = common.createGoogleAuth();
    const drive = google.drive({ version: 'v3', auth });

    const file_id = "1P9bYrK6vkTN-G16udpFTwMRt_n4hUDRdBD4uftnG0lM"; // "Test for Thrashing" in "Test Folder" under "Customer Success Shared Drive"

    const res = await common.GoogleDrive_trashFile(drive, file_id);
    if(res && res.data) common.statusMessage(fn, "Trash file result: ID: ", res.data.id, " Name: ", res.data.name, " Thrashed: ", res.data.trashed);
    else common.statusMessage(fn, "Trash file result - No file found");

    common.end_test(fn);
}


async function test_common_google_drive_core_fns_move_folder()
{
    // Get the function name for logging
    const fn = test_common_google_drive_core_fns_move_folder.name;

    common.start_test(fn);

    // Get authentication and drive instance
    const auth = common.createGoogleAuth();
    const drive = google.drive({ version: 'v3', auth });

    const folder_id = "1I6bUoEQjWmB-Bz3sVg8eokbNOz7mWIFv"; // Folder "Check123" under "Test Folder" in "Customer Success Shared Drive"
    const dest_folder_id = "1uYmEV_I-ZHGM4iDX6etkJGogMGyuBoiH"; // Folder "Test Folder1" under "Customer Success Shared Drive"

     // First get the reference to the folder we want to move to ensure that it exists before we try to move it
    const src_res = await common.GoogleDrive_getFolder(drive, folder_id);
    if(!src_res)
    {
        common.statusMessage(fn, "Error fetching folder with ID ", folder_id);
        return;
    }

    const res = await common.GoogleDrive_moveFolder(drive, folder_id, dest_folder_id, src_res);
    if(res && res.data) common.statusMessage(fn, "Move folder result: ID: ", res.data.id, " Name: ", res.data.name, " Parent: ", res.data.parents);
    else common.statusMessage(fn, "Move folder result - No folder found");

    common.end_test(fn);
}

async function test_common_google_drive_core_fns_create_folder()
{
    // Get the function name for logging
    const fn = test_common_google_drive_core_fns_create_folder.name;

    common.start_test(fn);

    // Get authentication and drive instance
    const auth = common.createGoogleAuth();
    const drive = google.drive({ version: 'v3', auth });

    const folder_name = "Test Create Folder";
    const parent_folder_id = "1RQWnc1dSkRnUDxkO4Tm_tjBjyyL1qpr-";  // "Test Folder" under "Customer Success Shared Drive"
    const res = await common.GoogleDrive_createFolder(drive, folder_name, parent_folder_id);
    if(res && res.data) common.statusMessage(fn, "Create folder result: ID: ", res.data.id, " Name: ", res.data.name, " Parent: ", res.data.parents);
    else common.statusMessage(fn, "Create folder result - No folder found");

    common.end_test(fn);
}

async function test_common_google_drive_core_fns_create_file()
{
    // Get the function name for logging
    const fn = test_common_google_drive_core_fns_create_file.name;

    common.start_test(fn);

    // Get authentication and drive instance
    const auth = common.createGoogleAuth();
    const drive = google.drive({ version: 'v3', auth });

    const file_name = "Test Create File.txt";
    const parent_folder_id = "1RQWnc1dSkRnUDxkO4Tm_tjBjyyL1qpr-";  // "Test Folder" under "Customer Success Shared Drive"
    const mime_type = "text/plain";
    const res = await common.GoogleDrive_createFile(drive, file_name, parent_folder_id, mime_type);
    if(res && res.data) common.statusMessage(fn, "Create file result: ID: ", res.data.id, " Name: ", res.data.name, " Parent: ", res.data.parents);
    else common.statusMessage(fn, "Create file result - No file found");

    common.end_test(fn);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function test_common_google_drive_core_fns()
{
    // Get the function name for logging
    const fn = test_common_google_drive_core_fns.name;

    common.start_test_suite("Google Drive Core Functions");
    
    if(process.env.RUN_TEST_COMMON_GOOGLE_DRIVE_CORE_FNS_GET_FOLDER === "true") await test_common_google_drive_core_fns_get_folder();
    if(process.env.RUN_TEST_COMMON_GOOGLE_DRIVE_CORE_FNS_GET_FILES_IN_FOLDER === "true") await test_common_google_drive_core_fns_get_files_in_folder();
    if(process.env.RUN_TEST_COMMON_GOOGLE_DRIVE_CORE_FNS_GET_FOLDER_IN_FOLDER === "true") await test_common_google_drive_core_fns_get_folder_in_folder();
    if(process.env.RUN_TEST_COMMON_GOOGLE_DRIVE_CORE_FNS_COPY_FILE_TO_FOLDER === "true") await test_common_google_drive_core_fns_copy_file_to_folder();
    if(process.env.RUN_TEST_COMMON_GOOGLE_DRIVE_CORE_FNS_TRASH_FILE === "true") await test_common_google_drive_core_fns_trash_file();
    if(process.env.RUN_TEST_COMMON_GOOGLE_DRIVE_CORE_FNS_MOVE_FOLDER === "true") await test_common_google_drive_core_fns_move_folder();
    if(process.env.RUN_TEST_COMMON_GOOGLE_DRIVE_CORE_FNS_CREATE_FOLDER === "true") await test_common_google_drive_core_fns_create_folder();
    if(process.env.RUN_TEST_COMMON_GOOGLE_DRIVE_CORE_FNS_CREATE_FILE === "true") await test_common_google_drive_core_fns_create_file();

    common.end_test_suite("Google Drive Core Functions");
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports = 
{
    test_common_google_drive_core_fns
}