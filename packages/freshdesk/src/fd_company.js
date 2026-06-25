const common = require("@fyle-ops/common");
const { fetchFreshdeskData, postFreshdeskData, putFreshdeskData } = require('./fd_common');


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////// FUNCTIONS ////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Freshdesk Company class 
class fd_company
{
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////// CLASS VARIABLES ///////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // Array to store the company list
    company_list = [];

    // Number of companies
    num_companies = 0;

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////// CLASS FUNCTIONS ///////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    constructor()
    {
      _initCompany(this);
    }

    async getCompanies()
    {
        return await _getCompanies(this);
    }

    getCompanyName(comp_id)
    {
        return _getCompanyName(this, comp_id);
    }

    getCSM(comp_id)
    {
        return _getCSM(this, comp_id);
    }

    getFDCompanyID(org_id)
    {
        return _getFDCompanyID(this, org_id);
    }

    getFDOrgID(comp_id)
    {
        return _getFDOrgID(this, comp_id);
    }

    getFDTier(comp_id)
    {
        return _getFDTier(this, comp_id);
    }

    getFDSource(comp_id)
    {
        return _getFDSource(this, comp_id);
    }

    getFDPartner(comp_id)
    {
        return _getFDPartner(this, comp_id);
    }

    async updateAccountName(org_id, account_name)
    {
        return await _updateAccountName(this, org_id, account_name);
    }

    async updateCSM(org_id, new_csm)
    {
        return await _updateCSM(this, org_id, new_csm);
    }

    async updateAccountTier(org_id, account_tier)
    {
        return await _updateAccountTier(this, org_id, account_tier);
    }

    async updateAccountDomains(org_id, account_domains)
    {
        return await _updateAccountDomains(this, org_id, account_domains);
    }

    async updateARR(org_id, new_arr)
    {
        return await _updateARR(this, org_id, new_arr);
    }

    async updateSource(org_id, new_source)
    {
        return await _updateSource(this, org_id, new_source);
    }

    async updatePartner(org_id, new_partner)
    {
        return await _updatePartner(this, org_id, new_partner);
    }

}


/* 
Function: _initCompany
Purpose: Initializes the Freshdesk 'company' functionality
Inputs: company instance
Output: 0 on success, -1 on failure
*/
function _initCompany(company)
{
    // Get the function name for logging
    const _fn = _initCompany.name;

    // Nothing else to do, return success
    return 0;
}



/* 
Function: _getCompanies
Purpose: Gets the list of all companies from Freshdesk
Inputs: company instance
Output: List of companies stored in company.company_list[]. Returns 0 on success, -1 on failure
*/
async function _getCompanies(company)
{
    // Get the function name for logging
    const _fn = _getCompanies.name;

    // URL path for fetching companies
    const url_path = process.env.FRESHDESK_COMPANIES_URL_PATH;

    // Initialize the page and record count
    let page = Number(process.env.FRESHDESK_START_PAGE);
    const per_page = Number(process.env.FRESHDESK_MAX_COMPANIES_PER_PAGE);
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

            // Load all accounts received in this response to the account_list []
            for(let i = 0; i < data.length; i++)
            {
                let domain_list = "";
                for(let j = 0; j < data[i].domains.length; j++) domain_list = domain_list + data[i].domains[j] + ";";
                const company_info = 
                {
                    "id": data[i]["id"] ? data[i]["id"] : "",
                    "name": data[i]["name"] ? data[i]["name"] : "",
                    "arr": data[i]["custom_fields"] && data[i]["custom_fields"]["arrrevenue"] ? data[i]["custom_fields"]["arrrevenue"] : "",
                    "description": data[i]["description"] ? data[i]["description"] : "",
                    "csm": data[i]["custom_fields"] && data[i]["custom_fields"]["csm"] ? data[i]["custom_fields"]["csm"] : "",
                    "domains": data[i]["domains"] ? data[i]["domains"] : "",
                    "org_id": data[i]["custom_fields"] && data[i]["custom_fields"]["org_id"] ? data[i]["custom_fields"]["org_id"] : "",
                    "account_tier": data[i]["account_tier"] ? data[i]["account_tier"] : "",
                    "source": data[i]["custom_fields"] && data[i]["custom_fields"]["source"] ? data[i]["custom_fields"]["source"] : "",
                    "partner": data[i]["custom_fields"] && data[i]["custom_fields"]["partner"] ? data[i]["custom_fields"]["partner"] : "",
                };

                company.company_list.push(company_info);

                // Increment counter
                company.num_companies++
            }

            if(link)
            {
                page++;
            }
    /*
            if((page % 5) == 0)
            {
                common.statusMessage(_fn, "Processing page: ", page, ", companies processed: ", company.num_companies);
            }
    */
            // set a sleep here for 100 ms so that we don't exceed the throttle
            await common.sleep(100);
        }
        catch(e)
        {
            common.statusMessage(_fn, "Failed to get list of companies. Error:", e.message);
            return -1;
        }

    }while(link);

    common.statusMessage(_fn, "Successfully fetched companies. Number of companies = ", company.num_companies);

    return 0;
}




