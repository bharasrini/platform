const { formatInTimeZone } = require("date-fns-tz");
const { fyle_account } = require("@fyle-ops/fyle_api");
const common = require("@fyle-ops/common");

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


async function test_fyle_api_get_card_transactions()
{
    // Get function name for logging
    const _fn = test_fyle_api_get_card_transactions.name;

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

    const event = "created_at";
    const after = "01-Jan-2025";
    //const before = "28-Feb-2026";
    const start_date_str = formatInTimeZone(new Date(after), "UTC", "yyyy-MM-dd'T'HH:mm:ssXXX"); 
    const end_date_str = null;

    await fyle_acc.card_transaction.getCardTransactions(event, start_date_str, end_date_str);
    common.statusMessage(_fn,"Card transactions retrieved successfully !!!. Number of card transactions retrieved: " + fyle_acc.card_transactions.num_card_transactions);

    common.end_test(_fn);
}



async function test_fyle_api_get_select_card_transactions()
{
    // Get function name for logging
    const _fn = test_fyle_api_get_select_card_transactions.name;

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

    const transaction_list = 
    [
        "btxntvnJZRvQIz",
        "btxn1MpYfYtzZL",
        "btxnCX0JSDgmB5",
        "btxnCIWUzFuYSd",
        "btxnDrSJCmHeeX",
        "btxnje3q6GZujP",
        "btxnTqDu9WfZqz",
        "btxnZ30HoDvNvD",
        "btxn9u60JNQHs3",
        "btxnkhHBZBgVte",
        "btxnhjsM5WNYpk",
        "btxn5d5MHHaJFX",
        "btxnplc8JFUUPP",
        "btxnytUP76IEAd",
        "btxndNN2hySdnv",
        "btxnaqhLHa9jQM",
        "btxnlWcNSCAphS",
        "btxnkNTFteTCFT",
        "btxnQr0aqPPmPl"
    ];

    const ret = await fyle_acc.card_transaction.getSelectCardTransactions(transaction_list);
    if(ret === null)
    {
        common.statusMessage(_fn,"Failed to retrieve card transactions !!!");
        return;
    }
    common.statusMessage(_fn,"Card transactions retrieved successfully !!!");

    common.end_test(_fn);
}



async function test_fyle_api_create_card_transaction()
{
    // Get function name for logging
    const _fn = test_fyle_api_create_card_transaction.name;

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

    const card_transaction = 
    {
        id: "",
        amount: 47.51,
        currency: 'USD',
        spent_at: '2025-09-01T13:14:54.804+00:00',
        post_date: '2025-09-01T13:14:54.804+00:00',
        description: 'Team lunch',
        foreign_currency: 'GBP',
        foreign_amount: 3768,
        code: 'C1234',
        merchant: 'Uber',
        category: 'Travel',
        mcc: 'sample string',
        corporate_card_id: 'baccKD1GXS7rlB',
        metadata:
        {
            merchant_category_code: 'sample string',
            flight_merchant_category_code: 'sample string',
            flight_supplier_name: 'sample string',
            flight_travel_agency_name: 'sample string',
            flight_ticket_number: 'sample string',
            flight_total_fare: 468.2923,
            flight_travel_date: '2020-07-03T18:19:31.193Z',
            flight_service_class: 'sample string',
            flight_carrier_code: 'sample string',
            flight_fare_base_code: 'sample string',
            flight_trip_leg_number: 'sample string',
            hotel_merchant_category_code: 'sample string',
            hotel_supplier_name: 'sample string',
            hotel_checked_in_at: '2020-07-03T18:19:31.193Z',
            hotel_nights: 5,
            hotel_checked_out_at: '2020-07-03T18:19:31.193Z',
            hotel_country: 'sample string',
            hotel_city: 'sample string',
            hotel_total_fare: 468.2923,
            fleet_product_merchant_category_code: 'sample string',
            fleet_product_supplier_name: 'sample string',
            fleet_service_merchant_category_code: 'sample string',
            fleet_service_supplier_name: 'sample string',
            car_rental_merchant_category_code: 'sample string',
            car_rental_supplier_name: 'sample string',
            car_rental_started_at: '2020-07-03T18:19:31.193Z',
            car_rental_days: 5,
            car_rental_ended_at: '2020-07-03T18:19:31.193Z',
            general_ticket_issued_at: '2020-07-03T18:19:31.193Z',
            general_ticket_number: 'sample string',
            general_issuing_carrier: 'sample string',
            general_travel_agency_name: 'sample string',
            general_travel_agency_code: 'sample string',
            general_ticket_total_fare: 468.2923,
            general_ticket_total_tax: 468.2923,
            merchant_address: 'sample text'
        }        
    }

    await fyle_acc.card_transaction.createCardTransaction(card_transaction);
    common.statusMessage(_fn,"Card transaction created successfully with id: " + card_transaction.id + " !!!");

    common.end_test(_fn);
}



