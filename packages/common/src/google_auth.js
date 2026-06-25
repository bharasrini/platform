const { google } = require('googleapis');
const { statusMessage } = require("./logs");


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////// FUNCTIONS ////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/* 
Function: createGoogleAuth
Purpose: Creates and returns a Google Auth object using environment variables
Inputs: none
Output: Google Auth object on success, null on failure
*/
function createGoogleAuth() 
{
    // Get the function name for logging
    const _fn = createGoogleAuth.name;
    
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

    try
    {
        // Create and return the Google Auth object
        const auth = new google.auth.GoogleAuth
        ({
            credentials,
            scopes: ['https://www.googleapis.com/auth/drive'],
        });

        return auth;
    }
    catch (e)
    {
        statusMessage(_fn, "Error creating Google Auth object: ", e);
        return null;
    }
}


/* 
Function: getOAuth2Client
Purpose: Creates and returns a Google OAuth2 client using environment variables
Inputs: none
Output: Google OAuth2 client on success, null on failure
*/
async function getOAuth2Client()
{
    // Get the function name for logging
    const _fn = getOAuth2Client.name;

    try
    {
        // Get the OAuth2 client for Gmail API using the client ID, client secret, and refresh token from environment variables
        const oauth2Client = new google.auth.OAuth2(
            process.env.GMAIL_CLIENT_ID,
            process.env.GMAIL_CLIENT_SECRET
        );

        // Set the credentials for the OAuth2 client using the refresh token from environment variables
        oauth2Client.setCredentials(
        {
            refresh_token: process.env.GMAIL_REFRESH_TOKEN
        });

        return oauth2Client;
    }
    catch (e)
    {
        statusMessage(_fn, "Error creating OAuth2 client: ", e);
        return null;
    }
}


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////// EXPORTS /////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Exporting the functions
module.exports = 
{
    createGoogleAuth,
    getOAuth2Client
};