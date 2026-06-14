const path = require("path");

require("dotenv").config({
    path: path.resolve(__dirname, "..", ".env"),
    override: true
});

const { test_csm_mapping } = require("./test_csm_mapping");

async function run_csm_mapping_tests() 
{
    if (process.env.RUN_CSM_MAPPING_TEST === "true") await test_csm_mapping();
    return;
};

module.exports =
{
    run_csm_mapping_tests
};
