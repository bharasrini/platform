const common = require("@fyle-ops/common");
const { fetchFreshdeskData, postFreshdeskData, putFreshdeskData } = require('./fd_common');

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////// FUNCTIONS ////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// Class to manage contacts in Freshdesk
class fd_contacts
{
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////// CLASS VARIABLES ///////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // Array to store the contact list
    contact_list = [];

    // Number of contacts
    num_contacts = 0;
    
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////// CLASS FUNCTIONS ///////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    constructor()
    {
      _initContacts(this);
    }

    async getContacts()
    {
        return await _getContacts(this);
    }

    getContactForEmail(email)
    {
        return _getContactForEmail(this, email);
    }

    getContactForID(id)
    {
        return _getContactForID(this, id);
    }
}


/* 
Function: _initContacts
Purpose: Initializes the contact structure to store the contact information
Inputs: contact variable
Output: 0 on success, -1 on failure
*/
function _initContacts(contact)
{
    // Get the function name for logging
    const fn = _initContacts.name;

    // Nothing else to do, return success
    return 0;

}



/* 
Function: _getContacts
Purpose: Gets the list of all contacts from Freshdesk
Inputs: contact instance
Output: List of contacts stored in contact.contact_list[]. Returns 0 on success, -1 on failure
*/
async function _getContacts(contact)
{
    // Get the function name for logging
    const fn = _getContacts.name;

    // URL path for fetching contacts
    const url_path = process.env.FRESHDESK_CONTACTS_URL_PATH;

    // Initialize the page and record count
    let page = Number(process.env.FRESHDESK_START_PAGE);
    const per_page = Number(process.env.FRESHDESK_MAX_CONTACTS_PER_PAGE);
    let link = "";

    do
    {
        try
        {
            // Fetch data for the current page
            const {headers,data} = await fetchFreshdeskData(
            {
                url_path: url_path,
                current_page: page,
                per_page: per_page,
                updated_since: null,
                include: null
            });

            // Check if we have a link header for pagination
            link = headers.get("link");
            link = (link   ?? "").toString().trim();

            // Load all contacts received in this response to the contact_list []
            for(let i = 0; i < data.length; i++)
            {
                const contact_info = 
                {
                    "id": data[i]["id"] ? data[i]["id"] : "",
                    "name": data[i]["name"] ? data[i]["name"] : "",
                    "email": data[i]["email"] ? data[i]["email"] : "",
                    "role": data[i].custom_fields && data[i].custom_fields["role"] ? data[i].custom_fields["role"] : ""
                };

                contact.contact_list.push(contact_info);

                // Increment counter
                contact.num_contacts++
            }

            if(link)
            {
                page++;
            }
    /*
            if((page % 5) == 0)
            {
                common.statusMessage(fn, "Processing page: ", page, ", contacts processed: ", contact.num_contacts);
            }
    */
            // set a sleep here for 100 ms so that we don't exceed the throttle
            await common.sleep(100);
        }
        catch(e)
        {
            common.statusMessage(fn, "Failed to get list of contacts. Error:", e.message);
            return -1;
        }

    }while(link);

    common.statusMessage(fn, "Successfully fetched contacts. Number of contacts = ", contact.num_contacts);

    return 0;
}




/* 
Function: _getContactForEmail
Purpose: Gets the contact information for the email passed in. Pre-requisite: getContacts () to be run prior 
Inputs: contact instance, email
Output: Contact offset in contact.contact_list[] on success, -1 on failure
*/
function _getContactForEmail(contact, email)
{
    // Get the function name for logging
    const fn = _getContactForEmail.name;
    
    // Sanity check
    if(email == "")
    {
        common.statusMessage(fn, "Invalid email ID passed in ..");
        return -1;
    }

    // Check if there are contacts in the contact list
    if(contact.contact_list.length == 0)
    {
        common.statusMessage(fn, "No contacts, getContacts() to be run prior ..");
        return -1;
    }

    // Loop through the contact list and find the contact with the email ID passed in
    for(let i = 0; i < contact.contact_list.length; i++)
    {
        const this_email = contact.contact_list[i].email;

        if(this_email == email)
        {
            return i;
        }
    }

    // If we are here, we did not get a match. Return failure
    return -1;

}



/* 
Function: _getContactForID
Purpose: Gets the contact information for the ID passed in. Pre-requisite: getContacts () to be run prior 
Inputs: contact instance, id
Output: Contact offset in contact.contact_list[] on success, -1 on failure
*/
function _getContactForID(contact, id)
{
    // Get the function name for logging
    const fn = _getContactForID.name;
    
    // Sanity check
    if(id == "")
    {
        common.statusMessage(fn, "Invalid ID passed in ..");
        return -1;
    }

    // Check if there are contacts in the contact list
    if(contact.contact_list.length == 0)
    {
        common.statusMessage(fn, "No contacts, getContacts() to be run prior ..");
        return -1;
    }

    // Loop through the contact list and find the contact with the ID passed in
    for(let i = 0; i < contact.contact_list.length; i++)
    {
        const this_id = contact.contact_list[i].id;

        if(this_id == id)
        {
            return i;
        }
    }

    // If we are here, we did not get a match. Return failure
    return -1;
}



/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////