/* 
Function: _getCompanyName
Purpose: Returns the company name associated with the company id passed in. Pre-requisite: getCompanies() to be run prior
Inputs: company instance, company id (string)
Output: company name (string)
*/
function _getCompanyName(company, comp_id)
{
    // Get the function name for logging
    const _fn = _getCompanyName.name;
    
    let ret = "";

    // Sanity check
    if(company.num_companies == 0)
    {
        common.statusMessage(_fn, "No Companies to read, possibly getCompanies() not called ?");
        return ret;
    }

    // Loop through the company list to find the matching company id and return the company name
    for(let i = 0; i < company.num_companies; i++)
    {
        if(company.company_list[i].id == comp_id)
        {
            ret = company.company_list[i].name;
            break;
        }
    }

    return ret;
}



/* 
Function: _getCSM
Purpose: Returns the CSM associated with the company id passed in. Pre-requisite: getCompanies() to be run prior
Inputs: company instance, company id (string)
Output: CSM (string)
*/
function _getCSM(company, comp_id)
{
    // Get the function name for logging
    const _fn = _getCSM.name;
    
    let ret = "";

    // Sanity check
    if(company.num_companies == 0)
    {
        common.statusMessage(_fn, "No Companies to read, possibly getCompanies() not called ?");
        return ret;
    }

    // Loop through the company list to find the matching company id and return the CSM
    for(let i = 0; i < company.num_companies; i++)
    {
        if(company.company_list[i].id == comp_id)
        {
            ret = company.company_list[i].csm;
            break;
        }
    }

    return ret;
}



/* 
Function: _getFDCompanyID
Purpose: Returns the Freshdesk company ID associated with the org id passed in. Pre-requisite: getCompanies() to be run prior
Inputs: company instance, company id (string)
Output: company name (string)
*/
function _getFDCompanyID(company, org_id)
{
    // Get the function name for logging
    const _fn = _getFDCompanyID.name;

    let ret = "";

    // Sanity check
    if(company.num_companies == 0)
    {
        common.statusMessage(_fn, "No Companies to read, possibly getCompanies() not called ?");
        return ret;
    }

    // Loop through the company list to find the matching org id and return the Freshdesk company id
    for(let i = 0; i < company.num_companies; i++)
    {
        if(company.company_list[i]["org_id"] == org_id)
        {
            ret = company.company_list[i].id;
            break;
        }
    }

    return ret;
}




/* 
Function: _getFDOrgID
Purpose: Returns the Org ID associated with the Freshdesk Company id passed in. Pre-requisite: getCompanies() to be run prior
Inputs: company instance, org id (string)
Output: Org name (string)
*/
function _getFDOrgID(company, comp_id)
{
    // Get the function name for logging
    const _fn = _getFDOrgID.name;
    
    let ret = "";

    // Sanity check
    if(company.num_companies == 0)
    {
        common.statusMessage(_fn, "No Companies to read, possibly getCompanies() not called ?");
        return ret;
    }

    // Loop through the company list to find the matching Freshdesk company id and return the org id
    for(let i = 0; i < company.num_companies; i++)
    {
        if(company.company_list[i]["id"] == comp_id)
        {
            ret = company.company_list[i].org_id;
            break;
        }
    }

    return ret;
}



