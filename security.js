'use strict';

const { isIP } = require('node:net');

function isPublicIPv4(address) {
    if (isIP(address) !== 4) return false;

    const [a, b, c] = address.split('.').map(Number);

    // Reject special-purpose, private, loopback, link-local, documentation,
    // benchmarking, multicast and reserved IPv4 ranges.
    if (a === 0 || a === 10 || a === 127 || a >= 224) return false;
    if (a === 100 && b >= 64 && b <= 127) return false; // CGNAT
    if (a === 169 && b === 254) return false; // Link-local
    if (a === 172 && b >= 16 && b <= 31) return false; // RFC1918
    if (a === 192 && b === 168) return false; // RFC1918
    if (a === 192 && b === 0 && c === 0) return false; // IETF assignments
    if (a === 192 && b === 0 && c === 2) return false; // Documentation
    if (a === 192 && b === 88 && c === 99) return false; // Deprecated 6to4 relay
    if (a === 198 && (b === 18 || b === 19)) return false; // Benchmarking
    if (a === 198 && b === 51 && c === 100) return false; // Documentation
    if (a === 203 && b === 0 && c === 113) return false; // Documentation

    return true;
}

/**
 * FiveM lookup accepts only a literal public IPv4 address and a numeric port.
 * Requiring an IP literal avoids DNS rebinding and prevents URL/host injection.
 */
function validateFiveMAddress(input) {
    if (typeof input !== 'string') {
        throw new Error('Introdu un IP public IPv4 si un port valid, de exemplu 51.222.10.5:30120.');
    }

    const match = input.trim().match(/^((?:\d{1,3}\.){3}\d{1,3}):(\d{1,5})$/);
    if (!match) {
        throw new Error('Format invalid. Introdu un IP public IPv4 și un port, de exemplu 51.222.10.5:30120. Domeniile și URL-urile complete nu sunt acceptate.');
    }

    const [, address, portText] = match;
    const port = Number(portText);

    if (!isPublicIPv4(address)) {
        throw new Error('IP-ul trebuie să fie o adresă IPv4 publică validă; adresele private și rezervate nu sunt acceptate.');
    }
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
        throw new Error('Port invalid. Portul trebuie să fie între 1 și 65535.');
    }

    return `${address}:${port}`;
}

/**
 * Allow only HTTPS pages hosted on the official utcluj.ro domain.
 * This is applied when saving a watch and immediately before every fetch.
 */
function validateUtcUrl(input) {
    let url;
    try {
        url = new URL(input);
    } catch {
        throw new Error('URL invalid.');
    }

    const hostname = url.hostname.toLowerCase().replace(/\.$/, '');
    const isUtcDomain = hostname === 'utcluj.ro' || hostname.endsWith('.utcluj.ro');

    if (url.protocol !== 'https:') {
        throw new Error('Sunt acceptate doar URL-uri HTTPS.');
    }
    if (url.username || url.password) {
        throw new Error('URL-urile cu date de autentificare nu sunt acceptate.');
    }
    if (url.port && url.port !== '443') {
        throw new Error('Sunt acceptate doar porturile HTTPS standard.');
    }
    if (!isUtcDomain || isIP(hostname)) {
        throw new Error('Poți urmări doar pagini de pe domeniul oficial utcluj.ro sau subdomeniile acestuia.');
    }

    return url;
}

module.exports = { isPublicIPv4, validateFiveMAddress, validateUtcUrl };
