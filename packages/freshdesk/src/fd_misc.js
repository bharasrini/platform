
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////// FUNCTIONS ////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/* 
Function: isValidTicketType
Purpose: Checks if the ticket type passed in is a valid ticket type or not. Valid ticket types are those that do not match with the invalid_ticket_types[] list
Inputs: ticket_type (string)
Output: true (valid type), false (invalid type)
*/
function isValidTicketType(ticket_type)
{
    // Get the function name for logging
    const fn = isValidTicketType.name;

    // List of Invalid Ticket Types. Add any invalid ticket types to this list 
    const invalid_ticket_types = 
    [
        "Account Implementation",
        "Bug Bounty",
        "Guest Blog/Back links",
        "Mail Response",
        "NPS",
        "Promotions",
        "Prospect",
        "Testing"
    ];

    if(ticket_type && (ticket_type != ""))
    {
        for(let i = 0; i < invalid_ticket_types.length; i++)
        {
            if((ticket_type).toString().trim() == (invalid_ticket_types[i]).toString().trim())
            {
                return false;
            }
        }
    }

    // If this is a valid type or type not set
    return true;
}



/* 
Function: isSupportGroup
Purpose: Checks if the group name passed is a support group or not. Valid group names are those that do  not match with the non_support_groups[] list
Inputs: group_name (string)
Output: true (support group), false (not a support group)
*/
function isSupportGroup(group_name)
{
    // Get the function name for logging
    const fn = isSupportGroup.name;

    // List of Group names that do not belong to Support. Add any other non Support groups to this list
    const non_support_groups = 
    [
        "Account Implementation",
        "Product",
        "Customer Conversations"
    ];

    if(group_name != "")
    {
        for(let i = 0; i < non_support_groups.length; i++)
        {
            if((group_name).toString().trim() == (non_support_groups[i]).toString().trim())
            {
                return false;
            }
        }
    }

    // If this is a support group or type not set
    return true;
}



/* 
Function: isRestrictedDomain
Purpose: Checks if the domain is a restricted one on Freshdesk
Inputs: org_domain (string)
Output: true (restricted domain), false (not restricted)
*/
function isRestrictedDomain(org_domain)
{
    // Get the function name for logging
    const fn = isRestrictedDomain.name;
    
    const restricted_domains = 
    [
        "gmail.com",
        "googlemail.com",
        "yahoo.com",
        "yahoomail.com",
        "mailyahoo.com",
        "ymail.com",
        "yahoo.co.in",
        "yahoo.co.jp",
        "yahoo.co.uk",
        "yahoo.com.tw",
        "rocketmail.com",
        "outlook.com",
        "hotmail.com",
        "protonmail.com",
        "aol.com",
    ];

    const this_org_domain = org_domain.toString().toLowerCase().trim();

    for(let i = 0; i < restricted_domains.length; i++)
    {
        if(this_org_domain == restricted_domains[i])
          return true;
    }

    return false;
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////// EXPORTS /////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Exporting the functions
module.exports = 
{
    isValidTicketType,
    isSupportGroup,
    isRestrictedDomain
}