/* 
Function: _getFDTier
Purpose: Returns the Tier associated with the Freshdesk Company id passed in. Pre-requisite: getCompanies() to be run prior
Inputs: company instance, org id (string)
Output: Tier (string)
*/
function _getFDTier(company, comp_id)
{
    // Get the function name for logging
    const _fn = _getFDTier.name;
    
    let ret = "";

    // Sanity check
    if(company.num_companies == 0)
    {
        common.statusMessage(_fn, "No Companies to read, possibly getCompanies() not called ?");
        return ret;
    }

    // Loop through the company list to find the matching Freshdesk company id and return the Tier
    for(let i = 0; i < company.num_companies; i++)
    {
        if(company.company_list[i]["id"] == comp_id)
        {
            ret = company.company_list[i].account_tier;
            break;
        }
    }

    return ret;
}



/* 
Function: _getFDSource
Purpose: Returns the Source associated with the Freshdesk Company id passed in. Pre-requisite: getCompanies() to be run prior
Inputs: company instance, org id (string)
Output: Source (string)
*/
function _getFDSource(company, comp_id)
{
    // Get the function name for logging
    const _fn = _getFDSource.name;
    
    let ret = "";

    // Sanity check
    if(company.num_companies == 0)
    {
        common.statusMessage(_fn, "No Companies to read, possibly getCompanies() not called ?");
        return ret;
    }

    // Loop through the company list to find the matching Freshdesk company id and return the Source
    for(let i = 0; i < company.num_companies; i++)
    {
        if(company.company_list[i]["id"] == comp_id)
        {
            ret = company.company_list[i].source;
            break;
        }
    }

    return ret;
}



/* 
Function: _getFDPartner
Purpose: Returns the Partner associated with the Freshdesk Company id passed in. Pre-requisite: getCompanies() to be run prior
Inputs: company instance, org id (string)
Output: Source (string)
*/
function _getFDPartner(company, comp_id)
{
    // Get the function name for logging
    const _fn = _getFDPartner.name;
    
    let ret = "";

    // Sanity check
    if(company.num_companies == 0)
    {
        common.statusMessage(_fn, "No Companies to read, possibly getCompanies() not called ?");
        return ret;
    }

    // Loop through the company list to find the matching Freshdesk company id and return the Partner
    for(let i = 0; i < company.num_companies; i++)
    {
        if(company.company_list[i]["id"] == comp_id)
        {
            ret = company.company_list[i].partner;
            break;
        }
    }

    return ret;
}


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////


/* 
Function: _updateAccountName
Purpose: Updates the  Account Name for the provided company on Freshdesk with the provided inputs. Pre-requisite: getCompanies() to be run prior
Inputs: company instance, company org ID (string), account_name (string)
Output: 0 on success, -1 on failure
*/
async function _updateAccountName(company, org_id, account_name)
{
    // Get the function name for logging
    const _fn = _updateAccountName.name;

    // Sanity check
    if(company.num_companies == 0)
    {
        common.statusMessage(_fn, "No Companies to read, possibly getCompanies() not called ?");
        return -1;
    }

    // First get the FD company ID for the org ID passed in
    const fd_company_id = company.getFDCompanyID(org_id);
    if(fd_company_id == "")
    {
        common.statusMessage(_fn, "Failed to locate FD ID for org ID:", org_id);
        return -1;
    }

    // Path to set company data
    const url_path = process.env.FRESHDESK_COMPANIES_URL_PATH + "/" + fd_company_id;

    // company data to be modified
    const data_load = 
    {
        "name": account_name
    };

    try
    {
        const {headers,data} =  await putFreshdeskData(
        {
            url_path,
            data_load
        });

        // check if the account name is updated
        if(data.name != account_name)
        {
            common.statusMessage(_fn, "New name: ", data.name, " does not match ", account_name, " for company org ID: ", org_id, ".");
            return -1;
        }
    }
    catch(e)
    {
        common.statusMessage(_fn, "Failed to update new name: ", account_name, " for company org ID: ", org_id, ".", e.message);
        return -1;
    }

    common.statusMessage(_fn, "Successfully updated new name: ", account_name, " for company org ID: ", org_id, ".");

    return 0;
}




