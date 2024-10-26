import { JavaObject, JavaObjectStream } from "./JavaObjectStream";
import { JavaSerializable } from "./ObjectClassMap";
import { ObjectInputStream } from "./ObjectInputStream";

test("deserialize example", () => {
  const data = "rO0ABXNyAARMaXN0aciKFUAWrmgCAAJJAAV2YWx1ZUwABG5leHR0AAZMTGlzdDt4cAAAABFzcQB+AAAAAAATcHEAfgAD";
  const serialized = Buffer.from(data, "base64");
  const stream = new JavaObjectStream(serialized);

  const objects = Array.from(stream.read());
  expect(objects).toHaveLength(2);
  expect(objects[0]).toBeInstanceOf(JavaObject);
  expect(objects[0].className).toBe("List");
  expect(objects[0].fields.size).toBe(2);
  expect(objects[0].fields.get("value")).toBe(17);
});

test("deserialize example two", () => {
  class List {
    // In the serialized interface, commented out to simulate removal.
    // value: number = 0;
    next: List | null = null;
    // Not in the serialized interface, will always have default value.
    extra: string = "foobar";
  }

  JavaObjectStream.RegisterObjectClass(List, "List", "7622494193198739048");

  const data = "rO0ABXNyAARMaXN0aciKFUAWrmgCAAJJAAV2YWx1ZUwABG5leHR0AAZMTGlzdDt4cAAAABFzcQB+AAAAAAATcHEAfgAD";
  const serialized = Buffer.from(data, "base64");
  const stream = new JavaObjectStream(serialized);

  const objects = Array.from(stream.read());
  expect(objects).toHaveLength(2);
  expect(objects[0]).toBeInstanceOf(List);
  expect(objects[0].next).toBe(objects[1]);
  expect(objects[0].extra).toBe("foobar");
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

  const arrayListReadObjectSpy = jest.spyOn(ArrayList.prototype, "readObject");
  const arrayListReadResolveSpy = jest.spyOn(ArrayList.prototype, "readResolve");

  JavaObjectStream.RegisterObjectClass(ArrayList, "java.util.ArrayList", "8683452581122892189");

  class JavaInteger implements JavaSerializable {
    value: number = 0;

    readResolve(): any {
      return this.value;
    }
  }

  const javaIntegerReadResolveSpy = jest.spyOn(JavaInteger.prototype, "readResolve");

  JavaObjectStream.RegisterObjectClass(JavaInteger, "java.lang.Integer", "1360826667806852920");

  const data = "rO0ABXVyABNbTGphdmEubGFuZy5PYmplY3Q7kM5YnxBzKWwCAAB4cAAAAAJ0AAVCZWdpbnEAfgABc3IAE2phdmEudXRpbC5BcnJheUxpc3R4gdIdmcdhnQMAAUkABHNpemV4cAAAAAJ3BAAAAAJ0AANmb29zcgARamF2YS5sYW5nLkludGVnZXIS4qCk94GHOAIAAUkABXZhbHVleHIAEGphdmEubGFuZy5OdW1iZXKGrJUdC5TgiwIAAHhwAAAAe3h1cQB+AAAAAAACcQB+AAl0AANFbmQ=";
  const serialized = Buffer.from(data, "base64");
  const stream = new JavaObjectStream(serialized);

  for (const content of stream.read()) {
    // console.log(content);
  }

  expect(arrayListReadObjectSpy).toHaveBeenCalledTimes(1);
  expect(arrayListReadResolveSpy).toHaveBeenCalledTimes(1);
  expect(javaIntegerReadResolveSpy).toHaveBeenCalledTimes(1);
  expect(javaIntegerReadResolveSpy).toHaveReturnedWith(123);
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
