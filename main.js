const axios = require('axios');
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, 'config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

const { email_address, api_token, subdomain } = config['zendesk-auth'];
const customFieldIds = config['zendesk-custom-fields'] || [];

const credentials = `${email_address}/token:${api_token}`;
const encodedCredentials = Buffer.from(credentials).toString('base64');

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Basic ${encodedCredentials}`
};

const escapeCsv = (value) => {
  if (typeof value !== 'string') value = String(value);
  if (value.includes(';') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

const extractValueByField = (actions, fieldName) => {
  const found = actions.find(action => action.field === fieldName);
  return found ? found.value : '';
};

async function fetchAllActiveMacros() {
  let macros = [];
  let nextPageUrl = `https://${subdomain}.zendesk.com/api/v2/macros/active`;

  while (nextPageUrl) {
    console.log(`Fetching macros from: ${nextPageUrl}`);
    
    try {
      const response = await axios.get(nextPageUrl, { headers });
      const pageMacros = response.data.macros || [];
      macros = macros.concat(pageMacros);

      nextPageUrl = response.data.next_page;
      console.log(`Fetched ${pageMacros.length} macros, next page: ${nextPageUrl}`);

    } catch (err) {
      console.error(`Failed to fetch active macros: ${err.response?.status} ${err.response?.statusText || err.message}`);
      break;
    }
  }

  return macros;
}

async function fetchAndSaveActiveMacros() {
  console.log('Fetching all active macros with pagination...\n');

  const macros = await fetchAllActiveMacros();
  const jsonOutputPath = `active_${subdomain}_macros.json`;

  try {
    fs.writeFileSync(jsonOutputPath, JSON.stringify(macros, null, 2));
    console.log(`\njson file created: ${jsonOutputPath}`);
  } catch (err) {
    console.error(`Error: ${err.message}`);
  }

  const csvOutputPath = `active_${subdomain}_macros.csv`;
  const headers = ['title', 'id', 'description', 'comment', 'tags', 'status', 'comment_mode_is_public', ...customFieldIds];
  const separator = ';';
  
  const lines = [headers.join(separator)];

  macros.forEach(macro => {
    const row = [
      escapeCsv(macro.title),
      `"${macro.id}"`,
      escapeCsv(macro.description || ''),
      escapeCsv(extractValueByField(macro.actions, 'comment_value')),
      escapeCsv(extractValueByField(macro.actions, 'current_tags')),
      escapeCsv(extractValueByField(macro.actions, 'status')),
      escapeCsv(extractValueByField(macro.actions, 'comment_mode_is_public')),
      ...customFieldIds.map(fieldId => escapeCsv(extractValueByField(macro.actions, fieldId)))
    ];
    lines.push(row.join(separator));
  });

  try {
    fs.writeFileSync(csvOutputPath, lines.join('\n'), 'utf-8');
    console.log(`csv file created: ${csvOutputPath}`);
  } catch (err) {
    console.error(`Error: ${err.message}`);
  }

  console.log('\nMacro fetch process completed.');
}

fetchAndSaveActiveMacros();