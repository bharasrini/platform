const { google } = require('googleapis');

const readline = require('readline');
const credentials = 
{
    "installed":
    {
        "client_id": process.env.OAUTH_CLIENT_ID,
        "project_id": process.env.OAUTH_PROJECT_ID,
        "auth_uri": process.env.OAUTH_AUTH_URI,
        "token_uri": process.env.OAUTH_TOKEN_URI,
        "auth_provider_x509_cert_url": process.env.OAUTH_AUTH_PROVIDER_X509_CERT_URL,
        "client_secret": process.env.GMAIL_CLIENT_SECRET,
        "redirect_uris":[process.env.OAUTH_REDIRECT_URIS]
    }
};


const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];

const { client_secret, client_id, redirect_uris } = credentials.installed;

const oauth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    'http://localhost'
);

const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
});

console.log('Authorize this app by visiting this URL:\n', authUrl);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

rl.question('\nEnter the code from that page here: ', async (code) => {
    rl.close();

    const { tokens } = await oauth2Client.getToken(code);
    console.log('\nSave this refresh token in .env:\n');
    console.log(tokens.refresh_token);
});