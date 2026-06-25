const { formatInTimeZone } = require("date-fns-tz");
const common = require("@fyle-ops/common");
const { fd_tickets, fd_group, fd_company, fd_agent, fd_business_hours, fd_ticket_fields, fd_ratings, fd_email_config } = require("@fyle-ops/freshdesk");



/*
Function: fd_write_ticket_data
Purpose: Writes FD ticket data to a Google Sheet
Inputs: account, file_name
Output: 0 on success, -1 on failure
*/
async function fd_write_ticket_data(ticket, file_name)
{
    // Get the function name for logging purposes
    const _fn = fd_write_ticket_data.name;

    return await common.GoogleSheet_filterAndWriteDataToGoogleSheet(
        process.env.FRESHDESK_DATA_BACKUP_FOLDER_ID, 
        file_name, 
        process.env.FRESHDESK_DATA_BACKUP_TICKETS_SHEET_NAME, 
        ticket.ticket_list, 
        null, 
        null
    );
}


/*
Function: fd_write_group_data
Purpose: Writes FD group data to a Google Sheet
Inputs: account, file_name
Output: 0 on success, -1 on failure
*/
async function fd_write_group_data(group, file_name)
{
    // Get the function name for logging purposes
    const _fn = fd_write_group_data.name;

    return await common.GoogleSheet_filterAndWriteDataToGoogleSheet(
        process.env.FRESHDESK_DATA_BACKUP_FOLDER_ID, 
        file_name, 
        process.env.FRESHDESK_DATA_BACKUP_GROUPS_SHEET_NAME, 
        group.group_list, 
        null, 
        null
    );
}


/*
Function: fd_write_company_data
Purpose: Writes FD company data to a Google Sheet
Inputs: account, file_name
Output: 0 on success, -1 on failure
*/
async function fd_write_company_data(company, file_name)
{
    // Get the function name for logging purposes
    const _fn = fd_write_company_data.name;

    return await common.GoogleSheet_filterAndWriteDataToGoogleSheet(
        process.env.FRESHDESK_DATA_BACKUP_FOLDER_ID, 
        file_name, 
        process.env.FRESHDESK_DATA_BACKUP_COMPANIES_SHEET_NAME, 
        company.company_list, 
        null, 
        null
    );
}


/*
Function: fd_write_agent_data
Purpose: Writes FD agent data to a Google Sheet
Inputs: account, file_name
Output: 0 on success, -1 on failure
*/
async function fd_write_agent_data(agent, file_name)
{
    // Get the function name for logging purposes
    const _fn = fd_write_agent_data.name;

    return await common.GoogleSheet_filterAndWriteDataToGoogleSheet(
        process.env.FRESHDESK_DATA_BACKUP_FOLDER_ID, 
        file_name, 
        process.env.FRESHDESK_DATA_BACKUP_AGENTS_SHEET_NAME, 
        agent.agent_list, 
        null, 
        null
    );
}


/*
Function: fd_write_business_hours_data
Purpose: Writes FD business hours data to a Google Sheet
Inputs: account, file_name
Output: 0 on success, -1 on failure
*/
async function fd_write_business_hours_data(business_hours, file_name)
{
    // Get the function name for logging purposes
    const _fn = fd_write_business_hours_data.name;

    return await common.GoogleSheet_filterAndWriteDataToGoogleSheet(
        process.env.FRESHDESK_DATA_BACKUP_FOLDER_ID, 
        file_name, 
        process.env.FRESHDESK_DATA_BACKUP_BUSINESS_HOURS_SHEET_NAME, 
        business_hours.business_hours_list, 
        null, 
        null
    );
}


/*
Function: fd_write_ticket_fields_data
Purpose: Writes FD ticket fields data to a Google Sheet
Inputs: account, file_name
Output: 0 on success, -1 on failure
*/
async function fd_write_ticket_fields_data(ticket_fields, file_name)
{
    // Get the function name for logging purposes
    const _fn = fd_write_ticket_fields_data.name;

    return await common.GoogleSheet_filterAndWriteDataToGoogleSheet(
        process.env.FRESHDESK_DATA_BACKUP_FOLDER_ID, 
        file_name, 
        process.env.FRESHDESK_DATA_BACKUP_TICKET_FIELDS_SHEET_NAME, 
        ticket_fields.ticket_fields_list, 
        null, 
        null
    );
}


/*
Function: fd_write_ratings_data
Purpose: Writes FD ratings data to a Google Sheet
Inputs: account, file_name
Output: 0 on success, -1 on failure
*/
async function fd_write_ratings_data(ratings, file_name)
{
    // Get the function name for logging purposes
    const _fn = fd_write_ratings_data.name;

    return await common.GoogleSheet_filterAndWriteDataToGoogleSheet(
        process.env.FRESHDESK_DATA_BACKUP_FOLDER_ID, 
        file_name, 
        process.env.FRESHDESK_DATA_BACKUP_RATINGS_SHEET_NAME, 
        ratings.ratings_list, 
        null, 
        null
    );
}


