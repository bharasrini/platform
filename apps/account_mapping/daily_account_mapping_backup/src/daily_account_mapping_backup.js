const { formatInTimeZone } = require("date-fns-tz");
const common = require("@fyle-ops/common");

/*
Function: takeAccountMappingBackup
Purpose: Takes a backup of Account Mapping data
Inputs: none
Output: 0 on success, -1 on failure
*/
async function takeAccountMappingBackup()
{
    // Get the function name for logging purposes
    const _fn = takeAccountMappingBackup.name;

    common.statusMessage(_fn, " ****************** Account Mapping Backup Start ****************** ");

    // URL for the source file
    const source_file_url = "https://drive.google.com/file/d/" + process.env.ACCOUNT_MAPPING_SHEET_ID + "/view?usp=sharing";

    // Backup folder where the file needs to be copied
    const folder_id = process.env.ACCOUNT_MAPPING_DATA_BACKUP_FOLDER_ID;

    // Create a new file every day in the My Drive -> Tooling -> Account Mapping -> Data Backup folder
    const today_date = formatInTimeZone(new Date(), "UTC", "yyyy-MM-dd");
    const file_name = process.env.ACCOUNT_MAPPING_DATA_BACKUP_FILE_PREFIX + today_date;

    // Initiate the file copy
    const ret_file = await common.GoogleDrive_copyFileToFolder(source_file_url, folder_id, file_name);

    if(!ret_file)
    {
        common.statusMessage(_fn, "Failed to take backup of Account Mapping data");
        return -1;
    }

    common.statusMessage(_fn, " ****************** Account Mapping Backup End ****************** ");

    return 0;
}


module.exports =
{
    takeAccountMappingBackup
}
