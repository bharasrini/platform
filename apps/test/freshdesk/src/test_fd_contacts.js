const common = require("@fyle-ops/common");
const { fd_contacts, updateContact, addContact } = require("@fyle-ops/freshdesk");

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function test_fd_get_contacts()
{
    // Get the function name for logging
    const fn = test_fd_get_contacts.name;

    common.start_test(fn);

    const contact = new fd_contacts();
    await contact.getContacts();
    common.statusMessage(fn, "Contacts read successfully !!!. Total contacts read: ", contact.num_contacts);

    common.end_test(fn);
}

async function test_fd_add_contact()
{
    // Get the function name for logging
    const fn = test_fd_add_contact.name;

    common.start_test(fn);

    const name = "Bharadwaj"
    const email = "bharasrinihello123@yahoo.com";
    const role = "Root Admin";
    await addContact(name, email, role);
    common.statusMessage(fn, "Contact added successfully !!!. Name: ", name, " Email: ", email, " Role: ", role);

    common.end_test(fn);
}

async function test_fd_update_contact()
{
    // Get the function name for logging
    const fn = test_fd_update_contact.name;

    common.start_test(fn);

    const curr_email = "bharasrini123@yahoo.com";
    const new_name = "Bharadwaj Srinivasan 123"
    const new_email = "bharasrini1234@yahoo.com";
    const new_role = "Super Duper Admin";
    await updateContact(curr_email, new_name, new_email, new_role);
    common.statusMessage(fn, "Contact updated successfully !!!. Current Email: ", curr_email, " New Name: ", new_name, " New Email: ", new_email, " New Role: ", new_role);

    common.end_test(fn);
}
 

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function test_fd_contacts()
{
    // Get the function name for logging
    const fn = test_fd_contacts.name;

    common.start_test_suite("Freshdesk Contacts");
    
    if(process.env.RUN_TEST_FD_GET_CONTACTS === "true") await test_fd_get_contacts();
    if(process.env.RUN_TEST_FD_ADD_CONTACT === "true") await test_fd_add_contact();
    if(process.env.RUN_TEST_FD_UPDATE_CONTACT === "true") await test_fd_update_contact();

    common.end_test_suite("Freshdesk Contacts");
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Export functions
module.exports =
{
    test_fd_contacts
};