/* 
Function: _updateCSM
Purpose: Updates the  CSM for the provided company on Freshdesk with the provided inputs. Pre-requisite: getCompanies() to be run prior
Inputs: company instance, company org ID (string), CSM (string)
Output: 0 on success, -1 on failure
*/
async function _updateCSM(company, org_id, new_csm)
{
    // Get the function name for logging
    const _fn = _updateCSM.name;

    // Sanity check
    if(company.num_companies == 0)
    {
        common.statusMessage(_fn, "No Companies to read, possibly getCompanies() not called ?");
        return -1;
    }

    // First get the FD company ID for the org ID passed in
    const fd_company_id = company.getFDCompanyID(org_id);
    if(fd_company_id == "")
    {
        common.statusMessage(_fn, "Failed to locate FD ID for org ID:", org_id);
        return -1;
    }

    // Path to set company data
    const url_path = process.env.FRESHDESK_COMPANIES_URL_PATH + "/" + fd_company_id;

    // company data to be modified
    const data_load = 
    {
        "custom_fields":
        {
            "csm": new_csm
        }
    };

    try
    {
        const {headers,data} =  await putFreshdeskData(
        {
            url_path, 
            data_load
        });

        // check if the CSM is updated
        if(data.custom_fields.csm != new_csm)
        {
            common.statusMessage(_fn, "New CSM: ", data.custom_fields.csm, " does not match ", new_csm, " for company org ID: ", org_id, ".");
            return -1;
        }
    }
    catch(e)
    {
        common.statusMessage(_fn, "Failed to update new CSM: ", new_csm, " for company org ID: ", org_id, ".", e.message);
        return -1;
    }

    common.statusMessage(_fn, "Successfully updated new CSM: ", new_csm, " for company org ID: ", org_id, ".");

    return 0;
}




/* 
Function: _updateAccountTier
Purpose: Updates the  Account Tier for the provided company on Freshdesk with the provided inputs. Pre-requisite: getCompanies() to be run prior
Inputs: company instance, company org ID (string), account_tier (string)
Output: 0 on success, -1 on failure
*/
async function _updateAccountTier(company, org_id, account_tier)
{
    // Get the function name for logging
    const _fn = _updateAccountTier.name;
    
    // Sanity check
    if(company.num_companies == 0)
    {
        common.statusMessage(_fn, "No Companies to read, possibly getCompanies() not called ?");
        return -1;
    }

    // First get the FD company ID for the org ID passed in
    const fd_company_id = company.getFDCompanyID(org_id);
    if(fd_company_id == "")
    {
        common.statusMessage(_fn, "Failed to locate FD ID for org ID:", org_id);
        return -1;
    }

    // Path to set company data
    const url_path = process.env.FRESHDESK_COMPANIES_URL_PATH + "/" + fd_company_id;

    // company data to be modified
    const data_load = 
    {
        "account_tier": common.escapeHtml(account_tier)
    };

    try
    {
        const {headers,data} =  await putFreshdeskData(
        {
            url_path, 
            data_load
        });

        // check if the account tier is updated
        if(data.account_tier != account_tier)
        {
            common.statusMessage(_fn, "New account tier: ", data.account_tier, " does not match ", account_tier, " for company org ID: ", org_id, ".");
            return -1;
        }
    }
    catch(e)
    {
        common.statusMessage(_fn, "Failed to update new account tier: ", account_tier, " for company org ID: ", org_id, ".", e.message);
        return -1;
    }

    common.statusMessage(_fn, "Successfully updated new account tier: ", account_tier, " for company org ID: ", org_id, ".");

    return 0;
}



