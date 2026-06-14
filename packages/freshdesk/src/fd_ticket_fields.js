const common = require("@fyle-ops/common");
const { fetchFreshdeskData } = require("./fd_common");

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////// FUNCTIONS ////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Class to manage the Freshdesk ticket fields. 
class fd_ticket_fields
{
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////// CLASS VARIABLES ///////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // Array to store the list of ticket fields
    ticket_fields_list = [];

    // Number of ticket fields
    num_ticket_fields = 0;

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////// CLASS FUNCTIONS ///////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    constructor()
    {
        _initTicketFields(this);
    }

    async getTicketFields()
    {
        return await _getTicketFields(this);
    }

    async getTicketStatusCode(label)
    {
        return await _getTicketStatusCode(this, label);
    }

    async getTicketStatusVal(code)
    {
        return await _getTicketStatusVal(this, code);
    }

    async getTicketSourceCode(label)
    {
        return await _getTicketSourceCode(this, label);
    }

    async getTicketSourceVal(code)
    {
        return await _getTicketSourceVal(this, code);
    }

    async getTicketPriorityCode(label)
    {
        return await _getTicketPriorityCode(this, label);
    }

    async getTicketPriorityVal(code)
    {
        return await _getTicketPriorityVal(this, code);
    }
}



/* 
Function: _initTicketFields
Purpose: Initializes the Freshdesk 'ticket fields' functionality
Inputs: Freshdesk ticket fields instance
Output: 0 on success, -1 on failure
*/
function _initTicketFields(ticket_fields)
{
    // Get the function name for logging
    const fn = _initTicketFields.name;

    // Nothing else to do, return success
    return 0;
}


/* 
Function: _getTicketFields
Purpose: Gets the list of all ticket fields from Freshdesk
Inputs: ticket_fields instance
Output: Returns 0 on success, -1 on failure
*/
async function _getTicketFields(ticket_fields)
{
    // Get the function name for logging
    const fn = _getTicketFields.name;

    // URL path for the API endpoint to get the list of ticket fields
    const url_path = process.env.FRESHDESK_TICKET_FIELDS_URL_PATH;

    // Fetch data for the current page
    try
    {
        const {headers,data} = await fetchFreshdeskData(
        {
            url_path: url_path,
            current_page: null,
            per_page: null,
            updated_since: null,
            include: null
        });

        for(let i = 0; i < data.length; i++)
        {
            ticket_fields.ticket_fields_list.push(data[i]);
            ticket_fields.num_ticket_fields++;
        }

        // set a sleep here for 100 ms so that we don't exceed the throttle
        await common.sleep(100);

    }
    catch(e)
    {
        common.statusMessage(fn, "Failed to get list of Ticket Fields. Error:" , e.message);
        return -1;
    }

    common.statusMessage(fn, "Successfully fetched ticket fields. Number of ticket fields = " , ticket_fields.num_ticket_fields);
    
    return 0;
}



/* 
Function: getTicketFieldData
Purpose: Gets the data for a specific ticket field from Freshdesk
Inputs: ticket_fields - instance of the ticket fields class
        field_name - name of the ticket field to retrieve data for
        field_data - array to be populated with the ticket field data
Output: Returns 0 on success, -1 on failure
*/
async function getTicketFieldData(ticket_fields, field_name, field_data)
{
    // Get the function name for logging
    const fn = getTicketFieldData.name;
    
    // If we don't have the ticket fields list built, build it first
    if(ticket_fields.ticket_fields_list.length == 0)
    {
        common.statusMessage(fn, "Ticket Fields List is empty, let's build this");
        await _getTicketFields(ticket_fields);
    }

    // Locate the field that we are interested in
    let field_id = -1;

    // Check if we have a field that matches the field_name sent in
    for(let i = 0; i < ticket_fields.ticket_fields_list.length; i++)
    {
        if(ticket_fields.ticket_fields_list[i].name == field_name)
        {
            field_id = ticket_fields.ticket_fields_list[i].id;
            break;
        }
    }

    // If we don't have a matching field, return an error
    if(field_id < 0)
    {
        common.statusMessage(fn, "Failed to get the id for ticket field: " , field_name);
        return -1;
    }

    // Now read the data for the field using the field id and populate the field_data array
    const url_path = process.env.FRESHDESK_TICKET_FIELDS_URL_PATH + "/" + field_id;

    // Initialize the page and record count
    // Fetch data for the current page
    try
    {
        const {headers,data} = await fetchFreshdeskData(
        {
            url_path: url_path,
            current_page: null,
            per_page: null,
            updated_since: null,
            include: null
        });

        field_data.push(data);
        
        // set a sleep here for 100 ms so that we don't exceed the throttle
        await common.sleep(100);
    }
    catch(e)
    {
        common.statusMessage(fn, "Failed to get ticket fields for: " , field_name , ". Error:" , e.message);
        return -1;
    }
    
    common.statusMessage(fn, "Successfully retrieved field data for " , field_name);
    
    return 0;
}



