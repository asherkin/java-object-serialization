import { JavaSerializable, registerObjectClass } from "./ObjectClassMap";
import { DataStream } from "./DataStream";
import { JavaObjectStream } from "./JavaObjectStream";
import { FieldDesc } from "./FieldDesc";

export class ObjectInputStream {
  static RegisterObjectClass = registerObjectClass;

  private readonly stream: JavaObjectStream;
  private readonly currentObject?: JavaSerializable;
  private readonly currentClassFields?: FieldDesc[];
  private buffer: DataStream | null = null;

  constructor(file: Uint8Array);
  constructor(stream: JavaObjectStream, currentObject: JavaSerializable, currentClassFields: FieldDesc[]);
  constructor(fileOrStream: Uint8Array | JavaObjectStream, currentObject?: JavaSerializable, currentClassFields?: FieldDesc[]) {
    if (!(fileOrStream instanceof JavaObjectStream)) {
      this.stream = new JavaObjectStream(fileOrStream);
      return;
    }

    this.stream = fileOrStream;
    this.currentObject = currentObject;
    this.currentClassFields = currentClassFields;
  }

  public readObject(): any {
    const next = this.stream.next();
    if (next instanceof DataStream) {
      throw new Error("expected object");
    }

    return next;
  }

  public readBoolean(): boolean {
    return this.refill().readUint8() !== 0;
  }

  public readByte(): number {
    return this.refill().readUint8();
  }

  public readDouble(): number {
    return this.refill().readFloat64();
  }

  public readFloat(): number {
    return this.refill().readFloat32();
  }

  public readInt(): number {
    return this.refill().readUint32();
  }

  public readLong(): bigint {
    return this.refill().readUint64();
  }

  public readShort(): number {
    return this.refill().readUint16();
  }

  public readFields() {
    if (this.currentClassFields === undefined) {
      throw new Error("not called from readObject method");
    }

    return this.stream.readObjectFields(this.currentClassFields);
  }

  public defaultReadObject(): void {
    if (this.currentObject === undefined) {
      throw new Error("not called from readObject method");
    }

    const values = this.readFields();

    for (const [fieldName, value] of values) {
      if (fieldName in this.currentObject) {
        this.currentObject[fieldName] = value;
      }
    }
  }

  private refill(): DataStream {
    if (this.buffer && !this.buffer.isEndOfStream()) {
      return this.buffer;
    }

    const next = this.stream.next();
    if (!(next instanceof DataStream)) {
      throw new Error("expected block data");
    }

    this.buffer = next;
    return this.buffer;
  }
}
