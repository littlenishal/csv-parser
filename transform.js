// Import required libraries
const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

// Import the decline codes mapping
const ficoMapping = {
  1: 'Amount owed on accounts is too high',
  2: 'Level of delinquency on accounts',
  3: 'Too few bank/national revolving accounts',
  4: 'Too many bank/national revolving accounts',
  5: 'Too many accounts with balances',
  6: 'Too many consumer finance company accounts',
  7: 'Account payment history is too new to rate',
  8: 'Too many inquiries last 12 months',
  9: 'Too many accounts recently opened',
  10: 'Ratio of balance to limit on bank revolving or other revolving accounts is too high',
  11: 'Amount owed on revolving accounts is too high',
  12: 'Length of time revolving accounts have been established',
  13: 'Time since delinquency is too recent or unknown',
  14: 'Length of time accounts have been established',
  15: 'Lack of recently reported accounts',
  16: 'Lack of recent revolving account information',
  17: 'No recent non-mortgage balance information',
  18: 'Number of accounts with delinquency',
  19: 'Too few accounts currently paid as agreed',
  20: 'Time since derogatory public record or collection is too short',
  21: 'Amount past due on accounts',
  24: 'No recent revolving balances',
  25: 'Length of time installment loans have been established',
  26: 'Number of revolving accounts',
  28: 'Number of established accounts',
  29: 'No recent bank/national revolving balances',
  30: 'Time since most recent account opening is too short',
  31: 'Too few accounts with recent payment information',
  32: 'Lack of recent installment loan information',
  33: 'Proportion of loan balances to loan amounts is too high',
  34: 'Amount owed on delinquent accounts',
  36: 'Length of time open installment loans have been established',
  37: 'Number of finance company accounts established relative to length of finance history',
  38: 'Serious delinquency, and public record or collection filed ',
  39: 'Serious delinquency',
  40: 'Derogatory public record or collection filed',
  43: 'Too many revolving accounts with high balance compared to credit limit',
  46: 'Payments due on accounts',
  53: 'Amount paid down on open mortgage loans is too low',
  55: 'Amount paid down on open installment loans is too low',
  56: 'Lack of recently reported installment accounts',
  58: 'Proportion of balances to loan amounts on mortgage accounts is too high',
  59: 'Lack of recent revolving home equity line of credit information',
  62: 'Ratio of balances to credit limits on revolving home equity line of credit accounts is too high',
  64: 'Ratio of revolving home equity line of credit balances to total revolving balances is too high',
  65: 'Length of time bank/national revolving accounts have been established',
  67: 'Length of time open mortgage loans have been established',
  70: 'Amount owed on mortgage loans is too high',
  71: 'Too many recently opened installment accounts',
  77: 'Proportion of balances to loan amounts on auto accounts is too high',
  78: 'Length of time reported mortgage accounts have been established',
  79: 'Lack of recent reported mortgage loan information',
  81: 'Frequency of delinquency',
  85: 'Too few active accounts',
  96: 'Too many mortgage loans with balances',
  98: 'Lack of recent auto loan information',
  99: 'Lack of recent consumer finance company account information',
};