/* 
Function: getTicketFieldOptions
Purpose: Gets the options for a specific ticket field from Freshdesk. This is relevant for dropdown type fields where we have to map the option id to the option name
Inputs: ticket_fields - instance of the ticket fields class
        field_name - name of the ticket field to retrieve options for
        options - array to be populated with the options for the ticket field. This will be an array of objects with id and name as keys
Output: Returns 0 on success, -1 on failure
*/
async function getTicketFieldOptions(ticket_fields, field_name, options)
{
    // Get the function name for logging
    const fn = getTicketFieldOptions.name;
    
    // Initialize an array to hold the field data for the field that we are interested in
    const field_data = [];

    // Get the field data for the field that we are interested in
    if(await getTicketFieldData(ticket_fields, field_name, field_data) < 0)
    {
        common.statusMessage(fn, "Failed to get ticket field data for: " , field_name);
        return -1;
    }

    // Check that there are choices available in the field data
    const this_field_data = field_data[0];
    if(!this_field_data.choices)
    {
        common.statusMessage(fn, "Failed to locate choices in field data for: " , field_name);
        return -1;
    }

    for(let i = 0; i < this_field_data.choices.length; i++)
    {
        options.push(this_field_data.choices[i]);
    }

    return 0;
}




////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Array to hold the options for the status field. We will populate this when we read the status field data from Freshdesk and then use this to map status codes to status values and vice versa
let ticket_status_options = [];

/* 
Function: getStatusOptions
Purpose: Returns the options for the status field in Freshdesk
Inputs: Ticket fields instance
Output: None (populates the global ticket_status_options array)
*/
async function getStatusOptions(ticket_fields)
{
    // Get the function name for logging
    const fn = getStatusOptions.name;

    // Get the options for the status field and populate the ticket_status_options array
    await getTicketFieldOptions(ticket_fields, "status", ticket_status_options);
    return;
}

/* 
Function: _getTicketStatusVal
Purpose: Returns the ticket status value associated with the status id/code passed in
Inputs: ticket_fields - instance of the ticket fields class
        status code (number)
Output: status value (string)
*/
async function _getTicketStatusVal(ticket_fields, code)
{
    // Get the function name for logging
    const fn = _getTicketStatusVal.name;
    
    // If we don't have the options list built, build it first
    if(ticket_status_options.length == 0)
    {
        common.statusMessage(fn, "Status Options List is empty, let's build this");
        await getStatusOptions(ticket_fields);
    }

    // Loop through the options list and return the value for the code sent in
    for(let i = 0; i < ticket_status_options.length; i++)
    {
        if(ticket_status_options[i].id == code) return ticket_status_options[i].label;
    }

    // If we don't find a match, return the value for the default status which is "Open"
    return "Open";
}