async function test_fyle_api_create_negative_card_transaction()
{
    // Get function name for logging
    const _fn = test_fyle_api_create_negative_card_transaction.name;

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

    const card_transaction = 
    {
        id: "",
        amount: -56.93,
        currency: 'USD',
        spent_at: '2025-12-01T13:14:54.804+00:00',
        post_date: '2025-12-01T13:14:54.804+00:00',
        description: 'AUTOPAY PAYMENT - THANK YOU',
        foreign_currency: 'GBP',
        foreign_amount: 3768,
        code: 'C1234',
        merchant: 'Uber',
        category: 'Travel',
        mcc: 'sample string',
        corporate_card_id: 'baccKD1GXS7rlB',
        metadata:
        {
            merchant_category_code: 'sample string',
            flight_merchant_category_code: 'sample string',
            flight_supplier_name: 'sample string',
            flight_travel_agency_name: 'sample string',
            flight_ticket_number: 'sample string',
            flight_total_fare: 468.2923,
            flight_travel_date: '2020-07-03T18:19:31.193Z',
            flight_service_class: 'sample string',
            flight_carrier_code: 'sample string',
            flight_fare_base_code: 'sample string',
            flight_trip_leg_number: 'sample string',
            hotel_merchant_category_code: 'sample string',
            hotel_supplier_name: 'sample string',
            hotel_checked_in_at: '2020-07-03T18:19:31.193Z',
            hotel_nights: 5,
            hotel_checked_out_at: '2020-07-03T18:19:31.193Z',
            hotel_country: 'sample string',
            hotel_city: 'sample string',
            hotel_total_fare: 468.2923,
            fleet_product_merchant_category_code: 'sample string',
            fleet_product_supplier_name: 'sample string',
            fleet_service_merchant_category_code: 'sample string',
            fleet_service_supplier_name: 'sample string',
            car_rental_merchant_category_code: 'sample string',
            car_rental_supplier_name: 'sample string',
            car_rental_started_at: '2020-07-03T18:19:31.193Z',
            car_rental_days: 5,
            car_rental_ended_at: '2020-07-03T18:19:31.193Z',
            general_ticket_issued_at: '2020-07-03T18:19:31.193Z',
            general_ticket_number: 'sample string',
            general_issuing_carrier: 'sample string',
            general_travel_agency_name: 'sample string',
            general_travel_agency_code: 'sample string',
            general_ticket_total_fare: 468.2923,
            general_ticket_total_tax: 468.2923,
            merchant_address: 'sample text'
        }        
    }

    await fyle_acc.card_transaction.createCardTransaction(card_transaction);
    common.statusMessage(_fn,"Card transaction created successfully with id: " + card_transaction.id + " !!!");

    common.end_test(_fn);
}



async function test_fyle_api_ignore_card_transactions()
{
    // Get function name for logging
    const _fn = test_fyle_api_ignore_card_transactions.name;

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

    const card_transaction_ids = ["btxntvnJZRvQIz"];
    const transaction_list = await fyle_acc.card_transaction.getSelectCardTransactions(card_transaction_ids);
    await fyle_acc.card_transaction.ignoreCardTransactions(transaction_list);
    common.statusMessage(_fn,"Card transactions ignored successfully for ids: " + card_transaction_ids + " !!!");

    common.end_test(_fn);
}


async function test_fyle_api_undo_ignore_card_transactions()
{
    // Get function name for logging
    const _fn = test_fyle_api_undo_ignore_card_transactions.name;

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

    const card_transaction_ids = ["btxntvnJZRvQIz"];
    const transaction_list = await fyle_acc.card_transaction.getSelectCardTransactions(card_transaction_ids);
    await fyle_acc.card_transaction.undoIgnoreCardTransactions(transaction_list);
    common.statusMessage(_fn,"Card transactions undo ignore successfully for ids: " + card_transaction_ids + " !!!");

    common.end_test(_fn);
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


async function test_fyle_api_card_transactions()
{
    // Get function name for logging
    const _fn = test_fyle_api_card_transactions.name;

    common.start_test_suite("Fyle API - Card Transactions");

    if(process.env.RUN_TEST_FYLE_API_GET_CARD_TRANSACTIONS === "true") await test_fyle_api_get_card_transactions();
    if(process.env.RUN_TEST_FYLE_API_GET_SELECT_CARD_TRANSACTIONS === "true") await test_fyle_api_get_select_card_transactions();
    if(process.env.RUN_TEST_FYLE_API_CREATE_CARD_TRANSACTION === "true") await test_fyle_api_create_card_transaction();
    if(process.env.RUN_TEST_FYLE_API_CREATE_NEGATIVE_CARD_TRANSACTION === "true") await test_fyle_api_create_negative_card_transaction();
    if(process.env.RUN_TEST_FYLE_API_IGNORE_CARD_TRANSACTIONS === "true") await test_fyle_api_ignore_card_transactions();
    if(process.env.RUN_TEST_FYLE_API_UNDO_IGNORE_CARD_TRANSACTIONS === "true") await test_fyle_api_undo_ignore_card_transactions();

    common.end_test_suite("Fyle API - Card Transactions");
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// Export the test function
module.exports = 
{
    test_fyle_api_card_transactions
};

