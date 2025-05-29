export const toB64Url = (bytes: Uint8Array): string =>
    btoa(String.fromCharCode(...bytes))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

export const utf8B64Url = (obj: unknown): string =>
    toB64Url(new TextEncoder().encode(JSON.stringify(obj)));

export const hexToBytes = (hex: string): Uint8Array => {
    if (hex.startsWith('0x')) hex = hex.slice(2);
    return Uint8Array.from(hex.match(/.{1,2}/g)!.map(b => parseInt(b, 16)));
};