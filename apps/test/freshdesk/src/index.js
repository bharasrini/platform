const path = require("path");

require("dotenv").config({
    //path: path.resolve(__dirname, "..", "..", "env", ".env.freshdesk"),
    path: path.resolve(__dirname, "..", ".env"),
    override: true
});

const { test_fd_agents } = require("./test_fd_agents");
const { test_fd_business_hours } = require("./test_fd_business_hours");
const { test_fd_company } = require("./test_fd_company");
const { test_fd_contacts } = require("./test_fd_contacts");
const { test_fd_groups } = require("./test_fd_groups");
const { test_fd_ratings } = require("./test_fd_ratings");
const { test_fd_tickets } = require("./test_fd_tickets");

async function run_freshdesk_tests()
{
    // Freshdesk functions
    if (process.env.RUN_FD_AGENTS_TEST === "true") await test_fd_agents();
    if (process.env.RUN_FD_BUSINESS_HOURS_TEST === "true") await test_fd_business_hours();
    if (process.env.RUN_FD_COMPANY_TEST === "true") await test_fd_company();
    if (process.env.RUN_FD_CONTACTS_TEST === "true") await test_fd_contacts();
    if (process.env.RUN_FD_GROUPS_TEST === "true") await test_fd_groups();
    if (process.env.RUN_FD_RATINGS_TEST === "true") await test_fd_ratings();
    if (process.env.RUN_FD_TICKETS_TEST === "true") await test_fd_tickets();
    return;
}

module.exports =
{
    run_freshdesk_tests
};