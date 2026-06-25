const common = require("@fyle-ops/common");
const path = require("path");

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


async function test_google_export_files()
{
    // Get the function name for logging
    const _fn = test_google_export_files.name;

    common.start_test(_fn);

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
        for(const attachment of attachments)
        {
            common.statusMessage(_fn, `Fetched attachment: ${attachment.filename}, content type: ${attachment.contentType}, content length: ${attachment.content.length}`);

            const base_path = process.cwd();
            const downloads_folder = process.env.DOWNLOADS_FOLDER || "downloads";
            const output_dir = path.join(base_path, downloads_folder);
            const folder_path = path.join(output_dir, "test_folder");

            const content = attachment.content;
            const file_name = attachment.filename;
            const extension = common.getExtensionFromMimeType(attachment.contentType);
            await common.createLocalFile(folder_path, file_name, extension, content);
        }
    }
    else
    {
        common.statusMessage(_fn, "Failed to fetch attachments");
        return -1;
    }

    

    common.end_test(_fn);

    return 0;    
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function test_common_google_export_files()
{
    // Get function name for logging
    const _fn = test_common_google_export_files.name;

    common.start_test_suite("Google Export Files");
    
    if(process.env.RUN_COMMON_GOOGLE_EXPORT_FILES_TEST === "true") await test_google_export_files();

    common.end_test_suite("Google Export Files");
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports =
{
    test_common_google_export_files,
};