const policyMapping = {
  // identity verification decline codes
  IA: 'The social security number provided on your application is incorrect',
  IS: 'The social security number provided on your application is invalid',
  DE: 'The social security number provided on your application has been reported as deceased',
  RV: 'We were unable to verify your residency in the United States',
  CF: 'We were unable to verify your identity',

  // credit check decline codes
  BT: 'Unable to access credit report',
  FZ: '', // todo: substatus reason?
  ID: 'We were unable to verify your identity',
  IC: 'Your credit history is insufficient',
  NT: 'Recent new trades within last 24 months',
  TT: 'Insufficient number of revolving and installment accounts established',
  TF: 'Insufficient number of revolving and installment accounts established',
  CD: 'Current delinquency is being reported to the credit file',
  BK: 'A pending bankruptcy is being reported as a public record',

  // pre-bureau check decline codes
  RE: 'Not an active resident with their landlord',
  LS: 'The lease has not started yet',
  MR: 'Insufficient number of months remaining on lease',
  RM: 'Rent amount exceeds maximum allowable credit',
  RN: 'Rent amount below minimum allowable credit',
  UA: 'You are under the minimum age requirement',
  OC: 'You live outside of our service area',

  // custom risk model checks
  II: 'Income insufficient for amount of credit requested',
  CL: 'Presence of an unresolved collections account on your credit report',
  D2: 'The income is insufficient to manage the current total debts',

  // Gen2 decline reasons
  A8: 'Insufficient revolving credit established',
  IL: 'Low loan amount on open installment loans',
  SB: 'Too few months of consecutive satisfactory balance activity on trades',
  T3: 'Insufficient credit limit established on open account(s)',
  T6: 'Insufficient history on established account(s)',
  VI: 'No open bankcards with sufficient balance activity',
  VK: 'Recent installment loan established',
  W7: 'Past credit delinquency history',
  W9: 'Lack of bankcard revolving or charge trade credit history',
  Y7: 'Too many installment accounts opened',
  Z3: 'Too many inquiries in the last 12 months',
  Z8: 'Ratio of balance to limit on bank revolving or other revolving accounts too high',
  ZB: 'Insufficient credit lines established on open revolving account(s)',
  ZC: 'Insufficient history of installment loans',
  ZK: 'Insufficient number of credit accounts established on file',

  // Gen3 decline reasons
  BU: 'Too many delinquent or derogatory accounts',
  D0: 'Recency of delinquency or derogatory tradeline',
  D3: 'Too many recent delinquencies',
  XA: 'Insufficient payment history on installment loan accounts',
  BQ: 'Credit utilization on recently opened accounts',
  ZS: 'Too many credit inquiries',
  DS: 'Payment history on accounts',
  Y3: 'Insufficient number of credit accounts established on file',
  X9: 'Recent inquiries for credit',
  BW: 'Balance history on revolving bankcard trades',
  AB: 'Too many accounts opened in the last 6 months',
  DM: 'Time since most recent charge-off',
  S5: 'Insufficient history on the most recent installment loan',
  YC: 'Lack of credit history',
  DA: 'Insufficient account information',
  V3: 'Lack of revolving account history',
  V7: 'Insufficient history of installment loans',
  DD: 'Lack of auto account information',
  
  // Special case for "Inactive" which is not in the mapping
  "Inactive": "Inactive account"
};

// Function to get reason text based on reason code
function getReasonText(code) {
  // First check if it's a numeric code (FICO code)
  const numericCode = parseInt(code);
  if (!isNaN(numericCode) && ficoMapping[numericCode]) {
    return ficoMapping[numericCode];
  }
  
  // Otherwise, check if it's a policy code
  if (policyMapping[code]) {
    return policyMapping[code];
  }
  
  // If no mapping is found, return the original code
  return `Unknown reason code: ${code}`;
}

/**
 * Parses command line arguments
 * @returns {Object} Object containing input and output file paths
 */
function parseCommandLineArgs() {
  const args = process.argv.slice(2);
  let inputFile = 'list_accounts_to_close.csv';  // Default input filename
  let outputFile = 'accounts_with_split_reasons.csv';  // Default output filename
  
  // Simple argument parsing
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '-i' || args[i] === '--input') {
      if (i + 1 < args.length) {
        inputFile = args[i + 1];
        i++; // Skip the next argument since we've used it
      }
    } else if (args[i] === '-o' || args[i] === '--output') {
      if (i + 1 < args.length) {
        outputFile = args[i + 1];
        i++; // Skip the next argument since we've used it
      }
    } else if (args[i] === '-h' || args[i] === '--help') {
      printUsage();
      process.exit(0);
    }
  }
  
  return { inputFile, outputFile };
}

/**
 * Prints usage information
 */
function printUsage() {
  console.log(`
CSV Reason Code Transformer

Usage: node transform.js [options]

Options:
  -i, --input <file>    Input CSV file (default: list_accounts_to_close.csv)
  -o, --output <file>   Output CSV file (default: accounts_with_split_reasons.csv)
  -h, --help            Display this help message

Example:
  node transform.js -i my_input.csv -o my_output.csv
  `);
}

/**
 * Transforms the list_accounts_to_close.csv file by splitting the AA_REASON column
 * into individual columns (REASON_1, REASON_2, REASON_3, REASON_4)
 * and adding corresponding text columns (REASON_TEXT_1, REASON_TEXT_2, REASON_TEXT_3, REASON_TEXT_4)
 */
