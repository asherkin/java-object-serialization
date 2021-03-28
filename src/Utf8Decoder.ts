export function decodeUtf8Buffer(buffer: Uint8Array): string {
  const characters = [];
  for (let i = 0; i < buffer.length; ++i) {
    switch (buffer[i] >>> 4) {
      case 0:
      case 1:
      case 2:
      case 3:
      case 4:
      case 5:
      case 6:
      case 7:
        characters.push(String.fromCharCode(buffer[i]));
        break;
      case 12:
      case 13:
        characters.push(String.fromCharCode(((buffer[i] & 0x1F) << 6) | (buffer[i + 1] & 0x3F)));
        i += 1;
        break;
      case 14:
        characters.push(String.fromCharCode(((buffer[i] & 0x0F) << 12) | ((buffer[i + 1] & 0x3F) << 6) | (buffer[i + 2] & 0x3F)));
        i += 2;
        break;
    }
  }

  return characters.join("");
}