/* 
Function: _getTicketStatusCode
Purpose: Returns the ticket status code associated with the status value passed in
Inputs: ticket_fields - instance of the ticket fields class
        label - status value (string)
Output: status code (number)
*/
async function _getTicketStatusCode(ticket_fields, label)
{
    // Get the function name for logging
    const fn = _getTicketStatusCode.name;
    
    // If we don't have the options list built, build it first
    if(ticket_status_options.length == 0)
    {
        common.statusMessage(fn, "Status Options List is empty, let's build this");
        await getStatusOptions(ticket_fields);
    }

    // Loop through the options list and return the value for the label sent in
    for(let i = 0; i < ticket_status_options.length; i++)
    {
        if(ticket_status_options[i].label == label) return ticket_status_options[i].id;
    }

    // If we don't find a match, return the code for the default status which is "Open"
    return 2; // "Open"
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// Array to hold the options for the source field. We will populate this when we read the source field data from Freshdesk and then use this to map source codes to source values and vice versa
let ticket_source_options = [];

/* 
Function: getSourceOptions
Purpose: Returns the options for the source field in Freshdesk
Inputs: Ticket fields instance
Output: None (populates the global ticket_source_options array)
*/
async function getSourceOptions(ticket_fields)
{
    // Get the function name for logging
    const fn = getSourceOptions.name;

    await getTicketFieldOptions(ticket_fields, "source", ticket_source_options);
    return;
}


/* 
Function: getTicketSourceVal
Purpose: Returns the ticket source value associated with the source code passed in
Inputs: ticket_fields - instance of the ticket fields class
        source code (number)
Output: source value (string)
*/
async function _getTicketSourceVal(ticket_fields, code)
{
    // Get the function name for logging
    const fn = _getTicketSourceVal.name;

    // If we don't have the options list built, build it first
    if(ticket_source_options.length == 0)
    {
        common.statusMessage(fn, "Source Options List is empty, let's build this");
        await getSourceOptions(ticket_fields);
    }

    // Loop through the options list and return the value for the code sent in
    for(let i = 0; i < ticket_source_options.length; i++)
    {
        if(ticket_source_options[i].id == code) return ticket_source_options[i].label;
    }

    // If we don't find a match, return the value for the default source which is "Email"
    return "Email";
}


/* 
Function: _getTicketSourceCode
Purpose: Returns the ticket source code associated with the source value passed in
Inputs: ticket_fields - instance of the ticket fields class
        source value (string)
Output: source code (number)
*/
async function _getTicketSourceCode(ticket_fields, label)
{
    // Get the function name for logging
    const fn = _getTicketSourceCode.name;

    // If we don't have the options list built, build it first
    if(ticket_source_options.length == 0)
    {
        common.statusMessage(fn, "Source Options List is empty, let's build this");
        await getSourceOptions(ticket_fields);
    }

    // Loop through the options list and return the code for the label sent in
    for(let i = 0; i < ticket_source_options.length; i++)
    {
        if(ticket_source_options[i].label == label) return ticket_source_options[i].id;
    }

    return 1; // "Email"
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// Array to hold the options for the priority field. We will populate this when we read the priority field data from Freshdesk and then use this to map priority codes to priority values and vice versa
let ticket_priority_options = [];


/* 
Function: getPriorityOptions
Purpose: Returns the options for the priority field in Freshdesk
Inputs: Ticket fields instance
Output: None (populates the global ticket_priority_options array)
*/
async function getPriorityOptions(ticket_fields)
{
    // Get the function name for logging
    const fn = getPriorityOptions.name;
    
    await getTicketFieldOptions(ticket_fields, "priority", ticket_priority_options);
    return;
}


/* 
Function: getTicketPriorityVal
Purpose: Returns the ticket priority value associated with the code passed in
Inputs: ticket_fields - instance of the ticket fields class
        code (number)
Output: value (string)
*/
async function _getTicketPriorityVal(ticket_fields, code)
{
    // Get the function name for logging
    const fn = _getTicketPriorityVal.name;

    // If we don't have the options list built, build it first
    if(ticket_priority_options.length == 0)
    {
        common.statusMessage(fn, "Priority Options List is empty, let's build this");
        await getPriorityOptions(ticket_fields);
    }

    // Loop through the options list and return the value for the code sent in
    for(let i = 0; i < ticket_priority_options.length; i++)
    {
        if(ticket_priority_options[i].value == code) return ticket_priority_options[i].label;
    }

    return "Low";
}



/* 
Function: _getTicketPriorityCode
Purpose: Returns the ticket priority code associated with the label passed in
Inputs: ticket_fields - instance of the ticket fields class
        label (string)
Output: code (number)
*/
async function _getTicketPriorityCode(ticket_fields, label)
{
    // Get the function name for logging
    const fn = _getTicketPriorityCode.name;
    
    // If we don't have the options list built, build it first
    if(ticket_priority_options.length == 0)
    {
        common.statusMessage(fn, "Priority Options List is empty, let's build this");
        await getPriorityOptions(ticket_fields);
    }

    // Loop through the options list and return the code for the label sent in
    for(let i = 0; i < ticket_priority_options.length; i++)
    {
        if(ticket_priority_options[i].label == label) return ticket_priority_options[i].value;
    }

    return 0; // "Low"
}


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////// EXPORTS /////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Exporting the class and other functions
module.exports = 
{
    fd_ticket_fields,
};

