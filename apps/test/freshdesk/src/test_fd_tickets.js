const common = require("@fyle-ops/common");
const { fd_tickets } = require("@fyle-ops/freshdesk");
const { fd_ticket_fields } = require("@fyle-ops/freshdesk");
const { setTicketField } = require("@fyle-ops/freshdesk");

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function test_fd_get_tickets()
{
    // Get the function name for logging
    const fn = test_fd_get_tickets.name;

    common.start_test(fn);
    
    const tickets = new fd_tickets();
    await tickets.getTickets("2026-01-01T00:00:00Z");

    common.statusMessage(fn, "Tickets read successfully !!!. Total tickets read: ", tickets.num_tickets);
    
    common.end_test(fn);
}

async function test_fd_get_ticket_fields()
{
    // Get the function name for logging
    const fn = test_fd_get_ticket_fields.name;

    common.start_test(fn);

    const ticket_fields = new fd_ticket_fields();
    await ticket_fields.getTicketFields();

    const status_val = 15;
    const status_label = await ticket_fields.getTicketStatusVal(status_val);
    common.statusMessage(fn, "Ticket status label for code ", status_val, " is: ", status_label);

    const status_string = "Waiting on Customer";
    const status_code = await ticket_fields.getTicketStatusCode(status_string);
    common.statusMessage(fn, "Ticket status code for label ", status_string, " is: ", status_code);

    const source_val = 7;
    const source_label = await ticket_fields.getTicketSourceVal(source_val);
    common.statusMessage(fn, "Ticket source label for code ", source_val, " is: ", source_label);

    const source_string = "Chat";
    const source_code = await ticket_fields.getTicketSourceCode(source_string);
    common.statusMessage(fn, "Ticket source code for label ", source_string, " is: ", source_code);

    const priority_val = 3;
    const priority_label = await ticket_fields.getTicketPriorityVal(priority_val);
    common.statusMessage(fn, "Ticket priority label for code ", priority_val, " is: ", priority_label);
    
    const priority_string = "Urgent";
    const priority_code = await ticket_fields.getTicketPriorityCode(priority_string);
    common.statusMessage(fn, "Ticket priority code for label ", priority_string, " is: ", priority_code);

    common.statusMessage(fn, "Ticket fields read successfully !!!");

    common.end_test(fn);
}


async function test_fd_set_ticket_data()
{
    // Get the function name for logging
    const fn = test_fd_set_ticket_data.name;

    common.start_test(fn);

    let ret = {};
    const ticket_id = 83222; // promotions ticket
    const responder_id = 9030391174; // Jahaber Sathik
    const due_by = "2026-03-01T12:00:00Z";
    const status = 7; // Waiting on Third Party
    await setTicketField(ticket_id, "responder_id", responder_id, ret);
    await setTicketField(ticket_id, "due_by", due_by, ret);
    await setTicketField(ticket_id, "status", status, ret);

    common.statusMessage(fn, "Ticket fields updated successfully !!!. Updated data: ", ret);

    common.end_test(fn);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function test_fd_tickets()
{
    // Get the function name for logging
    const fn = test_fd_tickets.name;

    common.start_test_suite("Freshdesk Tickets Tests");
    
    if(process.env.RUN_TEST_FD_GET_TICKETS === "true") await test_fd_get_tickets();
    if(process.env.RUN_TEST_FD_GET_TICKET_FIELDS === "true") await test_fd_get_ticket_fields();
    if(process.env.RUN_TEST_FD_SET_TICKET_DATA === "true") await test_fd_set_ticket_data();

    common.end_test_suite("Freshdesk Tickets Tests");
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Export functions
module.exports =
{
    test_fd_tickets
};