/* 
Function: _updateAccountDomains
Purpose: Updates the  Account Domains for the provided company on Freshdesk with the provided inputs. Pre-requisite: getCompanies() to be run prior
Inputs: Freshdesk company instance, org ID (string), domain list (array of string)
Output: 0 on success, -1 on failure
*/
async function _updateAccountDomains(company, org_id, account_domains)
{
    // Get the function name for logging
    const _fn = _updateAccountDomains.name;

    // Sanity check
    if(company.num_companies == 0)
    {
        common.statusMessage(_fn, "No Companies to read, possibly getCompanies() not called ?");
        return -1;
    }

    // First get the FD company ID for the org ID passed in
    const fd_company_id = company.getFDCompanyID(org_id);
    if(fd_company_id == "")
    {
        common.statusMessage(_fn, "Failed to locate FD ID for org ID:", org_id);
        return -1;
    }

    // Path to set company data
    const url_path = process.env.FRESHDESK_COMPANIES_URL_PATH + "/" + fd_company_id;

    // company data to be modified
    const data_load = 
    {
        "domains": account_domains
    };

    try
    {
        const {headers,data} =  await putFreshdeskData(
        {
            url_path, 
            data_load
        });

        // check if the account domain is updated
        if(data.domains.length != account_domains.length)
        {
            common.statusMessage(_fn, "New account domain length: ", data.domains.length, " does not match account_domains length: ", account_domains.length, " for company org ID: ", org_id, ".");
            return -1;
        }

        for(let i = 0; i < data.domains.length; i++)
        {
            if(data.domains[i] != account_domains[i])
            {
                common.statusMessage(_fn, "[", i, "] New account domain: ", data.domains[i], " does not match ", account_domains[i], " for company org ID: ", org_id, ".");
                return -1;
            }
        }
    }
    catch(e)
    {
        common.statusMessage(_fn, "Failed to update new account domains: ", account_domains, " for company org ID: ", org_id, ".", e.message);
        return -1;
    }

    common.statusMessage(_fn, "Successfully updated new account domains: ", account_domains, " for company org ID: ", org_id, ".");

    return 0;
}




/* 
Function: _updateARR
Purpose: Updates the  ARR details for the provided company on Freshdesk with the provided inputs. Pre-requisite: getCompanies() to be run prior
Inputs: company instance, company org ID (string), ARR (number)
Output: 0 on success, -1 on failure
*/
async function _updateARR(company, org_id, new_arr)
{
    // Get the function name for logging
    const _fn = _updateARR.name;

    // Sanity check
    if(company.num_companies == 0)
    {
        common.statusMessage(_fn, "No Companies to read, possibly getCompanies() not called ?");
        return -1;
    }

    // First get the FD company ID for the org ID passed in
    const fd_company_id = company.getFDCompanyID(org_id);
    if(fd_company_id == "")
    {
        common.statusMessage(_fn, "Failed to locate FD ID for org ID:", org_id);
        return -1;
    }

    // Path to set company data
    const url_path = process.env.FRESHDESK_COMPANIES_URL_PATH + "/" + fd_company_id;

    // company data to be modified
    const data_load = 
    {
        "custom_fields":
        {
            "arrrevenue": Number(new_arr)
        }
    };

    try
    {
        const {headers,data} =  await putFreshdeskData(
        {
            url_path, 
            data_load
        });

        // check if the ARR is updated
        if(data.custom_fields.arrrevenue != Number(new_arr))
        {
            common.statusMessage(_fn, "New ARR: ", data.custom_fields.arrrevenue, " does not match ", new_arr, " for company org ID: ", org_id, ".");
            return -1;
        }
    }
    catch(e)
    {
        common.statusMessage(_fn, "Failed to update new ARR: ", new_arr, " for company org ID: ", org_id, ".", e.message);
        return -1;
    }

    common.statusMessage(_fn, "Successfully updated new ARR: ", new_arr, " for company org ID: ", org_id, ".");

    return 0;
}




