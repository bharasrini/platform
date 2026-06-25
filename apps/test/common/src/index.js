const path = require("path");

require("dotenv").config({
    //path: path.resolve(__dirname, "..", "..", "env", ".env.common"),
    path: path.resolve(__dirname, "..", ".env"),
    override: true
});


const { test_common_date_time } = require("./test_common_date_time");
const { test_common_google_drive_core_fns } = require("./test_common_google_drive_core_fns");
const { test_common_google_drive } = require("./test_common_google_drive");
const { test_common_google_sheet_core_fns } = require("./test_common_google_sheet_core_fns");
const { test_common_google_sheet } = require("./test_common_google_sheet");
const { test_common_local_file_folder } = require("./test_common_local_file_folder");
const { test_common_misc } = require("./test_common_misc");
const { test_common_retry } = require("./test_common_retry");
const { test_common_spreadsheet } = require("./test_common_spreadsheet");
const { test_common_send_gmail_email } = require("./test_common_send_gmail_email");
const { test_common_google_export_files } = require("./test_common_google_export_files");

async function run_common_tests()
{
    // Common functions
    if (process.env.RUN_COMMON_DATE_TIME_TEST === "true") await test_common_date_time();
    if (process.env.RUN_COMMON_GOOGLE_DRIVE_CORE_FNS_TEST === "true") await test_common_google_drive_core_fns();
    if (process.env.RUN_COMMON_GOOGLE_DRIVE_TEST === "true") await test_common_google_drive();
    if (process.env.RUN_COMMON_GOOGLE_SHEET_CORE_FNS_TEST === "true") await test_common_google_sheet_core_fns();
    if (process.env.RUN_COMMON_GOOGLE_SHEET_TEST === "true") await test_common_google_sheet();
    if (process.env.RUN_COMMON_LOCAL_FILE_FOLDER_TEST === "true") await test_common_local_file_folder();
    if (process.env.RUN_COMMON_MISC_TEST === "true") await test_common_misc();
    if (process.env.RUN_COMMON_RETRY_TEST === "true") await test_common_retry();
    if (process.env.RUN_COMMON_SPREADSHEET_TEST === "true") await test_common_spreadsheet();
    if (process.env.RUN_COMMON_GMAIL_SEND_EMAIL_TEST === "true") await test_common_send_gmail_email();
    if (process.env.RUN_COMMON_GOOGLE_EXPORT_FILES_TEST === "true") await test_common_google_export_files();
    return;
}

module.exports =
{
    run_common_tests
};

