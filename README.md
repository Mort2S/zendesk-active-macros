# Zendesk Active Macro Exporter

This project provides a simple Node.js script to fetch all **active macros** from a Zendesk instance.  
It exports the data as both a `.json` and a `.csv` file, making it easy to review or process macros externally.

## Prerequisites

- Node.js (v14 or higher recommended)
- A Zendesk account with API access enabled
- An active API token

## Installation

1. Clone or download this repository.
2. Navigate to the project directory.
3. Install the required dependencies:

   ```bash
   npm install axios
   ```

## Configuration

Create a `config.json` file in the root directory with the following structure:

```json
{
  "zendesk-auth": {
    "email_address": "your_email@example.com",
    "api_token": "your_api_token",
    "subdomain": "your_subdomain"
  },
  "zendesk-custom-fields": [
    "custom_field_id_1",
    "custom_field_id_2"
  ]
}
```

- `email_address`: Your Zendesk login email
- `api_token`: Your Zendesk API token (create one in your Zendesk Admin panel)
- `subdomain`: Your Zendesk subdomain (e.g., if your URL is `mycompany.zendesk.com`, use `mycompany`)
- `zendesk-custom-fields`: (Optional) An array of custom field IDs to include in the CSV export

## Usage

To fetch and export active macros, run:

```bash
node main.js
```

The script will:
- Fetch all active macros using Zendesk’s API (with pagination)
- Save the full data as a JSON file
- Export a CSV file with selected macro attributes and any custom fields

## Output

After execution, two files will be generated in the project directory:

- `active_<subdomain>_macros.json`: Full macro data in JSON format
- `active_<subdomain>_macros.csv`: A structured CSV file with the following columns:
  - `title`
  - `id`
  - `description`
  - `comment`
  - `tags`
  - `status`
  - `comment_mode_is_public`
  - Any additional custom field IDs defined in the config

The CSV uses `;` (semicolon) as the delimiter and properly escapes special characters.