const { formatInTimeZone } = require("date-fns-tz");
const { fyle_account } = require("@fyle-ops/fyle_api");
const common = require("@fyle-ops/common");

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////




async function test_fyle_api_get_receipt_list()
{
    // Get function name for logging
    const _fn = test_fyle_api_get_receipt_list.name;

    common.start_test(_fn);

    // Account details - org ID: "or8TuR1VLwUj", org name: "Training Account", user email: "ashwathi.vinod@fyle.in"
    const client_id_str = "tpagISVKxnQMr";
    const client_secret_str = "zJYzCG9O4J";
    const refresh_token_str = "eyJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE3Mzk4NTgxMzEsImlzcyI6IkZ5bGVBcHAiLCJvcmdfdXNlcl9pZCI6Ilwib3UzYnVRdFphdGIxXCIiLCJ0cGFfaWQiOiJcInRwYWdJU1ZLeG5RTXJcIiIsInRwYV9uYW1lIjoiXCJDYXJkIFRyYW5zYWN0aW8uLlwiIiwiY2x1c3Rlcl9kb21haW4iOiJcImh0dHBzOi8vaW4xLmZ5bGVocS5jb21cIiIsImV4cCI6MjA1NTIxODEzMX0.VPNQ9P93kihD03p3-j_npcidd3TywOQ_6JAhXaZe6cQ";

    const fyle_acc = new fyle_account();

    await fyle_acc.auth.getAccessToken(client_id_str, client_secret_str, refresh_token_str);
    await fyle_acc.auth.getClusterEndpoint();
    await fyle_acc.auth.validateClusterEndpoint();
    common.statusMessage(_fn,"Authentication successful !!!");

    const states = ["COMPLETE", "APPROVER_PENDING", "APPROVED", "PAYMENT_PROCESSING", "PAYMENT_PENDING", "PAID"];
    const users = ["usyXAERqjQGX", "usxGgLmlhGIn", "us08ojgOHURE", "ushhTRDSOLsw", "usFKjFhQxoaw", "usD2ChrJOftx", "usEcLMSeAEaW"];
    const event = "created_at";
    const after = "01-Jan-2025";
    const before = "31-Dec-2025";
    const start_date_str = formatInTimeZone(new Date(after), "UTC", "yyyy-MM-dd'T'HH:mm:ssXXX"); 
    const end_date_str = formatInTimeZone(new Date(before), "UTC", "yyyy-MM-dd'T'HH:mm:ssXXX"); 

    await fyle_acc.expense.getExpenses(users, states, event, start_date_str, end_date_str);
    common.statusMessage(_fn,"Expenses retrieved successfully !!!");

    await fyle_acc.receipt.getReceiptList();
    common.statusMessage(_fn,"Receipts retrieved successfully !!!. Number of receipts retrieved: " + fyle_acc.receipts.num_receipts);

    common.end_test(_fn);
}



async function test_fyle_api_get_receipt_links()
{
    // Get function name for logging
    const _fn = test_fyle_api_get_receipt_links.name;

    common.start_test(_fn);

    // Account details - org ID: "or8TuR1VLwUj", org name: "Training Account", user email: "ashwathi.vinod@fyle.in"
    const client_id_str = "tpagISVKxnQMr";
    const client_secret_str = "zJYzCG9O4J";
    const refresh_token_str = "eyJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE3Mzk4NTgxMzEsImlzcyI6IkZ5bGVBcHAiLCJvcmdfdXNlcl9pZCI6Ilwib3UzYnVRdFphdGIxXCIiLCJ0cGFfaWQiOiJcInRwYWdJU1ZLeG5RTXJcIiIsInRwYV9uYW1lIjoiXCJDYXJkIFRyYW5zYWN0aW8uLlwiIiwiY2x1c3Rlcl9kb21haW4iOiJcImh0dHBzOi8vaW4xLmZ5bGVocS5jb21cIiIsImV4cCI6MjA1NTIxODEzMX0.VPNQ9P93kihD03p3-j_npcidd3TywOQ_6JAhXaZe6cQ";

    const fyle_acc = new fyle_account();

    await fyle_acc.auth.getAccessToken(client_id_str, client_secret_str, refresh_token_str);
    await fyle_acc.auth.getClusterEndpoint();
    await fyle_acc.auth.validateClusterEndpoint();
    common.statusMessage(_fn,"Authentication successful !!!");

    const states = ["COMPLETE", "APPROVER_PENDING", "APPROVED", "PAYMENT_PROCESSING", "PAYMENT_PENDING", "PAID"];
    const users = ["usyXAERqjQGX", "usxGgLmlhGIn", "us08ojgOHURE", "ushhTRDSOLsw", "usFKjFhQxoaw", "usD2ChrJOftx", "usEcLMSeAEaW"];
    const event = "created_at";
    const after = "01-Jan-2025";
    const before = "31-Dec-2025";
    const start_date_str = formatInTimeZone(new Date(after), "UTC", "yyyy-MM-dd'T'HH:mm:ssXXX"); 
    const end_date_str = formatInTimeZone(new Date(before), "UTC", "yyyy-MM-dd'T'HH:mm:ssXXX"); 

    await fyle_acc.expense.getExpenses(users, states, event, start_date_str, end_date_str);
    common.statusMessage(_fn,"Expenses retrieved successfully !!!. Number of expenses retrieved: " + fyle_acc.expenses.num_expenses);

    await fyle_acc.receipt.getReceiptList();
    common.statusMessage(_fn,"Receipts retrieved successfully !!!. Number of receipts retrieved: " + fyle_acc.receipts.num_receipts);

    await fyle_acc.receipt.getReceiptLinks();
    common.statusMessage(_fn,"Receipt links retrieved successfully !!!");

    common.end_test(_fn);
}


