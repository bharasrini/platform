const common = require("@fyle-ops/common");

// Importing the CSM mapping from csm_mapping.json
const CSM_MAP = require("../data/csm_mapping.json");


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////// FUNCTIONS ////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/* 
Function: returnFDCSMNameForEmail
Purpose: Returns the FreshDesk CSM name for the email passed in
Inputs: csm_email
Output: CSM Name or blank if not found
*/
function returnFDCSMNameForEmail(email)
{
    // Get the function name for logging
    const fn = returnFDCSMNameForEmail.name;

    for(let i = 0; i < CSM_MAP.length; i++)
    {
        if(email == CSM_MAP[i].csm_email_from_fs)
        {
            return CSM_MAP[i].csm_name_from_fd;
        }
    }

    return "";
}


/* 
Function: returnEmailForFDCSMName
Purpose: Returns the email for the FreshDesk CSM name passed in
Inputs: csm_name
Output: CSM Email or blank if not found
*/
function returnEmailForFDCSMName(csm_name)
{
    // Get the function name for logging
    const fn = returnEmailForFDCSMName.name;

    for(let i = 0; i < CSM_MAP.length; i++)
    {
        if(csm_name == CSM_MAP[i].csm_name_from_fd)
        {
            return CSM_MAP[i].csm_email_from_fs;
        }
    }

    return "";
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////// EXPORTS /////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports =
{
    returnFDCSMNameForEmail,
    returnEmailForFDCSMName
};