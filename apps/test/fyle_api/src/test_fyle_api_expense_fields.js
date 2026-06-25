const { fyle_account } = require("@fyle-ops/fyle_api");
const common = require("@fyle-ops/common");

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



async function test_fyle_api_get_expense_fields()
{
    // Get function name for logging
    const _fn = test_fyle_api_get_expense_fields.name;

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

    await fyle_acc.expense_field.getExpenseFields(null, null, null);
    common.statusMessage(_fn,"Expense fields retrieved successfully !!!. Number of expense fields retrieved: " + fyle_acc.expense_fields.num_expense_fields);

    common.end_test(_fn);
}



async function test_fyle_api_get_named_expense_field()
{
    // Get function name for logging
    const _fn = test_fyle_api_get_named_expense_field.name;

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

    let ret = {};
    const field_name = "Project";
    await fyle_acc.expense_field.getNamedExpenseField(field_name, ret);
    if(ret.data)
    {
        common.statusMessage(_fn,"Named expense field " , field_name , " retrieved successfully !!!");
        common.statusMessage(_fn,"Expense Field details for " , field_name , " :" , JSON.stringify(ret.data));
    }
    else
    {
        common.statusMessage(_fn,"Expense field with name " , field_name , " not found");
    }
    
    common.end_test(_fn);
}


async function test_fyle_api_set_expense_field()
{
    // Get function name for logging
    const _fn = test_fyle_api_set_expense_field.name;

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

    let ret = {};
    const field_name = "Onward Travel Class";
    await fyle_acc.expense_field.getNamedExpenseField(field_name, ret);
    if(ret.data)
    {
        common.statusMessage(_fn,"Named expense field " + field_name + " retrieved successfully !!!");
        common.statusMessage(_fn,"Expense Field details for " , field_name , " :" , JSON.stringify(ret.data));
        
        const id = ret.data.id;
        const new_field_name = "Onward Travel Class New";
        const type = ret.data.type;
        const options = ["Economy", "Premium Economy", "Business", "First", "Other"];
        const default_value = "Business";
        const is_enabled = true;
        const is_mandatory = true;
        await fyle_acc.expense_field.setExpenseField(id, new_field_name, type, options, default_value, is_enabled, is_mandatory);
        common.statusMessage(_fn,"Expense fields updated successfully !!!");
    }
    else
    {
        common.statusMessage(_fn,"Expense field with name " , field_name , " not found");
    }

    common.end_test(_fn);
}



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


async function test_fyle_api_expense_fields()
{
    // Get function name for logging
    const _fn = test_fyle_api_expense_fields.name;

    common.start_test_suite("Fyle API - Expense Fields");

    if(process.env.RUN_TEST_FYLE_API_GET_EXPENSE_FIELDS === "true") await test_fyle_api_get_expense_fields();
    if(process.env.RUN_TEST_FYLE_API_GET_NAMED_EXPENSE_FIELDS === "true") await test_fyle_api_get_named_expense_field();
    if(process.env.RUN_TEST_FYLE_API_SET_EXPENSE_FIELD === "true") await test_fyle_api_set_expense_field();

    common.end_test_suite("Fyle API - Expense Fields");
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// Export the test function
module.exports = 
{
    test_fyle_api_expense_fields
};

