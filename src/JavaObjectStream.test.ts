import { JavaObjectStream } from "./JavaObjectStream";
import { JavaSerializable, JavaSerializableConstructor } from "./ObjectClassMap";
import { ObjectInputStream } from "./ObjectInputStream";
import { JavaDate } from "./JavaDate";

test("deserialize example", () => {
  const data = "rO0ABXNyAARMaXN0aciKFUAWrmgCAAJJAAV2YWx1ZUwABG5leHR0AAZMTGlzdDt4cAAAABFzcQB+AAAAAAATcHEAfgAD";
  const serialized = Buffer.from(data, "base64");
  const stream = new JavaObjectStream(serialized);

  for (const content of stream.read()) {
    // console.log(content);
  }
});

test("deserialize standard date", () => {

  // JavaObjectStream.RegisterObjectClass(JavaDate, "java.util.Date", BigInt("7523967970034938905"));

  const data = "rO0ABXNyAA5qYXZhLnV0aWwuRGF0ZWhqgQFLWXQZAwAAeHB3CAAAAYtZ1MwAeA==";
  const serialized = Buffer.from(data, "base64");
  const stream = new JavaObjectStream(serialized);
  const result = stream.next();

  expect(result).toBeInstanceOf(Date);
  expect(result.getTime()).toBe(1698019200000);
});

test("deserialize example two", () => {
  class List implements JavaSerializable {
    value: number = 0;
    next: List | null = null;

    constructor() {}  // Explicit constructor

    readObject(stream: ObjectInputStream): void {
      this.value = stream.readInt();
      this.next = stream.readObject() as List | null;
    }

    // Optional: Implement readResolve if needed
    readResolve(): any {
      return this;
    }
  }

  // Type assertion to ensure List constructor matches JavaSerializableConstructor
  const ListConstructor = List as JavaSerializableConstructor<List>;

  ObjectInputStream.RegisterObjectClass(ListConstructor, "List", "7622494193198739048");

  const data = "rO0ABXNyAARMaXN0aciKFUAWrmgCAAJJAAV2YWx1ZUwABG5leHR0AAZMTGlzdDt4cAAAABFzcQB+AAAAAAATcHEAfgAD";
  const serialized = Buffer.from(data, "base64");
  const stream = new JavaObjectStream(serialized);

  for (const content of stream.read()) {
    // console.log(content);
  }
});

test("deserialize inherited field", () => {
  const data = "rO0ABXVyABNbTGphdmEubGFuZy5PYmplY3Q7kM5YnxBzKWwCAAB4cAAAAAJ0AAVCZWdpbnEAfgABc3IAHERlcml2ZWRDbGFzc1dpdGhBbm90aGVyRmllbGQAAAAAAAAjRQIAAUkAA2JhcnhyABJCYXNlQ2xhc3NXaXRoRmllbGQAAAAAAAASNAIAAUkAA2Zvb3hwAAAAewAAAOp1cQB+AAAAAAACcQB+AAZ0AANFbmQ=";
  const serialized = Buffer.from(data, "base64");
  const stream = new JavaObjectStream(serialized);

  for (const content of stream.read()) {
    // console.log(content);
  }
});

test("deserialize duplicate inherited field", () => {
  const data = "rO0ABXVyABNbTGphdmEubGFuZy5PYmplY3Q7kM5YnxBzKWwCAAB4cAAAAAJ0AAVCZWdpbnEAfgABc3IAGURlcml2ZWRDbGFzc1dpdGhTYW1lRmllbGQAAAAAAAA0VgIAAUkAA2Zvb3hyABJCYXNlQ2xhc3NXaXRoRmllbGQAAAAAAAASNAIAAUkAA2Zvb3hwAAAAewAAAVl1cQB+AAAAAAACcQB+AAZ0AANFbmQ=";
  const serialized = Buffer.from(data, "base64");
  const stream = new JavaObjectStream(serialized);

  for (const content of stream.read()) {
    // console.log(content);
  }
});

test("deserialize ArrayList", () => {
  class ArrayList implements JavaSerializable {
    size: number = 0;
    elements: any[] = [];

    readObject(stream: ObjectInputStream): void {
      // Read in size, and any hidden stuff
      stream.defaultReadObject();

      // Read in capacity
      stream.readInt(); // ignored

      for (let i = 0; i < this.size; ++i) {
        this.elements.push(stream.readObject());
      }
    }

    readResolve(): any {
      return this.elements;
    }
  }

  JavaObjectStream.RegisterObjectClass(ArrayList, "java.util.ArrayList", "8683452581122892189");

  class JavaInteger implements JavaSerializable {
    value: number = 0;

    readResolve(): any {
      return this.value;
    }
  }

  JavaObjectStream.RegisterObjectClass(JavaInteger, "java.lang.Integer", "1360826667806852920");

  const data = "rO0ABXVyABNbTGphdmEubGFuZy5PYmplY3Q7kM5YnxBzKWwCAAB4cAAAAAJ0AAVCZWdpbnEAfgABc3IAE2phdmEudXRpbC5BcnJheUxpc3R4gdIdmcdhnQMAAUkABHNpemV4cAAAAAJ3BAAAAAJ0AANmb29zcgARamF2YS5sYW5nLkludGVnZXIS4qCk94GHOAIAAUkABXZhbHVleHIAEGphdmEubGFuZy5OdW1iZXKGrJUdC5TgiwIAAHhwAAAAe3h1cQB+AAAAAAACcQB+AAl0AANFbmQ=";
  const serialized = Buffer.from(data, "base64");
  const stream = new JavaObjectStream(serialized);

  for (const content of stream.read()) {
    // console.log(content);
  }
});

test("deserialize primitive array", () => {
  const data = "rO0ABXVyABNbTGphdmEubGFuZy5PYmplY3Q7kM5YnxBzKWwCAAB4cAAAAAJ0AAVCZWdpbnEAfgABdXIAAltJTbpgJnbqsqUCAAB4cAAAAAMAAAAMAAAAIgAAADh1cQB+AAAAAAACcQB+AAV0AANFbmQ=";
  const serialized = Buffer.from(data, "base64");
  const stream = new JavaObjectStream(serialized);

  for (const content of stream.read()) {
    // console.log(content);
  }
});

test("deserialize primitive multidim array", () => {
  const data = "rO0ABXVyAANbW0kX9+RPGY+JPAIAAHhwAAAAAnVyAAJbSU26YCZ26rKlAgAAeHAAAAACAAAACwAAAAx1cQB+AAIAAAADAAAAFQAAABYAAAAX";
  const serialized = Buffer.from(data, "base64");
  const stream = new JavaObjectStream(serialized);

  for (const content of stream.read()) {
    // console.log(content);
  }
});

test("deserialize enum", () => {
  const data = "rO0ABXVyABNbTGphdmEubGFuZy5PYmplY3Q7kM5YnxBzKWwCAAB4cAAAAAJ0AAVCZWdpbnEAfgABfnIACFNvbWVFbnVtAAAAAAAAAAASAAB4cgAOamF2YS5sYW5nLkVudW0AAAAAAAAAABIAAHhwdAADT05FfnEAfgADdAAFVEhSRUVxAH4AB3VxAH4AAAAAAAJxAH4ACXQAA0VuZA==";
  const serialized = Buffer.from(data, "base64");
  const stream = new JavaObjectStream(serialized);

  for (const content of stream.read()) {
    // console.log(content);
  }
});
