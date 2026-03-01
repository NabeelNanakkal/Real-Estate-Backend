const fs = require('fs');
const path = require('path');

const TOKEN_FILE = path.join(__dirname, '../config/zoho-tokens.json');

// Ensure config directory exists
const configDir = path.dirname(TOKEN_FILE);
if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
}

exports.saveTokens = (tokens) => {
    fs.writeFileSync(TOKEN_FILE, JSON.stringify(tokens, null, 2));
};

exports.getTokens = () => {
    if (!fs.existsSync(TOKEN_FILE)) return null;
    try {
        const data = fs.readFileSync(TOKEN_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading Zoho tokens:', error);
        return null;
    }
};
