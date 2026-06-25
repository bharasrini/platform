
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////// FUNCTIONS ////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


const fs_to_account_map_tbl = 
[
    {"fs_def": ">= 1 report", "acct_map_def": "report_0"},
    {"fs_def": "> 3 expenses", "acct_map_def": "expense_3"},
    {"fs_def": ">= 3 expenses", "acct_map_def": "expense_2"},
    {"fs_def": ">= 1 expense", "acct_map_def": "expense_1"},
    //{"fs_def": ">= 1 expense", "acct_map_def": "expense_0"},
    {"fs_def": "Verified user", "acct_map_def": "expense_0"},
];

/* 
Function: convertFSUserDefToAccountMap
Purpose: Converts the user definition from Freshsuccess format to the Account Mapping format
Inputs: Freshsuccess User definition
Output: Account Mapping User definition, by default "report_0" is returned
*/
function convertFSUserDefToAccountMap(user_def)
{
    // Get the function name for logging
    const _fn = convertFSUserDefToAccountMap.name;

    // If it's already in the Account Mapping format, return the same
    for(let i = 0; i < fs_to_account_map_tbl.length; i++)
    {
        if(user_def.toString().trim() == fs_to_account_map_tbl[i].acct_map_def)
        {
            // It's already in the Account Mapping format
            return user_def;
        }
    }

    // Else check if its in the FS mapping format and return the equivalent Account Mapping definition
    for(let i = 0; i < fs_to_account_map_tbl.length; i++)
    {
        if(user_def.toString().trim() == fs_to_account_map_tbl[i].fs_def)
        {
            return fs_to_account_map_tbl[i].acct_map_def;
        }
    }

    return "expense_1";
}


/* 
Function: convertAccountMapUserDefToFS
Purpose: Converts the user definition from Account Mapping format to Freshsuccess
Inputs: Account Mapping User definition
Output: FS User definition, by default ">= 1 report" is returned
*/
function convertAccountMapUserDefToFS(user_def)
{
    // Get the function name for logging
    const _fn = convertAccountMapUserDefToFS.name;


    // If it's already in the FS format, return the same
    for(let i = 0; i < fs_to_account_map_tbl.length; i++)
    {
        if(user_def.toString().trim() == fs_to_account_map_tbl[i].fs_def)
        {
            // It's already in the Account Mapping format
            return user_def;
        }
    }

    // Else check if its in the Account Mapping mapping format and return the equivalent FS definition
    for(let i = 0; i < fs_to_account_map_tbl.length; i++)
    {
        if(user_def.toString().trim() == fs_to_account_map_tbl[i].acct_map_def)
        {
            return fs_to_account_map_tbl[i].fs_def;
        }
    }

    return ">= 1 expense";
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////// EXPORTS /////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Exporting the functions
module.exports =
{
    convertFSUserDefToAccountMap,
    convertAccountMapUserDefToFS
};
