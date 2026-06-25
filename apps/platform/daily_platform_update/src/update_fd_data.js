const { formatInTimeZone } = require("date-fns-tz");
const csm_mapping = require("@fyle-ops/csm_mapping");
const common = require("@fyle-ops/common");

const { fd_company } = require("@fyle-ops/freshdesk");



/* 
Function: checkAndUpdateFDData
Purpose: Checks the Freshdesk company data against Freshsuccess and updates the following fields in Freshdesk: 
(a) Company Name, (b) CSM, (c) Tier, (d) ARR, (e) Source, (f) Partner
Inputs: Freshsuccess account instance, Freshdesk company instance, CSM Mapping instance
Output: 0 on success, -1 on failure
*/
async function checkAndUpdateFDData(account, company)
{
    // Get the function name for logging purposes
    const _fn = checkAndUpdateFDData.name;

    // Container to store the account records that we will update
    const fd_company_name_log_container = [];
    const fd_csm_log_container = [];
    const fd_tier_log_container = [];
    const fd_arr_log_container = [];
    const fd_source_log_container = [];
    const fd_partner_log_container = [];

    // Sanity checks
    if(account.account_list.length == 0)
    {
        common.statusMessage(_fn, "No contacts, Freshsuccess getAccounts() to be run prior ..");
        return -1;
    }

    if(company.company_list.length == 0)
    {
        common.statusMessage(_fn, "No contacts, Freshdesk getCompanies() to be run prior ..");
        return -1;
    }

    // Loop through all companies in FD and check the data
    for(let i = 0; i < company.company_list.length; i++)
    {
        const fd_org_id = company.company_list[i]["org_id"];
        if(fd_org_id == "") continue;

        // Compare each FD company data against the FS account data
        for(let j = 0; j < account.account_list.length; j++)
        {
            const fs_org_id = account.account_list[j]["id"]["org_id"];

            if(fs_org_id == fd_org_id)
            {
                const fd_id = company.company_list[i]["id"];

                //First check if the CSM matches
                const fs_csm = account.account_list[j]["common_params"]["csms"];
                const fd_csm = company.company_list[i]["csm"];
                // FD uses name for CSM while FS uses email
                const fd_new_csm = csm_mapping.returnFDCSMNameForEmail(fs_csm);
                if((fd_new_csm != fd_csm) && (fd_new_csm != ""))
                {
                    // Update the new CSM in FD
                    common.statusMessage(_fn, "Updating CSM in FD. Org ID: " + fd_org_id + ", FD ID: " + fd_id + ", Old CSM: " + fd_csm + ", New CSM: " + fd_new_csm);
                    if(await company.updateCSM(fd_org_id, fd_new_csm) < 0)
                    {
                        common.statusMessage(_fn, "Failed to update CSM in FD. Org ID: " + fd_org_id + ", FD ID: " + fd_id + ", Old CSM: " + fd_csm + ", New CSM: " + fd_new_csm);
                        return -1;
                    }

                    const fd_csm_log = 
                    {
                        id: fd_id,
                        org_id: fd_org_id,
                        prev_csm: fd_csm,
                        new_csm: fd_new_csm,
                    };
                    fd_csm_log_container.push(fd_csm_log);
                }


                // Next check if the company name matches
                const fs_company_name = account.account_list[j]["id"]["account_name"];
                const fd_company_name = company.company_list[i]["name"];
                if(fs_company_name != fd_company_name)
                {
                    const hierarchy = account.account_list[j]["common_params"]["hierarchy_label"];
                    // If hierarchy is secondary, skip
                    if(hierarchy == "Secondary")
                    {
                        common.statusMessage(_fn, "Secondary org, will not be updating account name in FD. Org ID: " + fd_org_id + ", FD ID: " + fd_id + ", Old Company Name: " + fd_company_name + ", New Company: " + fs_company_name);
                        continue;
                    }

                    // Update the Company Name in FD
                    common.statusMessage(_fn, "Updating Company Name in FD. Org ID: " + fd_org_id + ", FD ID: " + fd_id + ", Old Company Name: " + fd_company_name + ", New Company: " + fs_company_name);
                    if(await company.updateAccountName(fd_org_id, fs_company_name) < 0)
                    {
                        common.statusMessage(_fn, "Failed to update Company Name in FD. Org ID: " + fd_org_id + ", FD ID: " + fd_id + ", Old Company Name: " + fd_company_name + ", New Company: " + fs_company_name);
                        return -1;
                    }

                    const fd_company_log = 
                    {
                        id: fd_id,
                        org_id: fd_org_id,
                        prev_company_name: fd_company_name,
                        new_company_name: fs_company_name,
                    };
                    fd_company_name_log_container.push(fd_company_log);
                }

                // Next check if the tier matches
                const fs_tier = account.account_list[j]["common_params"]["tier"];
                const fd_tier = company.company_list[i]["account_tier"];

                // FD escapes the HTML characters
                const esc_fs_tier = common.escapeHtml(fs_tier);
                if(esc_fs_tier != fd_tier)
                {
                    // Update the new Tier in FD
                    common.statusMessage(_fn, "Updating Tier in FD. Org ID: " + fd_org_id + ", FD ID: " + fd_id + ", Old Tier: " + fd_tier + ", New Tier: " + fs_tier);
                    if(await company.updateAccountTier(fd_org_id, fs_tier) < 0)
                    {
                        common.statusMessage(_fn, "Failed to update Tier in FD. Org ID: " + fd_org_id + ", FD ID: " + fd_id + ", Old Tier: " + fd_tier + ", New Tier: " + fs_tier);
                        return -1;
                    }

                    const fd_tier_log = 
                    {
                        id: fd_id,
                        org_id: fd_org_id,
                        prev_tier: fd_tier,
                        new_tier: esc_fs_tier
                    };
                    fd_tier_log_container.push(fd_tier_log);
                }

                // Next check if the ARR matches
                const fs_arr = account.account_list[j]["common_params"]["current_arr"];
                const fd_arr = company.company_list[i]["arr"];

                // FD stores ARR in $$ and whole numbers
                const fs_mod_arr = Math.round(Number(fs_arr)/100);
                if(fs_mod_arr != fd_arr)
                {
                    // Update the new ARR in FD
                    common.statusMessage(_fn, "Updating ARR in FD. Org ID: " + fd_org_id + ", FD ID: " + fd_id + ", Old ARR: " + fd_arr + ", New Tier: " + fs_mod_arr);
                    if(await company.updateARR(fd_org_id, fs_mod_arr) < 0)
                    {
                        common.statusMessage(_fn, "Failed to update ARR in FD. Org ID: " + fd_org_id + ", FD ID: " + fd_id + ", Old ARR: " + fd_arr + ", New Tier: " + fs_mod_arr);
                        return -1;
                    }

                    const fd_arr_log = 
                    {
                        id: fd_id,
                        org_id: fd_org_id,
                        prev_arr: fd_arr,
                        new_arr: fs_mod_arr
                    };
                    fd_arr_log_container.push(fd_arr_log);
                }

                // Next check if the Source matches
                const fs_source = account.account_list[j]["common_params"]["customer_source"];
                const fd_source = company.company_list[i]["source"];

                if(fs_source != fd_source)
                {
                    // Update the Source in FD
                    common.statusMessage(_fn, "Updating Source in FD. Org ID: " + fd_org_id + ", FD ID: " + fd_id + ", Old Source: " + fd_source + ", New Source: " + fs_source);
                    if(await company.updateSource(fd_org_id, fs_source) < 0)
                    {
                        common.statusMessage(_fn, "Failed to update Source in FD. Org ID: " + fd_org_id + ", FD ID: " + fd_id + ", Old Source: " + fd_source + ", New Source: " + fs_source);
                        return -1;
                    }

                    const fd_source_log = 
                    {
                        id: fd_id,
                        org_id: fd_org_id,
                        prev_source: fd_source,
                        new_source: fs_source,
                    };
                    fd_source_log_container.push(fd_source_log);
                }

                // Next check if the Source matches
                const fs_partner = account.account_list[j]["common_params"]["partner_reseller_name"];
                const fd_partner = company.company_list[i]["partner"];

                if(fs_partner != fd_partner)
                {
                    // Update the Partner in FD
                    common.statusMessage(_fn, "Updating Partner in FD. Org ID: " + fd_org_id + ", FD ID: " + fd_id + ", Old Partner: " + fd_partner + ", New Partner: " + fs_partner);
                    if(await company.updatePartner(fd_org_id, fs_partner) < 0)
                    {
                        common.statusMessage(_fn, "Failed to update Partner in FD. Org ID: " + fd_org_id + ", FD ID: " + fd_id + ", Old Partner: " + fd_partner + ", New Partner: " + fs_partner);
                        return -1;
                    }

                    const fd_partner_log = 
                    {
                        id: fd_id,
                        org_id: fd_org_id,
                        prev_partner: fd_partner,
                        new_partner: fs_partner,
                    };
                    fd_partner_log_container.push(fd_partner_log);
                }

            }
        }
    }

    // Write out the FD change logs
    const folder_id = process.env.DAILY_PLATFORM_UPDATE_LOG_FOLDER_ID;
    const file_name = process.env.DAILY_PLATFORM_UPDATE_LOG_FILE_PREFIX + formatInTimeZone(new Date(), "UTC", "yyyy_MM_dd");
    const num_rows_to_freeze = Number(process.env.DAILY_PLATFORM_UPDATE_LOG_NUM_ROWS_TO_FREEZE);
    
    // First write out the FD CSM update logs to a Google Sheet
    let sheet_name = process.env.DAILY_PLATFORM_UPDATE_FD_CSM_LOG_SHEET_NAME;
    if(await common.GoogleSheet_writeStructuredDataArrayToGoogleSheet(folder_id, file_name, sheet_name, fd_csm_log_container, true, true) < 0)
    {
        common.statusMessage(_fn, "Failed to write sheet: ", sheet_name, " to spreadsheet: ", file_name, " in folder: ", folder_id);
        return -1;
    }
    // Freeze top row
    let status = await common.GoogleSheet_freezeNRowsInGoogleSheet(folder_id, file_name, sheet_name, num_rows_to_freeze);
    if(status < 0)
    {
        common.statusMessage(_fn, "Failed to freeze ", num_rows_to_freeze, " rows for sheet with name " + sheet_name);
        return -1;
    }


    // Write out the FD Company name update logs to a Google Sheet
    sheet_name = process.env.DAILY_PLATFORM_UPDATE_FD_COMPANY_NAME_LOG_SHEET_NAME;
    if(await common.GoogleSheet_writeStructuredDataArrayToGoogleSheet(folder_id, file_name, sheet_name, fd_company_name_log_container, true, true) < 0)
    {
        common.statusMessage(_fn, "Failed to write sheet: ", sheet_name, " to spreadsheet: ", file_name, " in folder: ", folder_id);
        return -1;
    }
    // Freeze top row
    status = await common.GoogleSheet_freezeNRowsInGoogleSheet(folder_id, file_name, sheet_name, num_rows_to_freeze);
    if(status < 0)
    {
        common.statusMessage(_fn, "Failed to freeze ", num_rows_to_freeze, " rows for sheet with name " + sheet_name);
        return -1;
    }


    // Write out the FD Tier update logs to a Google Sheet
    sheet_name = process.env.DAILY_PLATFORM_UPDATE_FD_TIER_LOG_SHEET_NAME;
    if(await common.GoogleSheet_writeStructuredDataArrayToGoogleSheet(folder_id, file_name, sheet_name, fd_tier_log_container, true, true) < 0)
    {
        common.statusMessage(_fn, "Failed to write sheet: ", sheet_name, " to spreadsheet: ", file_name, " in folder: ", folder_id);
        return -1;
    }
    // Freeze top row
    status = await common.GoogleSheet_freezeNRowsInGoogleSheet(folder_id, file_name, sheet_name, num_rows_to_freeze);
    if(status < 0)
    {
        common.statusMessage(_fn, "Failed to freeze ", num_rows_to_freeze, " rows for sheet with name " + sheet_name);
        return -1;
    }


    // Write out the FD ARR update logs to a Google Sheet
    sheet_name = process.env.DAILY_PLATFORM_UPDATE_FD_ARR_LOG_SHEET_NAME;
    if(await common.GoogleSheet_writeStructuredDataArrayToGoogleSheet(folder_id, file_name, sheet_name, fd_arr_log_container, true, true) < 0)
    {
        common.statusMessage(_fn, "Failed to write sheet: ", sheet_name, " to spreadsheet: ", file_name, " in folder: ", folder_id);
        return -1;
    }
    // Freeze top row
    status = await common.GoogleSheet_freezeNRowsInGoogleSheet(folder_id, file_name, sheet_name, num_rows_to_freeze);
    if(status < 0)
    {
        common.statusMessage(_fn, "Failed to freeze ", num_rows_to_freeze, " rows for sheet with name " + sheet_name);
        return -1;
    }


    // Write out the FD Source update logs to a Google Sheet
    sheet_name = process.env.DAILY_PLATFORM_UPDATE_FD_SOURCE_LOG_SHEET_NAME;
    if(await common.GoogleSheet_writeStructuredDataArrayToGoogleSheet(folder_id, file_name, sheet_name, fd_source_log_container, true, true) < 0)
    {
        common.statusMessage(_fn, "Failed to write sheet: ", sheet_name, " to spreadsheet: ", file_name, " in folder: ", folder_id);
        return -1;
    }
    // Freeze top row
    status = await common.GoogleSheet_freezeNRowsInGoogleSheet(folder_id, file_name, sheet_name, num_rows_to_freeze);
    if(status < 0)
    {
        common.statusMessage(_fn, "Failed to freeze ", num_rows_to_freeze, " rows for sheet with name " + sheet_name);
        return -1;
    }


    // Write out the FD Partner update logs to a Google Sheet
    sheet_name = process.env.DAILY_PLATFORM_UPDATE_FD_PARTNER_LOG_SHEET_NAME;
    if(await common.GoogleSheet_writeStructuredDataArrayToGoogleSheet(folder_id, file_name, sheet_name, fd_partner_log_container, true, true) < 0)
    {
        common.statusMessage(_fn, "Failed to write sheet: ", sheet_name, " to spreadsheet: ", file_name, " in folder: ", folder_id);
        return -1;
    }
    // Freeze top row
    status = await common.GoogleSheet_freezeNRowsInGoogleSheet(folder_id, file_name, sheet_name, num_rows_to_freeze);
    if(status < 0)
    {
        common.statusMessage(_fn, "Failed to freeze ", num_rows_to_freeze, " rows for sheet with name " + sheet_name);
        return -1;
    }

    return 0;
}




/*
Function: updateFDData
Purpose: Performs the daily platform update in Freshdesk
Inputs: account object
Output: 0 on success, -1 on failure
*/
async function updateFDData(account)
{
    // Get the function name for logging purposes
    const _fn = updateFDData.name;

    // Get the list of all companies in FD
    const company = new fd_company();
    if(await company.getCompanies() < 0)
    {
        common.statusMessage(_fn, "Failed to get the list of companies, exiting");
        return -1;    
    }
    common.statusMessage(_fn, "Finished getting list of all FD companies, going to check and update FD data next");

    if(await checkAndUpdateFDData(account, company) < 0)
    {
        common.statusMessage(_fn, "Failed to check and update FD data, exiting");
        return -1;
    }
    common.statusMessage(_fn, "Successfully checked and updated FD data");


    return 0;
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports = 
{
    updateFDData
};
