const fs = require('node:fs');
const path = require('node:path');

const dataDir = path.join(__dirname, 'data');
const storePath = path.join(dataDir, 'starboard.json');

function loadAll() {
    try {
        const raw = fs.readFileSync(storePath, 'utf8');
        return JSON.parse(raw);
    } catch {
        return {};
    }
}

function saveAll(data) {
    fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(storePath, JSON.stringify(data, null, 2));
}

// originalMessageId -> ID-ul mesajului postat pe canalul de starboard.
function getStarboardEntry(originalMessageId) {
    const all = loadAll();
    return all[originalMessageId] ?? null;
}

function setStarboardEntry(originalMessageId, starboardMessageId) {
    const all = loadAll();
    all[originalMessageId] = starboardMessageId;
    saveAll(all);
}

module.exports = { getStarboardEntry, setStarboardEntry };
