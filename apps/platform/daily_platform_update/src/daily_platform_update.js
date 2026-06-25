const common = require("@fyle-ops/common");
const { fs_account } = require("@fyle-ops/freshsuccess");

const { updateFSData } = require("./update_fs_data");
const { updateFDData } = require("./update_fd_data");
const { updateAMData } = require("./update_am_data");


/*
Function: daily_platform_update
Purpose: Performs the daily platform update in FS and Account Mapping
Inputs: none
Output: 0 on success, -1 on failure
*/
async function daily_platform_update()
{
    // Get the function name for logging purposes
    const _fn = daily_platform_update.name;

    common.statusMessage(_fn, " ****************** Daily Platform Update Start ****************** ");

    // First get the list of all accounts
    const account = new fs_account();
    if(await account.getAccounts() < 0)
    {
        common.statusMessage(_fn, "Failed to get the list of accounts, exiting");
        return -1;    
    }
    common.statusMessage(_fn, "Finished getting list of all accounts, going to get account contacts next");

    // Next get the list of all account contacts
    if(await account.getContacts() < 0)
    {
        common.statusMessage(_fn, "Failed to get the list of account contacts, exiting");
        return -1;    
    }
    common.statusMessage(_fn, "Finished getting list of all account contacts, going to check and update FS data next");

    ///////////////////////////////////////////////////////////////////////////////////////////////////////////

    // Next check and update FS data
    if(await updateFSData(account) < 0)
    {
        common.statusMessage(_fn, "Failed to update FS data, exiting");
        return -1;
    }
    common.statusMessage(_fn, "Successfully updated FS data, going to update FD data next");

    ///////////////////////////////////////////////////////////////////////////////////////////////////////////

    // Next check and update FD data
    if(await updateFDData(account) < 0)
    {
        common.statusMessage(_fn, "Failed to update FD data, exiting");
        return -1;
    }
    common.statusMessage(_fn, "Successfully updated FD data, going to update AM data next");

    ///////////////////////////////////////////////////////////////////////////////////////////////////////////

    // Next check and update AM data
    if(await updateAMData(account) < 0)
    {
        common.statusMessage(_fn, "Failed to update AM data, exiting");
        return -1;
    }
    common.statusMessage(_fn, "Successfully updated AM data, daily platform update completed");

    ///////////////////////////////////////////////////////////////////////////////////////////////////////////

    common.statusMessage(_fn, " ****************** Daily Platform Update End ****************** ");

}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports = 
{
    daily_platform_update
}