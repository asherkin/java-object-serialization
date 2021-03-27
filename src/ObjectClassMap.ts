import { ObjectInputStream } from "./ObjectInputStream";

export interface JavaSerializable {
  readObject?(stream: ObjectInputStream): void

  readResolve?(): any
}

export interface JavaSerializableConstructor<T extends JavaSerializable = JavaSerializable> {
  new(): T;
}

const objectClassMap: Map<string, Map<bigint, JavaSerializableConstructor>> = new Map();

export function registerObjectClass<T>(objectClass: JavaSerializableConstructor<T>, className: string, serialVersionUid: number | string | bigint) {
  let classMap = objectClassMap.get(className);

  if (!classMap) {
    classMap = new Map();
    objectClassMap.set(className, classMap);
  }

  const versionUid = BigInt(serialVersionUid);

  const existingClass = classMap.get(versionUid);
  if (existingClass === objectClass) {
    throw new Error("object class already registered");
  }

  classMap.set(versionUid, objectClass);
}

export function getObjectClass(className: string, serialVersionUid: bigint): JavaSerializableConstructor | null {
  const classMap = objectClassMap.get(className);
  if (!classMap) {
    return null;
  }

  const objectClass = classMap.get(serialVersionUid);
  if (!objectClass) {
    return null;
  }

  return objectClass;
}
