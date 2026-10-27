'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { readJson, writeJsonAtomic } = require('../json-store');

test('readJson returns a fresh fallback for a missing file', t => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'dnk-store-'));
    t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
    const file = path.join(directory, 'missing.json');
    const first = readJson(file, { list: [] });
    first.list.push('changed');
    assert.deepEqual(readJson(file, { list: [] }), { list: [] });
});

test('writeJsonAtomic writes valid JSON that can be read back', t => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'dnk-store-'));
    t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
    const file = path.join(directory, 'data.json');
    writeJsonAtomic(file, { guild: { enabled: true } });
    assert.deepEqual(readJson(file), { guild: { enabled: true } });
    assert.equal(fs.readdirSync(directory).some(name => name.endsWith('.tmp')), false);
});

test('readJson reports corrupted files and does not rewrite them', t => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'dnk-store-'));
    t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
    const file = path.join(directory, 'broken.json');
    fs.writeFileSync(file, '{"missing":');
    const before = fs.readFileSync(file, 'utf8');
    assert.throws(() => readJson(file, {}), /JSON invalid/);
    assert.equal(fs.readFileSync(file, 'utf8'), before);
});
