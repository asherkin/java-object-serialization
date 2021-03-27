export class DataStream {
  private readonly buffer: DataView;
  private cursor: number;

  public constructor(buffer: Uint8Array) {
    this.buffer = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    this.cursor = 0;
  }

  public isEndOfStream(): boolean {
    return this.cursor >= this.buffer.byteLength;
  }

  public readUint8(): number {
    const value = this.buffer.getUint8(this.cursor);
    this.cursor += 1;
    return value;
  }

  public readUint16(): number {
    const value = this.buffer.getUint16(this.cursor, false);
    this.cursor += 2;
    return value;
  }

  public readUint32(): number {
    const value = this.buffer.getUint32(this.cursor, false);
    this.cursor += 4;
    return value;
  }

  public readUint64(): bigint {
    const value = this.buffer.getBigUint64(this.cursor, false);
    this.cursor += 8;
    return value;
  }

  public readFloat32(): number {
    const value = this.buffer.getFloat32(this.cursor, false);
    this.cursor += 4;
    return value;
  }

  public readFloat64(): number {
    const value = this.buffer.getFloat64(this.cursor, false);
    this.cursor += 8;
    return value;
  }

  public readBytes(bytes: number): Uint8Array {
    const begin = this.buffer.byteOffset + this.cursor;
    this.cursor += bytes;
    return new Uint8Array(this.buffer.buffer, begin, bytes);
  }
}
