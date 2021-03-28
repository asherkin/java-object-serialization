import { decodeUtf8Buffer } from "./Utf8Decoder";

test("decode simple string", () => {
  const buffer = new Uint8Array([72, 101, 108, 108, 111]);
  const decoded = decodeUtf8Buffer(buffer);
  expect(decoded).toBe("Hello");
});

test("decode multibyte string", () => {
  const buffer = new Uint8Array([71, 90, 194, 143, 82, 55, 89, 79, 194, 154, 72, 64, 72, 80, 194, 144, 80, 56, 86, 80, 194, 152, 72, 64, 72, 84, 194, 144, 80, 56, 85, 122, 194, 152, 72, 64, 72, 84, 194, 144, 80, 56, 194, 133, 122, 194, 152, 72, 64, 121, 84, 194, 144, 80, 56, 194, 129, 81, 194, 152, 72]);
  const decoded = decodeUtf8Buffer(buffer);

  const characters = new Uint8Array([71, 90, -113, 82, 55, 89, 79, -102, 72, 64, 72, 80, -112, 80, 56, 86, 80, -104, 72, 64, 72, 84, -112, 80, 56, 85, 122, -104, 72, 64, 72, 84, -112, 80, 56, -123, 122, -104, 72, 64, 121, 84, -112, 80, 56, -127, 81, -104, 72]);
  const str = String.fromCharCode(...characters);
  expect(decoded).toBe(str);
});
