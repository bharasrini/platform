const { google } = require('googleapis');

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////// FUNCTIONS ////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/* 
Function: createGoogleAuth
Purpose: Creates and returns a Google Auth object using environment variables
Inputs: none
Output: Google Auth object
*/
function createGoogleAuth() 
{
    // Get the function name for logging
    const fn = createGoogleAuth.name;
    
    // Read credentials from environment variables
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;
    const projectId = process.env.GOOGLE_PROJECT_ID; // optional but nice

    // Validate presence of required env vars
    if (!clientEmail || !privateKey) 
    {
        throw new Error('Missing GOOGLE_CLIENT_EMAIL or GOOGLE_PRIVATE_KEY env vars');
    }

    // Build credentials object as if it came from the JSON file
    const credentials = 
    {
        type: 'service_account',
        client_email: clientEmail,
        private_key: privateKey.replace(/\\n/g, '\n'), // handle \n in env
        project_id: projectId,
    };

    // Create and return the Google Auth object
    const auth = new google.auth.GoogleAuth
    ({
        credentials,
        scopes: ['https://www.googleapis.com/auth/drive'],
    });

    return auth;
}


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////// EXPORTS /////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Exporting the functions
module.exports = 
{
    createGoogleAuth
};