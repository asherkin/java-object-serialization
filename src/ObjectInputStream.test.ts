import { ObjectInputStream } from "./ObjectInputStream";

test("deserialize example", () => {
  class List {
    value: number = 0;
    next: List | null = null;
  }

  ObjectInputStream.RegisterObjectClass(List, "List", "7622494193198739048");

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
