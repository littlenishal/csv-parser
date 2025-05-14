# CSV Reason Code Transformer

A Node.js script that transforms CSV files containing reason codes in a JSON array format into a more user-friendly CSV format with individual reason codes and their corresponding textual descriptions.

## Description

This utility takes a CSV file with a column containing reason codes in a JSON array format (e.g., `["Inactive"]` or `["39","18","10","13"]`) and splits them into separate columns. It also adds additional columns with human-readable descriptions for each reason code based on predefined mappings.

Specifically, the script:
1. Reads a CSV file with reason codes in the `AA_REASON` column
2. Parses the JSON array contained in that column
3. Creates individual columns for each reason code (REASON_1, REASON_2, etc.)
4. Adds corresponding text description columns (REASON_TEXT_1, REASON_TEXT_2, etc.)
5. Outputs a new CSV file with the transformed data

This tool is particularly useful for credit decision, underwriting, or compliance use cases where reason codes need to be extracted and mapped to their full-text explanations.

## Prerequisites

- Node.js (v12 or higher recommended)
- NPM (Node Package Manager)

## Installation

1. Clone this repository or download the script files
2. Install the required dependencies:

```bash
npm install papaparse
```

## Usage

Run the script with optional input and output file parameters:

```bash
node transform.js [options]
```

### Options

- `-i, --input <file>`: Specify the input CSV file (default: `list_accounts_to_close.csv`)
- `-o, --output <file>`: Specify the output CSV file (default: `accounts_with_split_reasons.csv`)
- `-h, --help`: Display help information

### Examples

Basic usage with default filenames:
```bash
node transform.js
```

Specifying custom input and output files:
```bash
node transform.js -i my_input.csv -o my_output.csv
```

## Input Format

The script expects a CSV file with at least the following columns:
- `ECM_SEG`: Segment category
- `APPLICATION_ID`: Unique identifier
- `EXP_FICO`: (Optional) FICO score
- `EXPERIANREPORTDATE`: (Optional) Date of Experian report
- `AA_REASON`: JSON array of reason codes (e.g., `["Inactive"]` or `["39","18","10","13"]`)

## Output Format

The script generates a CSV file with the following columns:
- All original columns (except `AA_REASON`)
- `REASON_1`, `REASON_2`, `REASON_3`, `REASON_4`: Individual reason codes from the original JSON array
- `REASON_TEXT_1`, `REASON_TEXT_2`, `REASON_TEXT_3`, `REASON_TEXT_4`: Text descriptions for each reason code

## Reason Code Mappings

The script includes two types of reason code mappings:

1. **FICO Reason Codes**: Numeric codes that explain factors affecting credit scores
2. **Policy Reason Codes**: Alphanumeric codes for various policy-related decline reasons

These mappings are incorporated directly into the script based on the `map-decline-codes.js` file.

## Example

### Input CSV Row:
```
ECM_SEG,APPLICATION_ID,EXP_FICO,EXPERIANREPORTDATE,AA_REASON
1.FICO <525,68680E90-6964-42B5-85E7-E41AAE849766,481,2025-04-24,"[""39"",""18"",""10"",""13""]"
```

### Output CSV Row:
```
ECM_SEG,APPLICATION_ID,EXP_FICO,EXPERIANREPORTDATE,REASON_1,REASON_TEXT_1,REASON_2,REASON_TEXT_2,REASON_3,REASON_TEXT_3,REASON_4,REASON_TEXT_4
1.FICO <525,68680E90-6964-42B5-85E7-E41AAE849766,481,2025-04-24,39,"Serious delinquency",18,"Number of accounts with delinquency",10,"Ratio of balance to limit on bank revolving or other revolving accounts is too high",13,"Time since delinquency is too recent or unknown"
```

## Customization

To customize the script for your own use case:

- Change the default input/output file names in the script
- Modify the reason code mappings to match your business needs
- Adjust the number of reason columns (currently set to a maximum of 4)

## Error Handling

The script includes extensive error handling to:
- Validate the existence of the input file
- Handle JSON parsing errors for malformed reason codes
- Provide detailed logs during the transformation process
- Print statistics after processing is complete

## License

[MIT License](LICENSE)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.