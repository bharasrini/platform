const ExcelJS = require("exceljs");
const fs = require("fs/promises");
const path = require("path");
const { statusMessage } = require("./logs");
const { convertNestedDatato2DArray } = require("./misc");

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////// FUNCTIONS ////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


/* 
Function: exportToExcelFile
Purpose: Exports data to an Excel file
Inputs: data_array - Array of data to be exported, dir_name - Directory name to save the file, file_name - Name of the Excel file, sheet_name - Name of the sheet
Output: 0 on success, -1 on failure
*/
async function exportToExcelFile(data_array, dir_name, file_name, sheet_name)
{
    // Get the function name for logging purposes
    const _fn = exportToExcelFile.name;
    
    // Sanity check - if data_array is empty, return without creating the file
    if (!data_array || data_array.length === 0)
    {
        statusMessage(_fn, "No data to export");
        return 0;
    }

    // Flatten the data and convert to 2D array format for Excel export
    const [headers, ...rows] = convertNestedDatato2DArray(data_array);

    try
    {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(sheet_name || "Sheet1");

        // Write out the header row
        const columns = [];
        for (let i = 0; i < headers.length; i++)
        {
            const key = headers[i];
            columns.push(
            {
                header: key,
                key: key,
                width: 20
            });
        }
        worksheet.columns = columns;
        

        // Write out the data rows
        rows.forEach(row => worksheet.addRow(row));

        // Ensure output folder exists
        const base_path = process.cwd();
        const output_dir = path.join(base_path, dir_name);
        await fs.mkdir(output_dir, { recursive: true });

        const fullPath = path.join(output_dir, file_name);
        await workbook.xlsx.writeFile(fullPath);

        statusMessage(_fn, "Excel file saved at: " , fullPath);
    }
    catch(e)
    {
        statusMessage(_fn, "Error exporting Excel file: " , e);
        return -1;
    }

    return 0;
}


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////// EXPORTS /////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Exporting the functions
module.exports = 
{ 
    exportToExcelFile
};
