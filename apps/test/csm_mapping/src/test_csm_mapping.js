const csm_mapping = require("@fyle-ops/csm_mapping");
const common = require("@fyle-ops/common");

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function test_csm_mapping_get_fd_name()
{
    // Get function name for logging
    const _fn = test_csm_mapping_get_fd_name.name;

    common.start_test(_fn);

    const email = "hemanth.s@fylehq.com";
    const csm_name = csm_mapping.returnFDCSMNameForEmail(email);
    common.statusMessage(_fn,  "CSM Name for email " , email , " is " , csm_name);

    common.end_test(_fn);
}

async function test_csm_mapping_get_email()
{
    // Get function name for logging
    const _fn = test_csm_mapping_get_email.name;

    common.start_test(_fn);

    const csm_name = "Hemanth Singanamalla";
    const email = csm_mapping.returnEmailForFDCSMName(csm_name);
    common.statusMessage(_fn,  "Email for CSM Name " , csm_name , " is " , email);

    common.end_test(_fn);
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


async function test_csm_mapping()
{
    // Get function name for logging
    const _fn = test_csm_mapping.name;

    common.start_test_suite("CSM Mapping functions");

    if(process.env.RUN_TEST_CSM_MAPPING_GET_FD_NAME === "true") await test_csm_mapping_get_fd_name();
    if(process.env.RUN_TEST_CSM_MAPPING_GET_EMAIL === "true") await test_csm_mapping_get_email();
    
    common.end_test_suite("CSM Mapping functions");
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports =
{
    test_csm_mapping
};