const common = require("@fyle-ops/common");

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


async function test_copyFileOnGoogleDrive()
{
    // Get the function name for logging
    const _fn = test_copyFileOnGoogleDrive.name;

    common.start_test(_fn);

    const source_file_url = "https://drive.google.com/file/d/1zEvRdrTnBHLLvvBAF0ZopIpVu3XcFFvt/view?usp=drive_link";
    const dest_folder_id = "1RQWnc1dSkRnUDxkO4Tm_tjBjyyL1qpr-";  // "Test Folder" under "Customer Success Shared Drive"
    const file_name_to_use = "Final Copied Test File - XUL Brewing Company.pdf";
    const copy_if_same_file_exists = true;
    const copied_file_url = await common.GoogleDrive_copyFileToFolder(source_file_url, dest_folder_id, file_name_to_use, copy_if_same_file_exists);
    if(copied_file_url) common.statusMessage(_fn, "Copied file: ", file_name_to_use, "to folder: ", dest_folder_id, ".Copied file URL: ", copied_file_url);

    common.end_test(_fn);
}


async function test_trashFileOnGoogleDrive()
{
    // Get the function name for logging
    const _fn = test_trashFileOnGoogleDrive.name;

    common.start_test(_fn);

    const folder_id = "1RQWnc1dSkRnUDxkO4Tm_tjBjyyL1qpr-";  // "Test Folder" under "Customer Success Shared Drive"
    const file_name = "Copied 1 Test File - XUL Brewing Company.pdf";
    const result = await common.GoogleDrive_trashFile(folder_id, file_name);
    common.statusMessage(_fn, "Thrashed file: ", file_name, "Operation Result: ", result);

    common.end_test(_fn);
}


async function test_moveFolderOnGoogleDrive()
{
    // Get the function name for logging
    const _fn = test_moveFolderOnGoogleDrive.name;

    common.start_test(_fn);

    const folder_id = "1I6bUoEQjWmB-Bz3sVg8eokbNOz7mWIFv";  // "Check123: under "Test Folder" in "Customer Success Shared Drive"
    const dest_folder_id = "1uYmEV_I-ZHGM4iDX6etkJGogMGyuBoiH";  // "Test Folder1" under "Customer Success Shared Drive"
    const result = await common.GoogleDrive_moveFolder(folder_id, dest_folder_id);
    common.statusMessage(_fn, "Moved folder: " + folder_id + " to folder: " + dest_folder_id, "Operation Result: ", result);

    common.end_test(_fn);
}

async function test_checkAndCreateFolderOnGoogleDrive()
{
    // Get the function name for logging
    const _fn = test_checkAndCreateFolderOnGoogleDrive.name;

    common.start_test(_fn);

    const folder_id = "1RQWnc1dSkRnUDxkO4Tm_tjBjyyL1qpr-";  // "Test Folder" under "Customer Success Shared Drive"
    const child_folder_name = "New Check123";
    const child_folder_id = await common.GoogleDrive_createFolder(folder_id, child_folder_name);
    common.statusMessage(_fn, "Created new folder with name:", child_folder_name, "under folder: ", folder_id, ". Created Folder id: ", child_folder_id);

    common.end_test(_fn);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function test_common_google_drive()
{
    // Get the function name for logging
    const _fn = test_common_google_drive.name;

    common.start_test_suite("Google Drive functions");
    
    // Google Drive functions
    if(process.env.RUN_TEST_COMMON_COPY_FILE_ON_GOOGLE_DRIVE === "true") await test_copyFileOnGoogleDrive();
    if(process.env.RUN_TEST_COMMON_TRASH_FILE_ON_GOOGLE_DRIVE === "true") await test_trashFileOnGoogleDrive();
    if(process.env.RUN_TEST_COMMON_MOVE_FOLDER_ON_GOOGLE_DRIVE === "true") await test_moveFolderOnGoogleDrive();
    if(process.env.RUN_TEST_COMMON_CHECK_AND_CREATE_FOLDER_ON_GOOGLE_DRIVE === "true") await test_checkAndCreateFolderOnGoogleDrive();

    common.end_test_suite("Google Drive functions");
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports = 
{
    test_common_google_drive
};