/* 
Function: _updateSource
Purpose: Updates the Source details for the provided company on Freshdesk with the provided inputs. Pre-requisite: getCompanies() to be run prior
Inputs: company instance, company org ID (string), Source (string)
Output: 0 on success, -1 on failure
*/
async function _updateSource(company, org_id, new_source)
{
    // Get the function name for logging
    const _fn = _updateSource.name;

    // Sanity check
    if(company.num_companies == 0)
    {
        common.statusMessage(_fn, "No Companies to read, possibly getCompanies() not called ?");
        return -1;
    }

    // First get the FD company ID for the org ID passed in
    const fd_company_id = company.getFDCompanyID(org_id);
    if(fd_company_id == "")
    {
        common.statusMessage(_fn, "Failed to locate FD ID for org ID:", org_id);
        return -1;
    }

    // Path to set company data
    const url_path = process.env.FRESHDESK_COMPANIES_URL_PATH + "/" + fd_company_id;

    // company data to be modified
    const data_load = 
    {
        "custom_fields":
        {
            "source": new_source
        }
    };

    try
    {
        const {headers,data} =  await putFreshdeskData(
        {
            url_path, 
            data_load
        });

        // check if the Source is updated
        if(data.custom_fields.source != new_source)
        {
            common.statusMessage(_fn, "New Source: ", data.custom_fields.source, " does not match ", new_source, " for company org ID: ", org_id, ".");
            return -1;
        }
    }
    catch(e)
    {
        common.statusMessage(_fn, "Failed to update new Source: ", new_source, " for company org ID: ", org_id, ".", e.message);
        return -1;
    }

    common.statusMessage(_fn, "Successfully updated new Source: ", new_source, " for company org ID: ", org_id, ".");

    return 0;
}




/* 
Function: _updatePartner
Purpose: Updates the Partner details for the provided company on Freshdesk with the provided inputs. Pre-requisite: getCompanies() to be run prior
Inputs: company instance, company org ID (string), Partner (string)
Output: 0 on success, -1 on failure
*/
async function _updatePartner(company, org_id, new_partner)
{
    // Get the function name for logging
    const _fn = _updatePartner.name;
    
    // Sanity check
    if(company.num_companies == 0)
    {
        common.statusMessage(_fn, "No Companies to read, possibly getCompanies() not called ?");
        return -1;
    }

    // First get the FD company ID for the org ID passed in
    const fd_company_id = company.getFDCompanyID(org_id);
    if(fd_company_id == "")
    {
        common.statusMessage(_fn, "Failed to locate FD ID for org ID:", org_id);
        return -1;
    }

    // Path to set company data
    const url_path = process.env.FRESHDESK_COMPANIES_URL_PATH + "/" + fd_company_id;

    // company data to be modified
    const data_load = 
    {
        "custom_fields":
        {
            "partner": new_partner
        }
    };

    try
    {
        const {headers,data} =  await putFreshdeskData(
        {
            url_path, 
            data_load
        });

        // check if the Partner is updated
        if(data.custom_fields.partner != new_partner)
        {
            common.statusMessage(_fn, "New Partner: ", data.custom_fields.partner, " does not match ", new_partner, " for company org ID: ", org_id, ".");
            return -1;
        }
    }
    catch(e)
    {
        common.statusMessage(_fn, "Failed to update new Partner: ", new_partner, " for company org ID: ", org_id, ".", e.message);
        return -1;
    }

    common.statusMessage(_fn, "Successfully updated new Partner: ", new_partner, " for company org ID: ", org_id, ".");

    return 0;
}




/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


/* 
Function: createNewCompanyonFD
Purpose: Creates a new company on Freshdesk with the provided inputs
Inputs: company_details structure containing company name (string), company domain (array of strings), company org ID (string), csm (string), account_tier (string), arr (number)
Output: 0 on success, -1 on failure; also company_details.id is updated with the id of the created company
*/
async function createNewCompanyonFD(company_details)
{
    // Get the function name for logging
    const _fn = createNewCompanyonFD.name;
    
    const url_path = process.env.FRESHDESK_COMPANIES_URL_PATH;

    const data_load = 
    {
        "name": company_details.crm_account_id,
        "domains": company_details.org_domain,
        "account_tier": common.escapeHtml(company_details.account_tier),
        "custom_fields":
        {
            "org_id": company_details.org_id,
            "csm": company_details.csm_name,
            "arrrevenue": company_details.arr,
            "source": company_details.source,
            "partner": company_details.partner,
        }
    };

    try
    {
        const {headers,data} =  await postFreshdeskData(
        {
            url_path,
            data_load
        });

        company_details.id = data.id;
    }
    catch(e)
    {
        common.statusMessage(_fn, "Failed to create new company. Error: ", e.message);
        return -1;
    }

    common.statusMessage(_fn, "Successfully created new company with ID: ", company_details.id);

    return 0;
}


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////// EXPORTS /////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// Exporting the class and other functions
module.exports = 
{
    fd_company,
    createNewCompanyonFD
};
