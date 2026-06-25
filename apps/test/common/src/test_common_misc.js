const common = require("@fyle-ops/common");

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function test_sleep()
{
    // Get function name for logging
    const _fn = test_sleep.name;

    common.start_test(_fn);

    common.statusMessage(_fn, "Sleeping for 3 seconds...");
    await common.sleep(3000);
    common.statusMessage(_fn, "Awake now!");

    common.end_test(_fn);
}

async function test_getIdFromUrl()
{
    // Get function name for logging
    const _fn = test_getIdFromUrl.name;

    common.start_test(_fn);

    const url = "https://drive.google.com/drive/folders/1LNU3tU8F3gRoncR1kpGCfJad9zTvTteW";
    const id = common.getIdFromUrl(url);
    common.statusMessage(_fn, "URL: ", url, ", Extracted ID: ", id);

    common.end_test(_fn);
}


async function test_escapeHtml()
{
    // Get function name for logging
    const _fn = test_escapeHtml.name;

    common.start_test(_fn);

    const html_str = "<div>Hello & welcome to <b>Fyle</b>!</div>";
    const escaped_str = common.escapeHtml(html_str);
    common.statusMessage(_fn, "HTML Str: ", html_str, ", Escaped HTML: ", escaped_str);

    common.end_test(_fn);
}

async function test_validateEmailAddress()
{
    // Get function name for logging
    const _fn = test_validateEmailAddress.name;

    common.start_test(_fn);

    const email = "test@example.com";
    const is_valid = common.validateEmailAddress(email);
    common.statusMessage(_fn, "Set1: Email: ", email, ", Is valid email: ", is_valid);

    const email2 = "invalid-email";
    const is_valid2 = common.validateEmailAddress(email2);
    common.statusMessage(_fn, "Set2: Email: ", email2, ", Is valid email: ", is_valid2);

    common.end_test(_fn);
}

async function test_parseEmail()
{
    // Get function name for logging
    const _fn = test_parseEmail.name;
    
    common.start_test(_fn);

    const email_list = "bharadwaj.srinivasan@fyle.in, bharasrini@yahoo.com, test.user@domain";
    const email_out = [];
    common.parseEmail(email_list, email_out);
    common.statusMessage(_fn, "Email list: ", email_list, ", Parsed email: ", email_out);

    common.end_test(_fn);
}

async function test_getNameFromEmail()
{
    // Get function name for logging
    const _fn = test_getNameFromEmail.name;

    common.start_test(_fn);

    const email = "bharadwaj.srinivasan@fyle.in";
    const name = common.getNameFromEmail(email);
    common.statusMessage(_fn, "Email: ", email, ", Extracted name: ", name);

    common.end_test(_fn);
}

async function test_replaceSpecialChars()
{
    // Get function name for logging
    const _fn = test_replaceSpecialChars.name;

    common.start_test(_fn);

    const str = "Hello, World/2024(Test)?";
    const special_chars_list = [' ', ',', ':', ';', '.', '(', ')', '{', '}', '/', '\\', '"', '<', '>', '?', '&', '-'];
    const char_to_replace_with = '+';
    const replaced_str = common.replaceSpecialChars(str, special_chars_list, char_to_replace_with);
    common.statusMessage(_fn, "Original string: ", str, ", Replaced string: ", replaced_str);

    common.end_test(_fn);
}

async function test_replaceKnownSpecialCharsWithUnderscore()
{
    // Get function name for logging
    const _fn = test_replaceKnownSpecialCharsWithUnderscore.name;

    common.start_test(_fn);

    const str = "Hello, World/2024(Test)?";
    const replaced_str = common.replaceKnownSpecialCharsWithUnderscore(str);
    common.statusMessage(_fn, "Original string: ", str, ", Replaced string: ", replaced_str);

    common.end_test(_fn);
}

