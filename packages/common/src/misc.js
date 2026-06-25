const { statusMessage } = require("./logs");

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////// FUNCTIONS ////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


/* 
Function: sleep
Purpose: Returns a promise that resolves after ms milliseconds
Inputs: milliseconds
Output: Promise that resolves after ms milliseconds
*/
function sleep(ms) 
{
    // Get the funtion name for logging purposes
    const _fn = sleep.name;

    return new Promise(r => setTimeout(r, ms)); 
}


/* 
Function: getIdFromUrl
Purpose: Extracts the ID portion from the folder or file URL
Inputs: URL (string)
Output: ID (string)
Source: ChatGPT
*/
function getIdFromUrl(url) 
{
    // Get the funtion name for logging purposes
    const _fn = getIdFromUrl.name;
    
    let id = "";
    const match = /[-\w]{25,}/.exec(url);
    if (match) {
        id = match[0];
    } else if (/open\?id=(\w+)/.test(url)) {
        id = /open\?id=(\w+)/.exec(url)[1];
    } else if (/drive\/folders\/(\w+)/.test(url)) {
        id = /drive\/folders\/(\w+)/.exec(url)[1];
    } else if (/drive\/u\/\d+\/folders\/(\w+)/.test(url)) {
        id = /drive\/u\/\d+\/folders\/(\w+)/.exec(url)[1];
    } else if (/drive\/u\/\d+\/file\/d\/(\w+)\//.test(url)) {
        id = /drive\/u\/\d+\/file\/d\/(\w+)\//.exec(url)[1];
    } else if (/\/d\/(\w+)\//.test(url)) {
        id = /\/d\/(\w+)\//.exec(url)[1];
    } else if (/uc\?id=(\w+)&/.test(url)) {
        id = /uc\?id=(\w+)&/.exec(url)[1];
    } else if (/view\?usp=sharing&id=(\w+)/.test(url)) {
        id = /view\?usp=sharing&id=(\w+)/.exec(url)[1];
    } else {
        statusMessage(_fn, "Invalid URL: " , url);
    }
    return id;
}



/* 
Function: escapeHtml
Purpose: Escapes special characters from the HTML string
Inputs: string (with special characters)
Output: string with special characters escaped
Credits - https://github.com/janl/mustache.js/blob/master/mustache.js#L73
*/
const entityMap = 
{
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
};