function transformCSV() {
  try {
    // Parse command line arguments
    const { inputFile, outputFile } = parseCommandLineArgs();
    
    console.log(`Starting transformation process...`);
    console.log(`Reading input file: ${inputFile}`);
    
    // Check if input file exists
    if (!fs.existsSync(inputFile)) {
      console.error(`ERROR: Input file '${inputFile}' not found in the current directory.`);
      console.log(`Current directory: ${process.cwd()}`);
      console.log(`Files in current directory: ${fs.readdirSync('.').join(', ')}`);
      printUsage();
      return;
    }
    
    // Read the input CSV file
    const fileContent = fs.readFileSync(inputFile, 'utf8');
    console.log(`Successfully read input file (${fileContent.length} bytes)`);
    
    // Parse the CSV
    console.log(`Parsing CSV...`);
    const parsedData = Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true
    });
    
    console.log(`CSV parsing complete. Found ${parsedData.data.length} rows.`);
    
    if (parsedData.errors && parsedData.errors.length > 0) {
      console.warn(`Warning: There were ${parsedData.errors.length} parsing errors:`);
      console.warn(parsedData.errors);
    }
    
    // Function to extract reason codes from the AA_REASON column
    function extractReasonCodes(reasonString) {
      if (!reasonString) return [];
      
      try {
        // Parse the JSON array string
        return JSON.parse(reasonString);
      } catch (e) {
        console.error(`Error parsing reason string: ${reasonString}`);
        console.error(e.message);
        return [];
      }
    }
    
    // Create the new dataset with the AA_REASON column split
    console.log(`Transforming data...`);
    const newData = parsedData.data.map((row, index) => {
      try {
        // Create a new object with the original columns (excluding AA_REASON)
        const newRow = {
          ECM_SEG: row.ECM_SEG,
          APPLICATION_ID: row.APPLICATION_ID,
          EXP_FICO: row.EXP_FICO,
          EXPERIANREPORTDATE: row.EXPERIANREPORTDATE
        };
        
        // Extract the reason codes
        const reasonCodes = extractReasonCodes(row.AA_REASON);
        
        // Add a column for each reason code and its corresponding text (up to 4, since that's the maximum we found)
        for (let i = 0; i < 4; i++) {
          const reasonCode = reasonCodes[i] || "";
          newRow[`REASON_${i+1}`] = reasonCode;
          newRow[`REASON_TEXT_${i+1}`] = reasonCode ? getReasonText(reasonCode) : "";
        }
        
        return newRow;
      } catch (e) {
        console.error(`Error processing row ${index}:`, e.message);
        console.error('Row data:', row);
        // Return a default row with empty reason columns
        return {
          ECM_SEG: row.ECM_SEG || '',
          APPLICATION_ID: row.APPLICATION_ID || '',
          EXP_FICO: row.EXP_FICO || '',
          EXPERIANREPORTDATE: row.EXPERIANREPORTDATE || '',
          REASON_1: '',
          REASON_TEXT_1: '',
          REASON_2: '',
          REASON_TEXT_2: '',
          REASON_3: '',
          REASON_TEXT_3: '',
          REASON_4: '',
          REASON_TEXT_4: ''
        };
      }
    });
    
    console.log(`Data transformation complete. Generated ${newData.length} transformed rows.`);
    
    // Convert the new dataset back to CSV
    console.log(`Converting to CSV...`);
    const newCsv = Papa.unparse(newData);
    console.log(`CSV conversion complete. Generated ${newCsv.length} bytes of CSV data.`);
    
    // Write the new CSV to a file
    console.log(`Writing output file: ${outputFile}`);
    fs.writeFileSync(outputFile, newCsv);
    console.log(`Successfully wrote output file.`);
    
    // Count some statistics for verification
    let rowsWithOneReason = 0;
    let rowsWithMultipleReasons = 0;
    
    newData.forEach(row => {
      if (row.REASON_1 && !row.REASON_2) {
        rowsWithOneReason++;
      } else if (row.REASON_1 && row.REASON_2) {
        rowsWithMultipleReasons++;
      }
    });
    
    // Get all unique reason codes
    const allReasonCodes = new Set();
    newData.forEach(row => {
      for (let i = 1; i <= 4; i++) {
        const reason = row[`REASON_${i}`];
        if (reason) allReasonCodes.add(reason);
      }
    });
    
    // Print statistics
    console.log("\n--- TRANSFORMATION SUMMARY ---");
    console.log(`Input file: ${inputFile}`);
    console.log(`Output file: ${outputFile}`);
    console.log(`Total rows: ${newData.length}`);
    console.log(`Rows with one reason: ${rowsWithOneReason}`);
    console.log(`Rows with multiple reasons: ${rowsWithMultipleReasons}`);
    console.log(`Unique reason codes: ${Array.from(allReasonCodes).sort().join(', ')}`);
    
    // Print a sample of the first 5 rows
    console.log("\n--- SAMPLE OUTPUT (First 5 rows) ---");
    const headers = Object.keys(newData[0]).join(',');
    console.log(headers);
    for (let i = 0; i < Math.min(5, newData.length); i++) {
      const values = Object.values(newData[i]).map(v => v === null ? '' : `"${v}"`).join(',');
      console.log(values);
    }
  } catch (e) {
    console.error('ERROR: An unexpected error occurred during the transformation process.');
    console.error(e);
    printUsage();
  }
}

// Execute the transformation
transformCSV();