/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////// FUNCTIONS ////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Buffer to store execution logs
const execution_logs = [];


/* 
Function: getExecutionLogs
Purpose: Retrieve the execution logs
Inputs: none
Output: execution logs as a string
*/
function getExecutionLogs()
{
    return execution_logs.join("\n");
}


/* 
Function: clearExecutionLogs
Purpose: Clear the execution logs
Inputs: none
Output: none
*/
function clearExecutionLogs()
{
    execution_logs.length = 0; // Clear the array
    return;
}


/* 
Function: statusMessage
Purpose: Log the message to execution logs
Inputs: calling_func - name of the calling function, message - message to log and display
Output: none
*/
function statusMessage(calling_func, ...args)
{
    const message = `${calling_func} : ${args.join(" ")}`;
    
    // Push the message to the execution_logs
    execution_logs.push(message);

    // Log the message to the console
    console.log(calling_func, ":", ...args);

    return;
}

// Color palette for console logs
const colors = 
{
    reset: "\x1b[0m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
};


/* 
Function: start_test
Purpose: Log the start of a test
Inputs: fn_name - name of the test function
Output: none
*/
function start_test(fn_name)
{
    console.log(`${colors.cyan}`, "********** START TEST: ", fn_name, " **********", `${colors.reset}`);
}

/* 
Function: end_test
Purpose: Log the end of a test
Inputs: fn_name - name of the test function
Output: none
*/
function end_test(fn_name)
{
    console.log(`${colors.cyan}`, "********** END TEST: ", fn_name, " **********\n", `${colors.reset}`);
}

/* 
Function: start_test_suite
Purpose: Log the start of a test suite
Inputs: suite_name - name of the test suite
Output: none
*/
function start_test_suite(suite_name)
{
    console.log("\n",`${colors.magenta}`);
    console.log("************************************************************************");
    console.log("Starting tests for ", suite_name, " !!!\n", `${colors.reset}`);
}

/* 
Function: end_test_suite
Purpose: Log the end of a test suite
Inputs: suite_name - name of the test suite
Output: none
*/
function end_test_suite(suite_name)
{
    console.log(`${colors.magenta}`);
    console.log("Ending tests for ", suite_name, " !!!");
    console.log("************************************************************************\n", `${colors.reset}`);
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////// EXPORTS /////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Exporting the functions
module.exports = 
{ 
    statusMessage,
    getExecutionLogs,
    clearExecutionLogs,
    start_test,
    end_test,
    start_test_suite,
    end_test_suite,
};

