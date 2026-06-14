const { formatInTimeZone } = require("date-fns-tz");
const common = require("@fyle-ops/common");
const { createInvoiceItem, createInvoice } = require("@fyle-ops/stripe");


// Array to hold the charges for which we need to create invoices
const charges = [];

// number of charges processed
let num_charges = 0;

/* 
Function: readCharges
Purpose: Reads in the charges data from the 'charges' sheet
Inputs: none
Output: 0 on success, -1 otherwise. List of charges populated in charges []
*/
async function readCharges()
{
    // Get the function name for logging purposes
    const fn = readCharges.name;

    // Charges input sheet ID
    const sheet_id = process.env.STRIPE_CHARGES_TO_CREATE_FILE_ID;

    // Sheet that has billing data input
    const sheet_name = process.env.STRIPE_CHARGES_TO_CREATE_SHEET_NAME;

    // Read data from this sheet. Set range to null to read the entire sheet
    const data = await common.readDataFromGoogleSheet(sheet_id, sheet_name, null);
    if(data == null)
    {
        common.statusMessage(fn, "Error reading data from Google Sheet id: ", sheet_id, ", sheet name: ", sheet_name);
        return -1;
    }
    
    // Initialize variables to read the billing entries
    const start_row = 1;
    const header_row = start_row;
    const data_row = start_row + 1;
    const start_col = 1;
    const {lastRow: num_rows, lastColumn: num_cols} = common.getLastRowAndCol(data);

    // Columns that we care about
    const cols = 
    {
        "customer_id_col": -1,
        "currency_col": -1,
        "type_col": -1,
        "plan_col": -1,
        "frequency_col": -1,
        "quantity_col": -1,
        "unit_amount_col": -1,
        "discount_type_col": -1,
        "discount_col": -1,
        "period_start_col": -1,
        "period_end_col": -1,
    };

    // First read in the header row and ensure that we have all columns updated
    for(let i = start_col; i < num_cols + 1; i++)
    {
        const this_key = common.checkandHandleBlank(data[header_row-1][i-1]);
        if(this_key == "customer_id") cols.customer_id_col = i;
        else if(this_key == "currency") cols.currency_col = i;
        else if(this_key == "type") cols.type_col = i;
        else if(this_key == "plan") cols.plan_col = i;
        else if(this_key == "frequency") cols.frequency_col = i;
        else if(this_key == "quantity") cols.quantity_col = i;
        else if(this_key == "unit_amount") cols.unit_amount_col = i;
        else if(this_key == "discount_type") cols.discount_type_col = i;
        else if(this_key == "discount") cols.discount_col = i;
        else if(this_key == "period_start") cols.period_start_col = i;
        else if(this_key == "period_end") cols.period_end_col = i;
    }

    
    // Check that we have all columns updated
    let found_cols = true;
    for(const key in cols)
    {
        if(cols[key] < 0)
        {
            found_cols = false;
            common.statusMessage(fn, "Unable to locate column for : " + key);
            break;
        }
    }

    // Exit if we were not able to find all columns
    if(found_cols == false)
    {
        common.statusMessage(fn, "Unable to locate column, exiting");
        return -1;
    }

    // At this point, we have all columns mapped, now read the data in
    for(let i = data_row; i < num_rows + 1; i++)
    {
        const customer_id = common.checkandHandleBlank(data[i-1][cols.customer_id_col-1]);
        if(customer_id == "") break;

        const this_charge = 
        {
            customer_id: customer_id,
            currency: common.checkandHandleBlank(data[i-1][cols.currency_col-1]),
            type: common.checkandHandleBlank(data[i-1][cols.type_col-1]),
            plan: common.checkandHandleBlank(data[i-1][cols.plan_col-1]),
            frequency: common.checkandHandleBlank(data[i-1][cols.frequency_col-1]),
            quantity: common.checkandHandleBlank(data[i-1][cols.quantity_col-1]),
            unit_amount: common.checkandHandleBlank(data[i-1][cols.unit_amount_col-1]),
            discount_type: common.checkandHandleBlank(data[i-1][cols.discount_type_col-1]),
            discount: common.checkandHandleBlank(data[i-1][cols.discount_col-1]),
            period_start: common.checkandHandleBlank(data[i-1][cols.period_start_col-1]),
            period_end: common.checkandHandleBlank(data[i-1][cols.period_end_col-1])
        };

        charges.push(this_charge);
    }

    return 0;    
}