async function test_fyle_api_get_receipt()
{
    // Get function name for logging
    const _fn = test_fyle_api_get_receipt.name;

    common.start_test(_fn);

    // Account details - org ID: "or8TuR1VLwUj", org name: "Training Account", user email: "ashwathi.vinod@fyle.in"
    const client_id_str = "tpagISVKxnQMr";
    const client_secret_str = "zJYzCG9O4J";
    const refresh_token_str = "eyJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE3Mzk4NTgxMzEsImlzcyI6IkZ5bGVBcHAiLCJvcmdfdXNlcl9pZCI6Ilwib3UzYnVRdFphdGIxXCIiLCJ0cGFfaWQiOiJcInRwYWdJU1ZLeG5RTXJcIiIsInRwYV9uYW1lIjoiXCJDYXJkIFRyYW5zYWN0aW8uLlwiIiwiY2x1c3Rlcl9kb21haW4iOiJcImh0dHBzOi8vaW4xLmZ5bGVocS5jb21cIiIsImV4cCI6MjA1NTIxODEzMX0.VPNQ9P93kihD03p3-j_npcidd3TywOQ_6JAhXaZe6cQ";

    const fyle_acc = new fyle_account();

    await fyle_acc.auth.getAccessToken(client_id_str, client_secret_str, refresh_token_str);
    await fyle_acc.auth.getClusterEndpoint();
    await fyle_acc.auth.validateClusterEndpoint();
    common.statusMessage(_fn,"Authentication successful !!!");

    const states = ["COMPLETE", "APPROVER_PENDING", "APPROVED", "PAYMENT_PROCESSING", "PAYMENT_PENDING", "PAID"];
    const users = ["usyXAERqjQGX", "usxGgLmlhGIn", "us08ojgOHURE", "ushhTRDSOLsw", "usFKjFhQxoaw", "usD2ChrJOftx", "usEcLMSeAEaW"];
    const event = "created_at";
    const after = "01-Jan-2025";
    const before = "31-Dec-2025";
    const start_date_str = formatInTimeZone(new Date(after), "UTC", "yyyy-MM-dd'T'HH:mm:ssXXX"); 
    const end_date_str = formatInTimeZone(new Date(before), "UTC", "yyyy-MM-dd'T'HH:mm:ssXXX"); 

    await fyle_acc.expense.getExpenses(users, states, event, start_date_str, end_date_str);
    common.statusMessage(_fn,"Expenses retrieved successfully !!!");

    await fyle_acc.receipt.getReceiptList();
    common.statusMessage(_fn,"Receipts retrieved successfully !!!");

    const receipt_id = "fib4h01PgYUA";
    await fyle_acc.receipt.getReceiptFile(receipt_id);
    common.statusMessage(_fn,"Receipt File for: " + receipt_id + " retrieved successfully !!!");

    common.end_test(_fn);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


async function test_fyle_api_receipts()
{
    // Get function name for logging
    const _fn = test_fyle_api_receipts.name;

    common.start_test_suite("Fyle API - Receipts");

    if(process.env.RUN_TEST_FYLE_API_GET_RECEIPT_LIST === "true") await test_fyle_api_get_receipt_list();
    if(process.env.RUN_TEST_FYLE_API_GET_RECEIPT_LINKS === "true") await test_fyle_api_get_receipt_links();
    if(process.env.RUN_TEST_FYLE_API_GET_RECEIPT === "true") await test_fyle_api_get_receipt();

    common.end_test_suite("Fyle API - Receipts");
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// Export the test function
module.exports = 
{
    test_fyle_api_receipts
};

