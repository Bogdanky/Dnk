'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

function readJson(filePath, fallbackValue = {}) {
    let raw;
    try { raw = fs.readFileSync(filePath, 'utf8'); }
    catch (error) {
        if (error.code === 'ENOENT') return JSON.parse(JSON.stringify(fallbackValue));
        throw new Error(`Nu pot citi magazinul ${filePath}: ${error.message}`, { cause: error });
    }
    try { return JSON.parse(raw); }
    catch (error) {
        throw new Error(`JSON invalid în ${filePath}. Datele nu au fost suprascrise; restaurează un backup sau repară fișierul. Detalii: ${error.message}`, { cause: error });
    }
}

function writeJsonAtomic(filePath, value) {
    const directory = path.dirname(filePath);
    fs.mkdirSync(directory, { recursive: true });
    const temporaryPath = path.join(directory, `.${path.basename(filePath)}.${process.pid}.${randomUUID()}.tmp`);
    try {
        fs.writeFileSync(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, { encoding: 'utf8', flag: 'wx' });
        fs.renameSync(temporaryPath, filePath);
    } catch (error) {
        try { fs.unlinkSync(temporaryPath); } catch (cleanupError) { if (cleanupError.code !== 'ENOENT') console.error('Nu am putut șterge fișierul temporar:', cleanupError); }
        throw new Error(`Nu pot salva magazinul ${filePath}: ${error.message}`, { cause: error });
    }
}
module.exports = { readJson, writeJsonAtomic };