function escapeHtml (string) 
{
    // Get the funtion name for logging purposes
    const _fn = escapeHtml.name;

    return String(string).replace(/[&<>"'`=/]/g, function fromEntityMap (s)
    {
        return entityMap[s];
    });
}


/*
Function: validateEmailAddress
Purpose: Checks if the email address is valid
Inputs: Email address to be checked
Output: true if the address is valid, false otherwise
*/
function validateEmailAddress(email_address)
{
    // Get the funtion name for logging purposes
    const _fn = validateEmailAddress.name;

    //let validRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
    const validRegex = /\S+@\S+\.\S+/;

    if (validRegex.test(email_address))
        return true;
    else
        return false;
}



/*
Function: parseEmail
Purpose: Parses the email list that is passed in, removes identified special characters and stores it as an array of email addresses
Inputs: Email list, Array of email addresses (output)
Output: none
*/
function parseEmail(this_email, this_email_arr)
{
    // Get the funtion name for logging purposes
    const _fn = parseEmail.name;

    let split_str = [];

    // First replace all the '[', ']', '{', '}', ' ' & '"' by ""
    this_email = this_email.toString().replace("[","");
    this_email = this_email.toString().replace("]","");
    this_email = this_email.toString().replace("{","");
    this_email = this_email.toString().replace("}","");
    this_email = this_email.toString().replace(/"+/g,"");

    split_str = this_email.toString().split(",");
  
    for(let i = 0; i < split_str.length; i++) 
    {
        if(split_str[i].toString().trim() == "") continue;
        
        let found = false;
        for(let j = 0; j < this_email_arr.length; j++)
        {
            if((split_str[i]).toString().trim() == this_email_arr[j])
            {
                found = true;
                break;
            }
        }

        // Add only if not found & non-blank
        if(found == false) this_email_arr.push((split_str[i]).toString().trim());
    }

    return;
}



/*
Function: getNameFromEmail
Purpose: Generates a name from the email address passed in
Inputs: email
Output: none
*/
function getNameFromEmail(email)
{
    // Get the funtion name for logging purposes
    const _fn = getNameFromEmail.name;
    
    let final = ""

    // Sanity check
    if(email.toString().trim() == "")
    {
        statusMessage(_fn, "Blank email");
        return "";
    }

    // Split the email at the '@'
    const offset = email.lastIndexOf("@");
    if(offset < 0)
    {
        statusMessage(_fn, "Invalid email: " , email);
        return "";
    }

    const name = email.substring(0, offset);
    if(name.toString().trim() == "")
    {
        statusMessage(_fn, "Failed to extract name from email: " , email);
        return "";
    }

    // Split the name at the period (.)
    let split_str = name.toString().split(".");

    // Convert to uppercase
    for(let i = 0; i < split_str.length; i++) split_str[i] = (split_str[i]).toUpperCase();

    // Join the split pieces
    for(let i = 0; i < split_str.length; i++)
    {
        if(i > 0) final += " ";
        final += split_str[i];
    }

    return final;
}



/*
Function: replaceSpecialChars
Purpose: Replaces special characters in the string passed in (as per the special_chars_list[]) with a specific character
Inputs: string in which special characters need to be replaced, list of special characters, character to replace with
Output: final string in which all special characters are replaced
*/
function replaceSpecialChars(string_to_replace, special_chars_list, char_to_replace_with)
{
    // Get the funtion name for logging purposes
    const _fn = replaceSpecialChars.name;

    for(let i = 0; i < special_chars_list.length; i++)
    {
        string_to_replace = string_to_replace.replaceAll(special_chars_list[i], char_to_replace_with);
    }

    // Make sure there are no double occurrences of the char_to_replace_with
    if(char_to_replace_with != '')
    {
        let double_char_to_replace_with = char_to_replace_with.toString() + char_to_replace_with.toString();
        while(string_to_replace.indexOf(double_char_to_replace_with) > -1)
        {
            string_to_replace = string_to_replace.replace(double_char_to_replace_with, char_to_replace_with);
        }
    }

    // Make sure the first and last character are not char_to_replace_with
    if(string_to_replace.indexOf(char_to_replace_with) == 0) string_to_replace = string_to_replace.substring(1);
    let reverse_string = string_to_replace.split("").reverse().join("");
    if(reverse_string.indexOf(char_to_replace_with) == 0) reverse_string = reverse_string.substring(1);
    string_to_replace = reverse_string.split("").reverse().join("");

    return string_to_replace;
}


/*
Function: replaceKnownSpecialCharsWithUnderscore
Purpose: Replaces 'known' special characters in the string passed in with '_'
Inputs: string in which special characters need to be replaced
Output: final string in which all special characters are replaced
*/
function replaceKnownSpecialCharsWithUnderscore(string_to_replace)
{
    // Get the funtion name for logging purposes
    const _fn = replaceKnownSpecialCharsWithUnderscore.name;

    const special_chars_list = [' ', ',', ':', ';', '.', '(', ')', '{', '}', '/', '\\', '"', '<', '>', '?', '&', '-'];
    const char_to_replace_with = '_';
    return replaceSpecialChars(string_to_replace, special_chars_list, char_to_replace_with);
}



/*
Function: matchWithinXPercent
Purpose: Checks if the 2 numbers are within 'percentage' distance of each other (i.e. 1+/-perc)
Inputs: number 1, number 2, percentage
Output: true if they are percentage distance, false otherwise
*/
function matchWithinXPercent(num_a, num_b, perc)
{
    // Get the funtion name for logging purposes
    const _fn = matchWithinXPercent.name;

    const num_a_plus_perc = num_a * (1 + perc);
    const num_a_minus_perc = num_a * (1 - perc);
    const num_b_plus_perc = num_b * (1 + perc);
    const num_b_minus_perc = num_b * (1 - perc);

    // If either num_a is within num_b_plus_perc or num_b_minus_perc, return true
    if((num_a >= num_b_minus_perc) && (num_a <= num_b_plus_perc)) return true;

    // If either num_b is within num_a_plus_perc or num_a_minus_perc, return true
    if((num_b >= num_a_minus_perc) && (num_b <= num_a_plus_perc)) return true;

    return false;
}


/*
Function: checkType
Purpose: Checks for the type of element passed in
Inputs: element
Output: type of element (array, date, object, string, number)
*/
function checkType(element) 
{
    // Get the funtion name for logging purposes
    const _fn = checkType.name;

    if (Array.isArray(element)) return "array";
    else if (element instanceof Date) return "date";
    else if (typeof element === 'object') 
    {
        // Attempt to create a Date object from the string
        const dateObject = new Date(element);
        // Check if the dateObject is a valid date
        if (!isNaN(dateObject.getTime())) return "date";
        else return "object";
    }
    else return typeof (element);
}


/*
Function: flattenStructure
Purpose: Flattens out the structure passed in to show all members of constituent arrays or structures. It's invoked recursively
Inputs: structure, flattended output, prefix for the field (if any), new data array (to also store the flattened data in), row index in the new data array
Output: flattended structured in flattened {}, also copy of the flattened structure in new_data_array[row]
Source: ChatGPT
*/
function flattenStructure(structure, parentKey = '', result = {})
{
    // Get the funtion name for logging purposes
    const _fn = flattenStructure.name;

    // Sanity check
    if (structure === null || structure === undefined)
    {
        return result;
    }

    for (const [key, value] of Object.entries(structure))
    {
        const newKey = parentKey ? `${parentKey}.${key}` : key;

        // If the value is null or undefined, set it to an empty string
        if(value == null || value === undefined)
        {
            result[newKey] = "";
        }
        // If it's an array of objects, we want to flatten each object in the array with an index
        else if(Array.isArray(value))
        {
            for(let i = 0; i < value.length; i++)
            {
                const arrayItem = value[i];
                const arrayItemKey = `${newKey}[${i}]`;

                // Nested object inside array
                if(arrayItem !== null && typeof arrayItem === 'object')
                {                    
                    flattenStructure(arrayItem, arrayItemKey, result);
                }
                else if(arrayItem === null || arrayItem === undefined)
                {
                    result[arrayItemKey] = "";
                }
                // Primitive value inside array
                else
                {
                    result[arrayItemKey] = arrayItem;
                }
            }
        }
        // If it's an object, we want to flatten its properties
        else if(value !== null && typeof value === 'object')
        {            
            flattenStructure(value, newKey, result);
        }
        // Primitive value
        else
        {
            result[newKey] = value;
        }
    }

    return result;
}


/*
Function: convertNestedDatato2DArray
Purpose: Converts an array of objects with potentially nested objects/arrays into a 2D array with flattened headers. 
The first row of the output is the header row with flattened keys, and the subsequent rows are the corresponding values.
Inputs: data_array - array of objects to be converted
Output: 2D array with flattened headers and corresponding values
*/
function convertNestedDatato2DArray(data_array)
{
    // Get the funtion name for logging purposes
    const _fn = convertNestedDatato2DArray.name;
    
    // Sanity check
    if(!data_array || data_array.length === 0)
    {
        return [];
    }
 
    // Flatten the data array if it is an array of objects with nested objects/arrays
    const flattened = [];    
    for(let i = 0; i < data_array.length; i++)
    {
        const obj = data_array[i];
        const flattenedObj = flattenStructure(obj, '', {});
        flattened.push(flattenedObj);
    }

    // Get all unique keys to form the header row
    let headers = [];
    for (let i = 0; i < flattened.length; i++)
    {
        const row = flattened[i];
        for (const key in row)
        {
            // Add header only if not present already
            let exists = false;
            for (let j = 0; j < headers.length; j++)
            {
                if (headers[j] === key)
                {
                    exists = true;
                    break;
                }
            }
            if (!exists)
            {
                headers.push(key);
            }
        }
    }

    // Build out the rows based on the headers
    let rows = [];
    for (let i = 0; i < flattened.length; i++)
    {
        const row = flattened[i];
        let rowArray = [];

        for (let j = 0; j < headers.length; j++)
        {
            const header = headers[j];
            rowArray.push(row[header] !== undefined ? row[header] : "");
        }
        rows.push(rowArray);
    }

    const values = [headers, ...rows];

    return values;
}


/* 
Function: getLastRowAndCol
Purpose: Returns the last row and column indices of a 2 dimensional array (array of arrays) which represents the data in a spreadsheet. 
The last row and column are determined based on the presence of non-empty values.
Inputs: 2 dimensional array representing the data in a spreadsheet
Output: Object with lastRow and lastColumn properties
*/
function getLastRowAndCol(sheet_data) 
{
    // Get the funtion name for logging purposes
    const _fn = getLastRowAndCol.name;

    // Locate the last row
    const rows = sheet_data || [];
    const lastRow = rows.length;

    // find the maximum non-empty columns among all rows
    let lastColumn = 0;
    for (const row of rows) 
    {
        if (row.length > lastColumn) lastColumn = row.length;
    }

    return { lastRow, lastColumn };
}



/*
Function: sameStringSet
Purpose: Checks if 2 arrays have the same set of strings (order doesn't matter)
Inputs: String arrays a and b
Output: boolean indicating if the arrays have the same set of strings
Source: ChatGPT
*/
function sameStringSet(a = [], b = [])
{
    // Get the funtion name for logging purposes
    const _fn = sameStringSet.name;

    if (a.length !== b.length) return false;
    
    const sa = new Set(a);
    if (sa.size !== b.length) return false;
    
    return b.every(x => sa.has(x));
}


//
// Levenshtein Distance Function for Google Sheets
// 
// This function calculates de Levenshtein Distance (or Edit Distance) between two strings.
// I used the algorith and code from Wikipedia (https://en.wikipedia.org/wiki/Levenshtein_distance)
// as a reference and just adjusted the code to be used on Google Sheets.
//
// By: Manoel Lemos / manoel@lemos.net / http://manoellemos.com
//
// IMPORTANT: I added some code in the begining of the function to try to solve the issues
// related to rate-limit of App Scripts in Google Sheets. There is a limit of how many times
// per second you can call external funcions on Google Sheets. The code is a bit dumb and makes
// everything much slower, but it worked for me. You can comment it if you don't need too many
// calls (you'll have much faster response times).
//
 
/*
Function: LevDis
Purpose: Calculates the Levenshtein Distance (or Edit Distance) between two strings
Inputs: Two strings s and t
Output: The Levenshtein Distance between the two strings
Source: Manoel Lemos / manoel@lemos.net / http://manoellemos.com
*/
function LevDis(s,t)
{
    // Get the function name for logging purposes
    const _fn = LevDis.name;
    
    // Workaround on Google Sheets rate-limit for external functions 
    //let sleep = Math.floor((Math.random() * 3000) + 1);
    //Utilities.sleep(3000+sleep);
    
    // The code
    if (s == t) return 0;
    if (s.length == 0) return t.length;
    if (t.length == 0) return s.length;
  
    let v0 = [];
    let v1 = [];
    let i;
    let j;
    let cost;
  
    for (i = 0; i < (t.length+1); i++) 
    {
        v0[i] = i;
    }
  
    for(i = 0; i < s.length; i++)
    {
        v1[0] = i + 1;  
        for(j = 0; j < t.length; j++)
        {
            if (s[i] == t[j])
            {
                cost = 0;
            }
            else
            {
                cost = 1;
            }
            v1[j + 1] = Math.min(v1[j] + 1, v0[j + 1] + 1, v0[j] + cost);
        }
        for(j = 0; j < (t.length+1); j++) 
        {
            v0[j] = v1[j];
        }
    }

    return v1[t.length];  
}


/*
Function: mergeObjects
Purpose: Merges the properties of the source object into the target object
Inputs: target object and source object
Output: target object with merged properties
*/
function mergeObjects(target, source)
{
    for (const key in source)
    {
        target[key] = source[key];
    }
}


/*
Function: getByPath
Purpose: Retrieves the value at a given path within an object
Inputs: object and path string (dot-separated)
Output: value at the specified path or undefined if not found
*/
function getByPath(obj, path)
{
    const parts = path.split(".");
    let current = obj;

    for (const part of parts)
    {
        if (current == null) return undefined;
        current = current[part];
    }

    return current;
}


/*
Function: combineObjects
Purpose: Combines multiple objects from an array into a single object
Inputs: array of objects and keys to combine
Output: array of combined objects
*/
function combineObjects(array, keys)
{
    let output_array = [];

    for(let i = 0; i < array.length; i++)
    {
        const arr = array[i];
        const combined = {};

        if(keys)
        {
            for(let j = 0; j < keys.length; j++)
            {
                const key = keys[j];
                const obj = getByPath(arr, key);
                if (!obj) continue; // skip null/undefined

                mergeObjects(combined, obj);
            }
        }
        else
        {
            mergeObjects(combined, arr);
        }

        output_array.push(combined);
    }

    return output_array;
}


/*
Function: checkandHandleBlank
Purpose: Checks if a value is blank (undefined, null, or empty string) and handles it
Inputs: value to check
Output: trimmed string or empty string if blank
*/
function checkandHandleBlank(value)
{
    if(value === undefined || value === null)
        return "";
    else return value.toString().trim();
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////// EXPORTS /////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// Exporting the functions
module.exports = 
{
    sleep,
    getIdFromUrl,
    escapeHtml,
    validateEmailAddress,
    parseEmail,
    getNameFromEmail,
    replaceSpecialChars,
    replaceKnownSpecialCharsWithUnderscore,
    matchWithinXPercent,
    checkType,
    flattenStructure,
    convertNestedDatato2DArray,
    getLastRowAndCol,
    sameStringSet,
    LevDis,
    mergeObjects,
    getByPath,
    combineObjects,
    checkandHandleBlank
};