/* 
Function: logInvoicesCreated
Purpose: Logs the creation of invoices to the 'invoices_created' sheet.
Inputs: none
Output: 0 on success, -1 on failure
*/
async function logInvoicesCreated()
{
    // Get the function name for logging purposes
    const fn = logInvoicesCreated.name;

    // Construct the file name using the account name
    const today_date = formatInTimeZone(new Date(), "UTC", "yyyy_MM_dd");
    const file_name = process.env.STRIPE_CREATE_INVOICE_LOGS_FILE_NAME_PREFIX + "("+ today_date + ")";

    // Stripe Invoices folder ID
    const folder_id = process.env.STRIPE_CREATE_INVOICE_LOGS_FOLDER_ID;

    // sheet name within the file where we will log the invoices created
    const sheet_name = process.env.STRIPE_CREATE_INVOICE_LOGS_SHEET_NAME;

    // Create a spreadsheet for the billing data output
    const spreadsheet_id = await common.GoogleSheet_createGoogleSpreadsheet(folder_id, file_name);
    if(spreadsheet_id == null)
    {
        common.statusMessage(fn, "Failed to create spreadsheet for billing data with name: ", file_name);
        return -1;
    }

    // Write out the invoices created data to the sheet
    if(await common.writeDataArrayToGoogleSheet(charges, folder_id, file_name, sheet_name, true, true) < 0)
    {
        common.statusMessage(fn, "Failed to write invoices created data to Google Sheet");
        return -1;
    }

    // Delete 'Sheet1' that was created by default in the output spreadsheet
    const sheet_to_delete = process.env.STRIPE_CREATE_INVOICE_LOGS_DEFAULT_SHEET_TO_DELETE;
    await common.deleteSheetInGoogleSpreadsheet(folder_id, file_name, sheet_to_delete);

    return 0;
}


/* 
Function: create_stripe_invoices
Purpose: Main function for the script
Inputs: none
Output: Creates draft invoices on Stripe
*/
async function create_stripe_invoices()
{
    // Get the function name for logging purposes
    const fn = create_stripe_invoices.name;

    common.statusMessage(fn, " ****************** Create Stripe Invoices Start ****************** ");

    // Read all charges from the 'charges' sheet
    if(await readCharges() < 0)
    {
        common.statusMessage(fn, "Failed to read charges, exiting");
        return -1;
    }

    // Loop through and read all charges
    for(let i = 0; i < charges.length; i++)
    {
        const customer_id = charges[i].customer_id;
        const currency = charges[i].currency;
        const plan = charges[i].plan;
        const frequency = charges[i].frequency;
        const type = charges[i].type;
        const quantity = charges[i].quantity;
        const unit_amount = charges[i].unit_amount;
        const discount_type = charges[i].discount_type; 
        const discount = charges[i].discount;

        let fees_type = "";
        let usage_qualify_str = "";

        // Set description based on the type of charge
        if(type == "subscription")
        {
            fees_type = "Subscription Fees";
            usage_qualify_str = " for a minimum commitment of ";
        }
        else if(type == "overage")
        {
            fees_type = "Overage Fees";
            usage_qualify_str = " for an overage of ";
        }
        else fees_type = "Fees";


        // Format start and end dates for creating the description for the invoice item
        const period_start_date = common.googleSheetToUTCDate(charges[i].period_start);
        const period_start_str = formatInTimeZone(period_start_date, "UTC", "dd-MMM-yyyy");

        const period_end_date = common.googleSheetToUTCDate(charges[i].period_end);
        const period_end_str = formatInTimeZone(period_end_date, "UTC", "dd-MMM-yyyy");

        const description = "Fyle " + plan + " - " + frequency + ": " + fees_type + " for the period of " + period_start_str + " to " + period_end_str + usage_qualify_str + quantity + " users";

        // Create the Invoice item
        const invoice_item = await createInvoiceItem(customer_id, currency, quantity, unit_amount, discount_type, discount, description);
        if(invoice_item == "")
        {
            common.statusMessage(fn, "createInvoiceItem failed for customer_id" + customer_id + ", currency: " + currency + ", quantity: " + quantity + ", unit_amount: " + unit_amount + ", discount_type: " + discount_type + ", discount: " + discount);
            continue;
        }
        
        const invoice_id = await createInvoice(customer_id);
        if(invoice_id == "")
        {
            common.statusMessage(fn, "createInvoice failed for customer_id" + customer_id + ", currency: " + currency + ", quantity: " + quantity + ", unit_amount: " + unit_amount + ", discount_type: " + discount_type + ", discount: " + discount);
            continue;
        }

        // Log the invoice ID created for this charge back in the charges array for logging purposes later
        charges[i].invoice = invoice_id;

        num_charges++;
    }

    // Log details of the invoices created
    await logInvoicesCreated();

    common.statusMessage(fn, "Status: Draft invoices created for ", num_charges, " charges detailed in the 'charges' sheet");

    common.statusMessage(fn, " ****************** Create Stripe Invoices End ****************** ");

    return 0;
}



module.exports = 
{
    create_stripe_invoices,
}

