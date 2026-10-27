'use strict';
const { isIP } = require('node:net');

function isPublicIPv4(address) {
    if (isIP(address) !== 4) return false;
    const [a, b, c] = address.split('.').map(Number);
    if (a === 0 || a === 10 || a === 127 || a >= 224) return false;
    if (a === 100 && b >= 64 && b <= 127) return false;
    if (a === 169 && b === 254) return false;
    if (a === 172 && b >= 16 && b <= 31) return false;
    if (a === 192 && b === 168) return false;
    if (a === 192 && b === 0 && c === 0) return false;
    if (a === 192 && b === 0 && c === 2) return false;
    if (a === 192 && b === 88 && c === 99) return false;
    if (a === 198 && (b === 18 || b === 19)) return false;
    if (a === 198 && b === 51 && c === 100) return false;
    if (a === 203 && b === 0 && c === 113) return false;
    return true;
}

function validateFiveMAddress(input) {
    if (typeof input !== 'string') throw new Error('Introdu un IP public IPv4 și un port, de exemplu 51.222.10.5:30120.');
    const match = input.trim().match(/^((?:\d{1,3}\.){3}\d{1,3}):(\d{1,5})$/);
    if (!match) throw new Error('Format invalid. Introdu un IP public IPv4 și un port, de exemplu 51.222.10.5:30120. Domeniile și URL-urile complete nu sunt acceptate.');
    const [, address, portText] = match;
    const port = Number(portText);
    if (!isPublicIPv4(address)) throw new Error('IP-ul trebuie să fie o adresă IPv4 publică validă; adresele private și rezervate nu sunt acceptate.');
    if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Port invalid. Portul trebuie să fie între 1 și 65535.');
    return `${address}:${port}`;
}

function validateUtcUrl(input) {
    let url;
    try { url = new URL(input); } catch { throw new Error('URL invalid.'); }
    const hostname = url.hostname.toLowerCase().replace(/\.$/, '');
    const isUtcDomain = hostname === 'utcluj.ro' || hostname.endsWith('.utcluj.ro');
    if (url.protocol !== 'https:') throw new Error('Sunt acceptate doar URL-uri HTTPS.');
    if (url.username || url.password) throw new Error('URL-urile cu date de autentificare nu sunt acceptate.');
    if (url.port && url.port !== '443') throw new Error('Sunt acceptate doar porturile HTTPS standard.');
    if (!isUtcDomain || isIP(hostname)) throw new Error('Poți urmări doar pagini de pe domeniul oficial utcluj.ro sau subdomeniile acestuia.');
    return url;
}

module.exports = { isPublicIPv4, validateFiveMAddress, validateUtcUrl };