async function test_matchWithinXPercent()
{
    // Get function name for logging
    const _fn = test_matchWithinXPercent.name;

    common.start_test(_fn);

    const num1 = 100;
    const num2 = 105;
    const percent = 0.1; // 10%
    const is_within = common.matchWithinXPercent(num1, num2, percent);
    common.statusMessage(_fn, "Set 1: Num1: ", num1, ", Num2: ", num2, ", Percent: ", percent, ", Is within: ", is_within);

    const num1_2 = 100;
    const num2_2 = 120;
    const percent_2 = 0.1;  // 10%
    const is_within_2 = common.matchWithinXPercent(num1_2, num2_2, percent_2);
    common.statusMessage(_fn, "Set 2: Num1: ", num1_2, ", Num2: ", num2_2, ", Percent: ", percent_2, ", Is within: ", is_within_2);

    common.end_test(_fn);
}

async function test_checkType()
{
    // Get function name for logging
    const _fn = test_checkType.name;

    common.start_test(_fn);

    const value = [1,2,3];
    const is_type = common.checkType(value);
    common.statusMessage(_fn, "Set 1: Value: ", value, ", Is type: ", is_type);

    const object_value = {key: "value"};
    const is_type_2 = common.checkType(object_value);
    common.statusMessage(_fn, "Set 2: Value: ", object_value, ", Is type: ", is_type_2);

    const date_value = new Date();
    const is_type_3 = common.checkType(date_value);
    common.statusMessage(_fn, "Set 3: Value: ", date_value, ", Is type: ", is_type_3);

    common.end_test(_fn);
}

async function test_flattenStructure()
{
    // Get function name for logging
    const _fn = test_flattenStructure.name;

    common.start_test(_fn);

    const nested_object = {key: "value", arr: [1,2,3], obj: {nested_key: "nested_value"}};
    const result = common.flattenStructure(nested_object, '', {});
    common.statusMessage(_fn, "Nested object: ", nested_object, ", Flattened result: ", result);

    common.end_test(_fn);
}

async function test_convertNestedDatato2DArray()
{
    // Get function name for logging
    const _fn = test_convertNestedDatato2DArray.name;

    common.start_test(_fn);
    
    const data_array = 
    [
        {
            id: 101,
            name: "Bharadwaj",
            contact: 
            {
                email: "bharadwaj.srinivasan@fyle.in",
                phone: "99999"
            },
            tags: ["cs", "india"],
            addresses: 
            [
                { type: "home", city: "Bangalore", pin: 560001 },
                { type: "office", city: "ECity", pin: 560100 }
            ],
            active: true
        },
        {
            id: 102,
            name: "John Doe",
            contact: 
            {
                email: "john.doe@example.com",
                phone: null       // tests null handling
            },
            tags: ["cs", "usa"],
            addresses: [],
            active: false
        }
    ];

    const [headers, ...rows] = common.convertNestedDatato2DArray(data_array);
    common.statusMessage(_fn, "Data Array: ", data_array);
    common.statusMessage(_fn, "Headers: ", headers);
    common.statusMessage(_fn, "Rows: ", rows);

    common.end_test(_fn);
}

async function test_getLastRowAndCol()
{
    // Get function name for logging
    const _fn = test_getLastRowAndCol.name;

    common.start_test(_fn);

    const data1 = 
    [
        ["id", "name", "age"],
        [1, "Alice", 30],
        [2, "Bob", 25],
        [3, "Charlie", 35]
    ];

    const data2 = 
    [
        ["id", "name", "email", "phone"],
        [1, "Alice"],
        [2, "Bob", "bob@example.com"],
        [3]
    ];

    const data3 = 
    [
        ["A", "B", "C"],
        [],
        ["X", "Y"],
        [],
        ["P", "Q", "R", "S"]
    ];

    const {lastRow: num_rows1, lastColumn: num_cols1} = common.getLastRowAndCol(data1);
    common.statusMessage(_fn, "Data 1: ", data1, ", Last Row: ", num_rows1, ", Last Col: ", num_cols1);

    const {lastRow: num_rows2, lastColumn: num_cols2} = common.getLastRowAndCol(data2);
    common.statusMessage(_fn, "Data 2: ", data2, ", Last Row: ", num_rows2, ", Last Col: ", num_cols2);

    const {lastRow: num_rows3, lastColumn: num_cols3} = common.getLastRowAndCol(data3);
    common.statusMessage(_fn, "Data 3: ", data3, ", Last Row: ", num_rows3, ", Last Col: ", num_cols3);

    common.end_test(_fn);
}