/*
Function: fd_write_email_config_data
Purpose: Writes FD email config data to a Google Sheet
Inputs: account, file_name
Output: 0 on success, -1 on failure
*/
async function fd_write_email_config_data(email_config, file_name)
{
    // Get the function name for logging purposes
    const _fn = fd_write_email_config_data.name;

    return await common.GoogleSheet_filterAndWriteDataToGoogleSheet(
        process.env.FRESHDESK_DATA_BACKUP_FOLDER_ID, 
        file_name, 
        process.env.FRESHDESK_DATA_BACKUP_EMAIL_CONFIG_SHEET_NAME, 
        email_config.email_config_list, 
        null, 
        null
    );
}

/*
Function: takeFreshdeskBackup
Purpose: Takes a backup of Freshdesk data
Inputs: none
Output: 0 on success, -1 on failure
*/
async function takeFreshdeskBackup()
{
    // Get the function name for logging purposes
    const _fn = takeFreshdeskBackup.name;

    common.statusMessage(_fn, " ****************** Freshdesk Backup Start ****************** ");

    // Get all tickets for the last 3 months
    const three_months = 3;
    const dateObj = new Date();
    const three_months_ago = common.getNMonthsAgo(dateObj, three_months);
    const since_str = formatInTimeZone(three_months_ago, "UTC", "yyyy-MM-dd");
    const ticket = new fd_tickets();
    await ticket.getTickets(since_str);
    common.statusMessage(_fn, "Successfully retrieved tickets data since ", since_str, ", going to get Groups data");

    // Get list of all groups
    const group = new fd_group();
    await group.getGroups();
    common.statusMessage(_fn, "Successfully retrieved Groups data, going to get Companies data");

    // Get list of all companies
    const company = new fd_company();
    await company.getCompanies();
    common.statusMessage(_fn, "Successfully retrieved Companies data, going to get Agents data");

    // Get list of all agents    
    const agent = new fd_agent();
    await agent.getAgents();
    common.statusMessage(_fn, "Successfully retrieved Agents data, going to get Business hours data");

    // Get list of all business hours
    const business_hours = new fd_business_hours();
    await business_hours.getBusinessHours();
    common.statusMessage(_fn, "Successfully retrieved Business hours data, going to get Ticket Fields data");

    const ticket_fields = new fd_ticket_fields();
    await ticket_fields.getTicketFields();
    common.statusMessage(_fn, "Successfully retrieved Ticket fields data, going to get Ratings data");

    const ratings = new fd_ratings();
    await ratings.getRatings(since_str);
    common.statusMessage(_fn, "Successfully retrieved Ratings data, going to get Email Config data");

    const email_config = new fd_email_config();
    await email_config.getEmailConfigs();
    common.statusMessage(_fn, "Successfully retrieved Email Config data, going to write out data to google sheet");

    // Create a new file every day in the My Drive -> Tooling -> Freshdesk -> Data Backup folder
    const today_date = formatInTimeZone(new Date(), "UTC", "yyyy-MM-dd");
    const file_name = process.env.FRESHDESK_DATA_BACKUP_FILE_PREFIX + today_date;
    
    // Write out the ticket data to the sheet
    await fd_write_ticket_data(ticket, file_name);
    common.statusMessage(_fn, "Successfully wrote 'Ticket' data, going to write 'Groups' data");
    
    // Write out Group details
    await fd_write_group_data(group, file_name);
    common.statusMessage(_fn, "Successfully wrote 'Groups' details, going to write 'Companies' details");

    // Write out company details
    await fd_write_company_data(company, file_name);
    common.statusMessage(_fn, "Successfully wrote 'Companies' details, going to write 'Agents' details");

    // Write out agent details
    await fd_write_agent_data(agent, file_name);
    common.statusMessage(_fn, "Successfully wrote 'Agents' details, going to write 'Business Hours' details");

    // Write out business hours details
    await fd_write_business_hours_data(business_hours, file_name);
    common.statusMessage(_fn, "Successfully wrote 'Business Hours' details, going to write 'Ticket Fields' details");

    // Write out ticket fields details
    await fd_write_ticket_fields_data(ticket_fields, file_name);
    common.statusMessage(_fn, "Successfully wrote 'Ticket Fields' details, going to write 'Ratings' details");

    // Write out ratings details
    await fd_write_ratings_data(ratings, file_name);
    common.statusMessage(_fn, "Successfully wrote 'Ratings' details, going to write 'Email Config' details");

    // Write out email config details
    await fd_write_email_config_data(email_config, file_name);
    common.statusMessage(_fn, "Successfully wrote 'Email Config' details, going to cleanup and exit");

    // Delete "Sheet1" that was created by default in the backup sheet
    const folder_id = process.env.FRESHDESK_DATA_BACKUP_FOLDER_ID;
    const sheet_to_delete = process.env.FRESHDESK_DATA_BACKUP_DEFAULT_SHEET_TO_DELETE;
    await common.GoogleSheet_deleteSheetInGoogleSpreadsheet(folder_id, file_name, sheet_to_delete);

    common.statusMessage(_fn, " ****************** Freshdesk Backup End ****************** ");

    return;
}


module.exports =
{
    takeFreshdeskBackup
}
