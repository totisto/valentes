import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createSolidPNG(width, height, r, g, b) {
  // Simple uncompressed or deflate PNG generator
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 2; // color type: truecolor (RGB)
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdrChunk = createChunk('IHDR', ihdrData);

  // Raw image data: filter byte (0) + RGB per pixel
  const rowSize = 1 + width * 3;
  const rawData = Buffer.alloc(height * rowSize);
  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter 0 (None)
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 3;
      // create a nice border / lion gold gradient
      const isBorder = x < 10 || x >= width - 10 || y < 10 || y >= height - 10;
      if (isBorder) {
        rawData[pxOffset] = 250;
        rawData[pxOffset + 1] = 204;
        rawData[pxOffset + 2] = 21; // Amber 400
      } else {
        rawData[pxOffset] = r;
        rawData[pxOffset + 1] = g;
        rawData[pxOffset + 2] = b; // Deep Navy
      }
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressedData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(len + 12);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4);
  data.copy(chunk, 8);
  const crc = crc32(chunk.subarray(4, len + 8));
  chunk.writeUInt32BE(crc >>> 0, len + 8);
  return chunk;
}

// CRC32 table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return c ^ 0xffffffff;
}

const dir = path.resolve('./public/icons');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

// Deep navy with amber border
const icon192 = createSolidPNG(192, 192, 11, 25, 44);
const icon512 = createSolidPNG(512, 512, 11, 25, 44);
const icon180 = createSolidPNG(180, 180, 11, 25, 44);

fs.writeFileSync(path.join(dir, 'icon-192.png'), icon192);
fs.writeFileSync(path.join(dir, 'icon-512.png'), icon512);
fs.writeFileSync(path.join(dir, 'icon-512-maskable.png'), icon512);
fs.writeFileSync(path.join(dir, 'apple-touch-icon.png'), icon180);
console.log('PNG icons created successfully!');