async function test_sameStringSet()
{
    // Get function name for logging
    const _fn = test_sameStringSet.name;

    common.start_test(_fn);

    const set1 = ["a", "b", "c"];
    const set2 = ["c", "b", "a"];
    const are_same = common.sameStringSet(set1, set2);
    common.statusMessage(_fn, "Set 1: ", set1, ", Set 2: ", set2, ", Are same sets: ", are_same);

    const set3 = ["a", "b", "c"];
    const set4 = ["a", "b", "d"];
    const are_same_2 = common.sameStringSet(set3, set4);
    common.statusMessage(_fn, "Set 3: ", set3, ", Set 4: ", set4, ", Are same sets: ", are_same_2);

    common.end_test(_fn);
}


async function test_levDistance()
{
    // Get function name for logging
    const _fn = test_levDistance.name;

    common.start_test(_fn);

    const str1 = "kitten";
    const str2 = "sitting";
    const distance = common.LevDis(str1, str2);
    common.statusMessage(_fn, "String 1: ", str1, ", String 2: ", str2, ", Levenshtein Distance: ", distance);

    const str3 = "flaw";
    const str4 = "lawn";
    const distance2 = common.LevDis(str3, str4);
    common.statusMessage(_fn, "String 1: ", str3, ", String 2: ", str4, ", Levenshtein Distance: ", distance2);

    common.end_test(_fn);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function test_common_misc()
{
    // Get function name for logging
    const _fn = test_common_misc.name;

    common.start_test_suite("Common Miscellaneous Functions");
    
    // Misc functions
    if(process.env.RUN_TEST_COMMON_SLEEP === "true") await test_sleep();
    if(process.env.RUN_TEST_COMMON_GET_ID_FROM_URL === "true") await test_getIdFromUrl();
    if(process.env.RUN_TEST_COMMON_ESCAPE_HTML === "true") await test_escapeHtml();
    if(process.env.RUN_TEST_COMMON_VALIDATE_EMAIL_ADDRESS === "true") await test_validateEmailAddress();
    if(process.env.RUN_TEST_COMMON_PARSE_EMAIL === "true") await test_parseEmail();
    if(process.env.RUN_TEST_COMMON_GET_NAME_FROM_EMAIL === "true") await test_getNameFromEmail();
    if(process.env.RUN_TEST_COMMON_REPLACE_SPECIAL_CHARS === "true") await test_replaceSpecialChars();
    if(process.env.RUN_TEST_COMMON_REPLACE_KNOWN_SPECIAL_CHARS_WITH_UNDERSCORE === "true") await test_replaceKnownSpecialCharsWithUnderscore();
    if(process.env.RUN_TEST_COMMON_MATCH_WITHIN_X_PERCENT === "true") await test_matchWithinXPercent();
    if(process.env.RUN_TEST_COMMON_CHECK_TYPE === "true") await test_checkType();
    if(process.env.RUN_TEST_COMMON_FLATTEN_STRUCTURE === "true") await test_flattenStructure();
    if(process.env.RUN_TEST_COMMON_CONVERT_NESTED_DATA_TO_2D_ARRAY === "true") await test_convertNestedDatato2DArray();
    if(process.env.RUN_TEST_COMMON_GET_LAST_ROW_AND_COL === "true") await test_getLastRowAndCol();
    if(process.env.RUN_TEST_COMMON_SAME_STRING_SET === "true") await test_sameStringSet();
    if(process.env.RUN_TEST_COMMON_LEV_DIS === "true") await test_levDistance();

    common.end_test_suite("Common Miscellaneous Functions");
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports = 
{
    test_common_misc
};