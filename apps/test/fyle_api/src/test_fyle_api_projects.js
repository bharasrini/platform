const { fyle_account } = require("@fyle-ops/fyle_api");
const common = require("@fyle-ops/common");

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


async function test_fyle_api_get_projects()
{
    // Get function name for logging
    const fn = test_fyle_api_get_projects.name;

    common.start_test(fn);

    // Account details - org ID: "or8TuR1VLwUj", org name: "Training Account", user email: "ashwathi.vinod@fyle.in"
    const client_id_str = "tpagISVKxnQMr";
    const client_secret_str = "zJYzCG9O4J";
    const refresh_token_str = "eyJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE3Mzk4NTgxMzEsImlzcyI6IkZ5bGVBcHAiLCJvcmdfdXNlcl9pZCI6Ilwib3UzYnVRdFphdGIxXCIiLCJ0cGFfaWQiOiJcInRwYWdJU1ZLeG5RTXJcIiIsInRwYV9uYW1lIjoiXCJDYXJkIFRyYW5zYWN0aW8uLlwiIiwiY2x1c3Rlcl9kb21haW4iOiJcImh0dHBzOi8vaW4xLmZ5bGVocS5jb21cIiIsImV4cCI6MjA1NTIxODEzMX0.VPNQ9P93kihD03p3-j_npcidd3TywOQ_6JAhXaZe6cQ";

    const fyle_acc = new fyle_account();

    await fyle_acc.auth.getAccessToken(client_id_str, client_secret_str, refresh_token_str);
    await fyle_acc.auth.getClusterEndpoint();
    await fyle_acc.auth.validateClusterEndpoint();
    common.statusMessage(fn,"Authentication successful !!!");

    await fyle_acc.project.getProjects();
    common.statusMessage(fn,"Projects retrieved successfully !!!. Number of projects retrieved: " + fyle_acc.projects.num_projects);

    common.end_test(fn);
}

async function test_fyle_api_add_projects()
{
    // Get function name for logging
    const fn = test_fyle_api_add_projects.name;

    common.start_test(fn);

    // Account details - org ID: "or8TuR1VLwUj", org name: "Training Account", user email: "ashwathi.vinod@fyle.in"
    const client_id_str = "tpagISVKxnQMr";
    const client_secret_str = "zJYzCG9O4J";
    const refresh_token_str = "eyJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE3Mzk4NTgxMzEsImlzcyI6IkZ5bGVBcHAiLCJvcmdfdXNlcl9pZCI6Ilwib3UzYnVRdFphdGIxXCIiLCJ0cGFfaWQiOiJcInRwYWdJU1ZLeG5RTXJcIiIsInRwYV9uYW1lIjoiXCJDYXJkIFRyYW5zYWN0aW8uLlwiIiwiY2x1c3Rlcl9kb21haW4iOiJcImh0dHBzOi8vaW4xLmZ5bGVocS5jb21cIiIsImV4cCI6MjA1NTIxODEzMX0.VPNQ9P93kihD03p3-j_npcidd3TywOQ_6JAhXaZe6cQ";

    const fyle_acc = new fyle_account();

    await fyle_acc.auth.getAccessToken(client_id_str, client_secret_str, refresh_token_str);
    await fyle_acc.auth.getClusterEndpoint();
    await fyle_acc.auth.validateClusterEndpoint();
    common.statusMessage(fn,"Authentication successful !!!");

    const projects_list = 
    [
        {"name": "Test Project 1", "is_enabled": true},
        {"name": "Test Project 2", "is_enabled": true},
        {"name": "Test Project 3", "is_enabled": false}
    ];

    await fyle_acc.project.addProjects(projects_list);
    common.statusMessage(fn,"Projects added successfully !!!. Number of projects added: " + projects_list.length);

    common.end_test(fn);
}


async function test_fyle_api_get_project_id()
{
    // Get function name for logging
    const fn = test_fyle_api_get_project_id.name;

    common.start_test(fn);

    // Account details - org ID: "or8TuR1VLwUj", org name: "Training Account", user email: "ashwathi.vinod@fyle.in"
    const client_id_str = "tpagISVKxnQMr";
    const client_secret_str = "zJYzCG9O4J";
    const refresh_token_str = "eyJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE3Mzk4NTgxMzEsImlzcyI6IkZ5bGVBcHAiLCJvcmdfdXNlcl9pZCI6Ilwib3UzYnVRdFphdGIxXCIiLCJ0cGFfaWQiOiJcInRwYWdJU1ZLeG5RTXJcIiIsInRwYV9uYW1lIjoiXCJDYXJkIFRyYW5zYWN0aW8uLlwiIiwiY2x1c3Rlcl9kb21haW4iOiJcImh0dHBzOi8vaW4xLmZ5bGVocS5jb21cIiIsImV4cCI6MjA1NTIxODEzMX0.VPNQ9P93kihD03p3-j_npcidd3TywOQ_6JAhXaZe6cQ";

    const fyle_acc = new fyle_account();

    await fyle_acc.auth.getAccessToken(client_id_str, client_secret_str, refresh_token_str);
    await fyle_acc.auth.getClusterEndpoint();
    await fyle_acc.auth.validateClusterEndpoint();
    common.statusMessage(fn,"Authentication successful !!!");

    // Get the list of projects
    await fyle_acc.project.getProjects();

    const project_name = "Test Project 1";
    const project_id = fyle_acc.project.getProjectId(project_name);
    if(project_id < 0)
    {
        common.statusMessage(fn,"Failed to get project ID for name = " , project_name);
    }
    else
    {
        common.statusMessage(fn,"Project ID retrieved successfully for name = " , project_name , ". Project ID = " , project_id);
    }

    common.end_test(fn);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


async function test_fyle_api_projects()
{
    // Get function name for logging
    const fn = test_fyle_api_projects.name;

    common.start_test_suite("Fyle API - Projects");

    if(process.env.RUN_TEST_FYLE_API_GET_PROJECTS === "true") await test_fyle_api_get_projects();
    if(process.env.RUN_TEST_FYLE_API_ADD_PROJECTS === "true") await test_fyle_api_add_projects();
    if(process.env.RUN_TEST_FYLE_API_GET_PROJECT_ID === "true") await test_fyle_api_get_project_id();

    common.end_test_suite("Fyle API - Projects");
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// Export the test function
module.exports = 
{
    test_fyle_api_projects
};

