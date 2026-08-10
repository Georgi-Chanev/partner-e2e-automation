// Generates a valid, reasonably-sized PNG test logo (200x200 solid color)
// using only Node's built-in zlib - no extra dependencies needed.
const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

const width = 200;
const height = 200;

function crc32(buf) {
  let c, crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = (crc ^ buf[i]) & 0xff;
    for (let j = 0; j < 8; j++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(width, 0);
ihdr.writeUInt32BE(height, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 2; // color type RGB
ihdr[10] = 0;
ihdr[11] = 0;
ihdr[12] = 0;

const rowSize = width * 3 + 1;
const raw = Buffer.alloc(rowSize * height);
for (let y = 0; y < height; y++) {
  raw[y * rowSize] = 0; // filter type none
  for (let x = 0; x < width; x++) {
    const off = y * rowSize + 1 + x * 3;
    raw[off] = 230; // R - solid light-orange test swatch
    raw[off + 1] = 126;
    raw[off + 2] = 34;
  }
}

const idatData = zlib.deflateSync(raw);
const png = Buffer.concat([
  sig,
  chunk('IHDR', ihdr),
  chunk('IDAT', idatData),
  chunk('IEND', Buffer.alloc(0)),
]);

const outPath = path.join(__dirname, 'assets', 'test-logo.png');
fs.writeFileSync(outPath, png);
console.log('Written', png.length, 'bytes to', outPath);