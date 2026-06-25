const common = require("@fyle-ops/common");
const { fs_account, postContactsToFS } = require("@fyle-ops/freshsuccess");

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


async function test_fs_get_contacts()
{
    // Get function name for logging
    const _fn = test_fs_get_contacts.name;

    common.start_test(_fn);

    const account = new fs_account();
    await account.getContacts();
    common.statusMessage(_fn,"Contacts read successfully !!!");

    common.end_test(_fn);
}


async function test_fs_post_contacts()
{
    // Get function name for logging
    const _fn = test_fs_post_contacts.name;

    common.start_test(_fn);

    const record_container =
    [
        {
            "account_id": "ortst9876543210",
            "email": "bharadwaj.srinivasan001@fyle.in",
            "role": "User",
            "user_id": "user_123456789",
            "is_active": true,        
        },
        {
            "account_id": "ortst9876543210",
            "email": "bharadwaj.srinivasan002@fyle.in",
            "role": "Spender",
            "user_id": "user_987654321",
            "is_active": true,        
        },
    ];

    if(await postContactsToFS(record_container) < 0)
    {
        common.statusMessage(_fn,"Error posting records to Freshsuccess !!!");
    }
    else
    {
        common.statusMessage(_fn,"Records posted to Freshsuccess successfully !!!");
    }

    common.end_test(_fn);
    
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function test_fs_contacts()
{
    // Get the function name for logging
    const _fn = test_fs_contacts.name;

    if(process.env.RUN_TEST_FS_GET_CONTACTS === "true") await test_fs_get_contacts();
    if(process.env.RUN_TEST_FS_POST_CONTACTS === "true") await test_fs_post_contacts();
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports = 
{
    test_fs_contacts
};

