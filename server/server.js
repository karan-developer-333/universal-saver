require('dotenv').config()

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public')); // Serve dashboard UI

// Helper to read data
const loadData = () => {
    if (!fs.existsSync(DATA_FILE)) {
        return [];
    }
    try {
        const content = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(content);
    } catch (e) {
        console.error('Error reading data.json:', e);
        return [];
    }
};

// Helper to save data
const saveData = (data) => {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    } catch (e) {
        console.error('Error writing to data.json:', e);
    }
};

app.post('/api/save', (req, res) => {
    const { url, title, selectedText, note, timestamp } = req.body;

    if (!url || !title || !selectedText) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const savedItems = loadData();
    const newItem = {
        id: Date.now(),
        url,
        title,
        selectedText,
        note,
        timestamp: timestamp || new Date().toISOString()
    };

    savedItems.unshift(newItem); // Add to beginning
    saveData(savedItems);

    console.log(`Saved: ${title}`);

    res.status(201).json({
        message: 'Successfully saved!',
        item: newItem
    });
});

app.get('/api/items', (req, res) => {
    res.json(loadData());
});

app.listen(PORT, () => {
    console.log(`Knowledge Backend running on http://localhost:${PORT}`);
    console.log(`Dashboard: http://localhost:${PORT}`);
});
