import { ObjectInputStream } from "./ObjectInputStream";
import { JavaSerializable, JavaSerializableConstructor } from "./ObjectClassMap";

test("deserialize example", () => {
  class List implements JavaSerializable {
    value: number = 0;
    next: List | null = null;

    constructor() {}

    readObject(stream: ObjectInputStream): void {
      this.value = stream.readInt();
      this.next = stream.readObject() as List | null;
    }

    readResolve(): any {
      return this;
    }
  }

  const ListConstructor = List as JavaSerializableConstructor<List>;

  ObjectInputStream.RegisterObjectClass(ListConstructor, "List", "7622494193198739048");

  const data = "rO0ABXNyAARMaXN0aciKFUAWrmgCAAJJAAV2YWx1ZUwABG5leHR0AAZMTGlzdDt4cAAAABFzcQB+AAAAAAATcHEAfgAD";
  const serialized = Buffer.from(data, "base64");
  const stream = new ObjectInputStream(serialized);

  const listOne = stream.readObject();
  expect(listOne).toBeInstanceOf(List);
  expect(listOne.value).toBe(17);
  expect(listOne.next).not.toBeNull();

  const listTwo = stream.readObject();
  expect(listTwo).toBeInstanceOf(List);
  expect(listTwo.value).toBe(19);
  expect(listTwo.next).toBeNull();

  expect(listOne.next).toBe(listTwo);

  // console.log(listOne);
  // console.log(listTwo);
});

test("deserialize standard date", () => {

  const data = "rO0ABXNyAA5qYXZhLnV0aWwuRGF0ZWhqgQFLWXQZAwAAeHB3CAAAAYtZ1MwAeA==";
  const serialized = Buffer.from(data, "base64");
  const stream = new ObjectInputStream(serialized);
  const result = stream.readObject();

  expect(result).toBeInstanceOf(Date);
  expect(result.getTime()).toBe(1698019200000);
});


