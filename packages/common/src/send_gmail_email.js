const { google } = require('googleapis');
const MailComposer = require('nodemailer/lib/mail-composer');
const { getOAuth2Client } = require("./google_auth");
const { statusMessage, getExecutionLogs } = require("./logs");

/*
Function: encodeMessage
Purpose: Encodes a message in base64 format suitable for Gmail API.
Inputs: message - the message to be encoded
Output: The base64 encoded message
*/
function encodeMessage(message) 
{
    // Get the function name for logging purposes
    const _fn = encodeMessage.name;

    return Buffer.from(message)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

/*
Function: createRawEmail
Purpose: Creates a raw email message suitable for Gmail API.
Inputs: from - the sender's email address
        to - the recipient's email address
        cc - the CC email addresses
        bcc - the BCC email addresses
        subject - the email subject
        text - the plain text email body
        html - the HTML email body
        attachments - the email attachments
Output: The base64 encoded raw email message
*/
async function createRawEmail({ from, to, cc, bcc, subject, text, html, attachments = [] })
{
    // Get the function name for logging purposes
    const _fn = createRawEmail.name;

    try
    {
        // Compose the email using nodemailer
        const mail = new MailComposer(
        {
            "from": from,
            "to": to,
            "cc": cc,
            "bcc": bcc,
            "subject": subject,
            "text": text,
            "html": html,
            "attachments": attachments
        });

        // Build the email message and encode it in base64 format
        const message = await mail.compile().build();

        return encodeMessage(message);
    }
    catch(e)
    {
        statusMessage("Error creating raw email: ", e.message);
        return null;
    }
}


/*
Function: sendGmailEmail
Purpose: Sends an email using the Gmail API.
Inputs: to - the recipient's email address
        cc - the CC email addresses
        bcc - the BCC email addresses
        subject - the email subject
        text - the plain text email body
        html - the HTML email body
        attachments - the email attachments
        Attachments can either use a Buffer or a file path. For file paths, the content will be read and converted to a Buffer before sending.
        As a Buffer (or list of Buffers):
        attachments: 
        [{
            filename: 'Customer Mapping.xlsx',
            content: attachmentBuffer,
            contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }]
        As a file path (or list of file paths):
        attachments: 
        [{
            filename: 'Customer Mapping.xlsx',
            path: '/path/to/Customer Mapping.xlsx',
        }]
Output: The response data from the Gmail API
*/
async function sendGmailEmail({ to, cc, bcc, subject, text, html, attachments = [] })
{
    // Get the function name for logging purposes
    const _fn = sendGmailEmail.name;

    // Get the OAuth2 client for Gmail API using the client ID, client secret, and refresh token from environment variables
    const oauth2Client = await getOAuth2Client();

    // Create a Gmail API client using the OAuth2 client
    const gmail = google.gmail({
        "version": 'v1',
        "auth": oauth2Client
    });

    // Create the raw email message using the provided inputs and encode it in base64 format
    const raw = await createRawEmail(
    {
        "from": process.env.GMAIL_FROM,
        "to": to,
        "cc": cc,
        "bcc": bcc,
        "subject": subject,
        "text": text,
        "html": html,
        "attachments": attachments
    });

    try
    {
        // Send the email using the Gmail API and return the response data
        const response = await gmail.users.messages.send(
        {
            "userId": 'me',
            "requestBody": 
            {
                "raw": raw
            }
        });

        return response.data;
    }
    catch(e)
    {
        const status = e.code || e.response?.status;
        const reason = e.response?.data?.error;
        const message = e.message;

        statusMessage("Gmail send failed", 
        {
            status,
            reason,
            message,
            details: e.response?.data
        });
    }

    
    return null;
}



/* 
Function: sendLogsEmail
Purpose: Sends out an email with the logs 
Pre-requisite: None
Inputs: none
Output: 0 on success, -1 on failure
*/
async function sendLogsEmail()
{
    // Get the function name for logging purposes
    const _fn = sendLogsEmail.name;

    const logs = getExecutionLogs();

    // Check and send emails
    const send_email = process.env.SEND_LOGS_EMAIL;
    if(send_email == "true")
    {
        const to_emails = process.env.LOGS_EMAIL_TO;
        const cc_emails = process.env.LOGS_EMAIL_CC;
        const customer_name = process.env.CUSTOMER_NAME || "Customer";
        const email_subject_suffix = process.env.LOGS_EMAIL_SUBJECT_SUFFIX || ": Logs";
        const email_body = `Hi,\n\nPlease find below logs for ${customer_name}.\n\nBest Regards,\nSage Expense Management (Formerly Fyle)\n\n` + logs;
        const mail_params =
        {
            "to": to_emails,
            "cc": cc_emails,
            "subject": customer_name + email_subject_suffix,
            "text": email_body,
            "attachments": null
        };

        const response = await sendGmailEmail(mail_params);
        if(response == null)
        {
            statusMessage(_fn, "Failed to send out emails with the expense export attached");
        }
    }

    return 0;
}



module.exports =
{
    sendGmailEmail,
    sendLogsEmail
};