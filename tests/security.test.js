'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { isPublicIPv4, validateFiveMAddress, validateUtcUrl } = require('../security');

test('accepts a public IPv4 and valid FiveM port', () => {
    assert.equal(validateFiveMAddress('51.222.10.5:30120'), '51.222.10.5:30120');
});
test('rejects malformed FiveM targets and private/reserved IPs', () => {
    for (const input of ['localhost:30120','127.0.0.1:30120','192.168.1.1:30120','10.0.0.1:30120','169.254.169.254:80','51.222.10.5:0','51.222.10.5:65536','http://51.222.10.5:30120','51.222.10.5:30120/path','256.1.1.1:30120']) {
        assert.throws(() => validateFiveMAddress(input), Error, input);
    }
    for (const ip of ['0.0.0.1','10.0.0.1','100.64.0.1','127.0.0.1','169.254.0.1','172.16.0.1','192.0.0.1','192.0.2.1','192.168.0.1','198.18.0.1','198.51.100.1','203.0.113.1','224.0.0.1','255.255.255.255']) assert.equal(isPublicIPv4(ip), false, ip);
    assert.equal(isPublicIPv4('51.222.10.5'), true);
});
test('allows only HTTPS URLs from utcluj.ro', () => {
    assert.equal(validateUtcUrl('https://ie.utcluj.ro/anunturi.html').hostname, 'ie.utcluj.ro');
    for (const url of ['http://ie.utcluj.ro/anunturi.html','https://example.com/','https://utcluj.ro.evil.example/','https://127.0.0.1/','https://user:pass@ie.utcluj.ro/','https://ie.utcluj.ro:8443/']) assert.throws(() => validateUtcUrl(url), Error, url);
});
