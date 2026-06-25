const common = require("@fyle-ops/common");

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function test_sendGmailEmailWithoutAttachment()
{
    // Get the function name for logging
    const _fn = test_sendGmailEmailWithoutAttachment.name;

    common.start_test(_fn);

    const response = await common.sendGmailEmail(
    {
        "to": 'bharasrini@yahoo.com',
        "subject": 'Test without attachment',
        "text": 'Hi, please find the test without attachment.',
        "attachments": null
    });

    common.statusMessage(_fn, "Email sent. Response: ", response);

    common.end_test(_fn);

    return 0;    
}


async function test_sendGmailEmailFromLocalFileasPath()
{
    // Get the function name for logging
    const _fn = test_sendGmailEmailFromLocalFileasPath.name;

    common.start_test(_fn);

    const response = await common.sendGmailEmail(
    {
        "to": 'bharadwaj.srinivasan@fyle.in',
        "subject": 'Report attached - Local File as Path',
        "text": 'Hi, please find the report attached.',
        "attachments":
        [
            {
                "filename": 'report.xlsx',
                "path": 'C:\\Users\\Bharadwaj\\Downloads\\CS Offsite.xlsx'
            }
        ]
    });

    common.statusMessage(_fn, "Email sent. Response: ", response);

    common.end_test(_fn);

    return 0;    
}



async function test_sendGmailEmailFromLocalFileasAttachment()
{
    // Get the function name for logging
    const _fn = test_sendGmailEmailFromLocalFileasAttachment.name;

    common.start_test(_fn);

    // Get the local file as an attachment
    const attachment = await common.getLocalFileAsAttachment('C:\\Users\\Bharadwaj\\Downloads\\CS Offsite.xlsx');
    const content = attachment?.content;
    const content_type = attachment?.content_type;
    const file_name = attachment?.file_name;
    if(attachment)
    {
        const response = await common.sendGmailEmail(
        {
            "to": 'bharadwaj.srinivasan@fyle.in',
            "subject": 'Report attached - Local File as Attachment',
            "text": 'Hi, please find the report attached.',
            "attachments":
            [
                {
                    "filename": file_name,
                    "content": content,
                    "contentType": content_type
                }
            ]
        });        

        common.statusMessage(_fn, "Email sent. Response: ", response);
    }
    else
    {
        common.statusMessage(_fn, "Failed to get local file as attachment");
    }

    common.end_test(_fn);

    return 0;    
}


async function test_sendGmailEmailFromGoogleDriveFile()
{
    // Get the function name for logging
    const _fn = test_sendGmailEmailFromGoogleDriveFile.name;

    common.start_test(_fn);

    // List of Google Drive files to be fetched as attachments and sent in the email
    const file_list =
    [
        {
            "file_id": '1Y8W-8D74Mefd5IW4_DfbBiLbGek25CidKVB-I0S0hy8',
            "preferred_format": 'xlsx'
        },
        {
            "file_id": '1IWlRG96NFZhyAfhk-ncUpp4uMIpbCe7f',
            "preferred_format": null 
        },
        {
            "file_id": '1F-v-FhErvEo8wJ6gQw4rb189Y0yggHj1',
            "preferred_format": 'jpg' 
        },
        {
            "file_id": '1HyVeQvCbESax_dzL6v2sU23qBVIjlHlJ',
            "preferred_format": 'docx'
        }
    ];

    const attachments = await common.getDriveFilesAsAttachments(file_list);
    if(attachments)
    {
        const response = await common.sendGmailEmail(
        {
            "to": 'bharadwaj.srinivasan@fyle.in',
            "subject": 'Report attached - Google Drive Files',
            "text": 'Hi, please find the report attached.',
            "attachments": attachments
        });

        common.statusMessage(_fn, "Email sent. Response: ", response);
    }
    else
    {
        common.statusMessage(_fn, "Failed to fetch attachments from Google Drive");
    }

    common.end_test(_fn);

    return 0;    
}



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function test_common_send_gmail_email()
{
    // Get function name for logging
    const _fn = test_common_send_gmail_email.name;

    common.start_test_suite("Send Gmail Email");
    
    if(process.env.RUN_TEST_COMMON_SEND_GMAIL_EMAIL_WITHOUT_ATTACHMENT === "true") await test_sendGmailEmailWithoutAttachment();
    if(process.env.RUN_TEST_COMMON_SEND_GMAIL_EMAIL_FROM_LOCAL_FILE_AS_PATH === "true") await test_sendGmailEmailFromLocalFileasPath();
    if(process.env.RUN_TEST_COMMON_SEND_GMAIL_EMAIL_FROM_LOCAL_FILE_AS_ATTACHMENT === "true") await test_sendGmailEmailFromLocalFileasAttachment();
    if(process.env.RUN_TEST_COMMON_SEND_GMAIL_EMAIL_FROM_GOOGLE_DRIVE_FILE === "true") await test_sendGmailEmailFromGoogleDriveFile();

    common.end_test_suite("Send Gmail Email");
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports =
{
    test_common_send_gmail_email,
};