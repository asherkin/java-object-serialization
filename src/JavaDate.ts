import { JavaSerializable } from "./ObjectClassMap";
import { ObjectInputStream } from "./ObjectInputStream";

export class JavaDate implements JavaSerializable {
  public fastTime: bigint | number = 0;

  public readObject(stream: ObjectInputStream): void {

    stream.defaultReadObject();

    // For java.util.Date, the timestamp is written directly to the stream
    // rather than as a field
    this.fastTime = stream.readLong(); // Read the timestamp directly

    // Add the value to the fields map for debugging/consistency
    if (stream instanceof ObjectInputStream && (stream as any).currentObject) {
      (stream as any).currentObject.fields = new Map([
        ['fastTime', this.fastTime]
      ]);
    }

    if ('currentObject' in stream) {
      (stream as any).currentObject.fields = new Map([
        ['fastTime', this.fastTime]
      ]);
    }
  }

  public readResolve(): Date {
    return new Date(Number(this.fastTime));
  }
}