/* 
Function: addContact
Purpose: Adds the contact for which the name, email and role is passed in. Pre-requisite: getContacts () to be run prior 
Inputs: name, email, role
Output: Returns offset to the added contact on success, -1 on failure
*/
async function addContact(name, email, role)
{
    // Get the function name for logging
    const fn = addContact.name;
    
    // Sanity check
    if(email == "")
    {
        common.statusMessage(fn, "Invalid email passed in ..");
        return -1;
    }

    // Path to set contact data
    const url_path = process.env.FRESHDESK_CONTACTS_URL_PATH;

    // contact data to be added
    const data_load = 
    {
        "name": name,
        "email": email,
        "custom_fields":
        {
            "role": role,
        }
    };


    try
    {
        // Add the contact information 
        const {headers,data} =  await postFreshdeskData(
        {
            url_path,
            data_load
        });

        // check if the contact name, email and role are updated
        if(data.name != name)
        {
            common.statusMessage(fn, "Added name: ", data.name, " does not match name: ", name);
            return -1;
        }

        if(data.email != email)
        {
            common.statusMessage(fn, "Added email: ", data.email, " does not match email: ", email);
            return -1;
        }

        if(data.custom_fields && data.custom_fields["role"] != role)
        {
            common.statusMessage(fn, "Added role: ", (data.custom_fields ? data.custom_fields["role"] : ""), " does not match role: ", role);
            return -1;
        }
    }
    catch(e)
    {
        common.statusMessage(fn, "Failed to add new contact: ", name, ", email: ", email, ", role: ", role, ". Error: ", e.message);
        return -1;
    }

    common.statusMessage(fn, "Successfully added new contact: ", name, ", email: ", email, ", role: ", role, ".");

    return 0;
}



/* 
Function: getContactIDFromEmail
Purpose: Gets the contact ID for the email passed in 
Inputs: email
Output: Returns contact ID on success, "" on failure
*/
async function getContactIDFromEmail(email)
{
    // Get the function name for logging
    const fn = getContactIDFromEmail.name;

    // Return value from the function
    let id = "";

    // First get the ID for the email sent in
    const url_path = "search/contacts?query=\"email:'" + email + "'\"";

    try
    {
        // Fetch data for the current page
        const {headers,data} = await fetchFreshdeskData(
        {
            url_path: url_path,
            current_page: null,
            per_page: null,
            updated_since: null,
            include: null
        });

        // data.results[0] should have the contact information for the email sent in
        id = data.results[0] && data.results[0].id ? data.results[0].id : "";

        // set a sleep here for 100 ms so that we don't exceed the throttle
        await common.sleep(100);
    }
    catch(e)
    {
        common.statusMessage(fn, "Failed to get list of contacts. Error:", e.message);
        return id;
    }

    common.statusMessage(fn, "Successfully fetched id: ", id, " for contact email: ", email);

    return id;
}


/* 
Function: updateContact
Purpose: Updates the contact (for which the old email is passed) with the name, email id and role. Pre-requisite: getContacts () to be run prior 
Inputs: old email, new name, new email, new role
Output: Updated contact offset in contact.contact_list[] on success, -1 on failure
*/
async function updateContact(old_email, new_name, new_email, new_role)
{
    // Get the function name for logging
    const fn = updateContact.name;

    if(old_email == "")
    {
        common.statusMessage(fn, "Invalid email passed in ..");
        return -1;
    }

    // Fetch the contact ID for the email sent in
    const id = await getContactIDFromEmail(old_email);
    if(id == "")
    {
        common.statusMessage(fn, "Failed to get contact ID for email: ", old_email);
        return -1;
    }

    // Path to set contact data
    const url_path = process.env.FRESHDESK_CONTACTS_URL_PATH + "/" + id;

    // contact data to be modified
    const data_load = 
    {
        "name": new_name,
        "email": new_email,
        "custom_fields":
        {
            "role": new_role,
        }
    };

    try
    {
        // Update the contact information for the contact ID passed in
        const {headers,data} =  await putFreshdeskData(
        {
            url_path, 
            data_load
        });

        // check if the contact name, email and role are updated
        if(data.name != new_name)
        {
            common.statusMessage(fn, "Updated name: ", data.name, " does not match name: ", new_name, " for contact ID: ", id, ".");
            return -1;
        }

        if(data.email != new_email)
        {
            common.statusMessage(fn, "Updated email: ", data.email, " does not match email: ", new_email, " for contact ID: ", id, ".");
            return -1;
        }

        if(data.custom_fields && data.custom_fields["role"] != new_role)
        {
            common.statusMessage(fn, "Updated role: ", (data.custom_fields ? data.custom_fields["role"] : ""), " does not match role: ", new_role, " for contact ID: ", id, ".");
            return -1;
        }
    }
    catch(e)
    {
        common.statusMessage(fn, "Failed to update new contact info: ", new_name, ", email: ", new_email, ", role: ", new_role, " for contact ID: ", id, ". Error: ", e.message);
        return -1;
    }

    common.statusMessage(fn, "Successfully updated new contact info: ", new_name, ", email: ", new_email, ", role: ", new_role, " for contact ID: ", id, ".");

    return 0;

}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////// EXPORTS /////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Export the functions that need to be accessed outside this module
module.exports =
{
    fd_contacts,
    addContact,
    updateContact,
};

