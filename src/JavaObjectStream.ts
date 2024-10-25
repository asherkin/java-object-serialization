import { getObjectClass, registerObjectClass } from "./ObjectClassMap";
import { DataStream } from "./DataStream";
import { ObjectInputStream } from "./ObjectInputStream";
import { FieldDesc, ObjectFieldDesc, PrimitiveFieldDesc, TypeCode } from "./FieldDesc";
import { decodeUtf8Buffer } from "./Utf8Decoder";

const STREAM_MAGIC = 0xACED;
const STREAM_VERSION = 5;

const TYPE_BASE = 0x70;
const TYPES = [
  "Null",
  "Reference",
  "ClassDesc",
  "Object",
  "String",
  "Array",
  "Class",
  "BlockData",
  "EndBlockData",
  "Reset",
  "BlockDataLong",
  "Exception",
  "LongString",
  "ProxyClassDesc",
  "Enum",
] as const;

type Type = typeof TYPES[number];

const HANDLE_BASE = 0x7E0000;

enum ClassDescFlags {
  WriteMethod = (1 << 0),
  Serializable = (1 << 1),
  Externalizable = (1 << 2),
  BlockData = (1 << 3),
  Enum = (1 << 4),
}

interface JavaClassDescInfo {
  flags: ClassDescFlags;
  fields: FieldDesc[];
  annotations: (AnyJavaObject | DataStream)[];
  superClassDesc: JavaClassDesc | null;
}

interface JavaClassDesc extends JavaClassDescInfo {
  className: string;
  serialVersionUid: bigint;
}

interface JavaEnum {
  classDesc: JavaClassDesc,
  enumConstantName: string,
}

class JavaObject {
  readonly className: string;
  readonly serialVersionUid: bigint;
  readonly fields: Map<string, any> = new Map();
  readonly annotations: (AnyJavaObject | DataStream)[] = [];

  constructor(classDesc: JavaClassDesc) {
    this.className = classDesc.className;
    this.serialVersionUid = classDesc.serialVersionUid;
  }
}

type AnyJavaObject = any | string | JavaEnum | JavaClassDesc | null | AnyJavaType[];
type AnyJavaType = string | number | bigint | boolean | AnyJavaObject;

class Handle<T> {
  public object: T | null = null;
}

export class JavaObjectStream {
  static RegisterObjectClass = registerObjectClass;

  private readonly stream: DataStream;
  private readonly handles: Handle<any>[];

  public constructor(file: Uint8Array) {
    this.stream = new DataStream(file);
    this.handles = [];

    if (this.stream.readUint16() !== STREAM_MAGIC) {
      throw new Error("stream magic mismatch");
    }

    if (this.stream.readUint16() !== STREAM_VERSION) {
      throw new Error("stream version mismatch");
    }
  }

  public next() {
    const contentType = this.readType();
    if (contentType === "EndBlockData") {
      throw new Error("unexpected 'EndBlockData' at top level");
    }

    const content = this.readContent(contentType);
    if (content instanceof DataStream) {
      return content;
    }

    return content.object;
  }

  public* read() {
    while (!this.stream.isEndOfStream()) {
      yield this.next();
    }
  }

  readObjectFields(fields: FieldDesc[]): Map<string, any> {
    const values = new Map();

    for (const field of fields) {
      const value = this.readFromTypeCode(field.typeCode);

      values.set(field.fieldName, value);
    }

    return values;
  }

  private newHandle<T>(): Handle<T> {
    const handle = new Handle<T>();
    this.handles.push(handle);

    return handle;
  }

  private readType(): Type {
    const type = this.stream.readUint8() - TYPE_BASE;
    if (type < 0 || type >= TYPES.length) {
      throw new Error(`type id '${type}' out of range`);
    }

    return TYPES[type];
  }

  private readString(long?: boolean): string {
    let length;
    if (long) {
      length = this.stream.readUint64();
      if (length > Number.MAX_SAFE_INTEGER) {
        throw new Error("long string length out of supported range");
      }

      length = Number(length);
    } else {
      length = this.stream.readUint16();
    }

    const data = this.stream.readBytes(length);
    return decodeUtf8Buffer(data);
  }

  private readContent(type: "Object" | "Class" | "Array" | "String" | "LongString" | "Enum" | "ClassDesc" | "ProxyClassDesc" | "Reference" | "Null" | "Exception" | "Reset" | "BlockData" | "BlockDataLong") {
    switch (type) {
      case "Object":
      case "Class":
      case "Array":
      case "String":
      case "LongString":
      case "Enum":
      case "ClassDesc":
      case "ProxyClassDesc":
      case "Reference":
      case "Null":
      case "Exception":
      case "Reset":
        return this.readObject(type);
      case "BlockData":
      case "BlockDataLong":
        return this.readBlockData(type);
    }
  }

  private readObject(type: "Object" | "Class" | "Array" | "String" | "LongString" | "Enum" | "ClassDesc" | "ProxyClassDesc" | "Reference" | "Null" | "Exception" | "Reset"): Handle<AnyJavaObject> {
    switch (type) {
      case "Object":
        return this.readNewObject();
      case "Class":
        return this.readNewClass();
      case "Array":
        return this.readNewArray();
      case "String":
      case "LongString":
        return this.readNewString(type);
      case "Enum":
        return this.readNewEnum();
      case "ClassDesc":
      case "ProxyClassDesc":
        return this.readNewClassDesc(type);
      case "Reference":
        return this.readPrevObject<AnyJavaObject>();
      case "Null":
        return this.readNullReference();
      case "Exception":
        return this.readException();
      case "Reset":
        return this.readReset();
    }
  }

  private readObjectWithType() {
    const type = this.readType();
    switch (type) {
      case "Object":
      case "Class":
      case "Array":
      case "String":
      case "LongString":
      case "Enum":
      case "ClassDesc":
      case "ProxyClassDesc":
      case "Reference":
      case "Null":
      case "Exception":
      case "Reset":
        break;
      default:
        throw new Error(`unexpected type '${type}' for object`);
    }

    return this.readObject(type);
  }

  private readNewClass(): never {
    throw new Error("unimplemented");
  }

  private readClassDesc(type: "ClassDesc" | "ProxyClassDesc" | "Reference" | "Null") {
    switch (type) {
      case "ClassDesc":
      case "ProxyClassDesc":
        return this.readNewClassDesc(type);
      case "Reference":
        return this.readPrevObject<JavaClassDesc>();
      case "Null":
        return this.readNullReference();
    }
  }

  private readClassDescWithType() {
    const classDescType = this.readType();
    switch (classDescType) {
      case "ClassDesc":
      case "ProxyClassDesc":
      case "Reference":
      case "Null":
        break;
      default:
        throw new Error(`unexpected type '${classDescType}' for classDesc`);
    }

    return this.readClassDesc(classDescType);
  }

  private readNewClassDesc(type: "ClassDesc" | "ProxyClassDesc") {
    if (type === "ProxyClassDesc") {
      throw new Error("unimplemented");
    }

    const className = this.readString();
    const serialVersionUid = this.stream.readUint64();
    const newHandle = this.newHandle<JavaClassDesc>();
    const classDescInfo = this.readClassDescInfo();

    newHandle.object = {
      className,
      serialVersionUid,
      ...classDescInfo,
    };

    return newHandle;
  }

  private readClassDescInfo(): JavaClassDescInfo {
    const flags = this.stream.readUint8();

    const fields: FieldDesc[] = [];
    const fieldCount = this.stream.readUint16();
    for (let i = 0; i < fieldCount; ++i) {
      fields.push(this.readFieldDesc());
    }

    const annotations = this.readAnnotations();
    const superClassDesc = this.readClassDescWithType().object;

    return {
      flags,
      fields,
      annotations,
      superClassDesc,
    };
  }

  private readAnnotations() {
    const annotations = [];
    for (; ;) {
      const contentType = this.readType();
      if (contentType === "EndBlockData") {
        break;
      }

      const content = this.readContent(contentType);
      if (content instanceof DataStream) {
        annotations.push(content);
      } else {
        annotations.push(content.object);
      }
    }

    return annotations;
  }

  private readFieldDesc(): FieldDesc {
    const typeCode = String.fromCharCode(this.stream.readUint8());
    const fieldName = this.readString();

    switch (typeCode) {
      case "B":
      case "C":
      case "D":
      case "F":
      case "I":
      case "J":
      case "S":
      case "Z":
        return new PrimitiveFieldDesc(typeCode, fieldName);
      case "[":
      case "L":
        break;
      default:
        throw new Error(`unexpected field typeCode '${typeCode}'`);
    }

    const className = this.readObjectWithType().object;
    if (typeof className !== "string") {
      throw new Error("expected string for field class name");
    }

    return new ObjectFieldDesc(typeCode, fieldName, className);
  }

  private readNewArray() {
    const classDesc = this.readClassDescWithType().object;
    if (!classDesc) {
      throw new Error("got null class desc for array");
    }

    const size = this.stream.readUint32();
    const newHandle = this.newHandle<AnyJavaType[]>();

    const typeCode = classDesc.className.slice(1, 2);
    switch (typeCode) {
      case "B":
      case "C":
      case "D":
      case "F":
      case "I":
      case "J":
      case "S":
      case "Z":
      case "[":
      case "L":
        break;
      default:
        throw new Error(`unexpected array typeCode '${typeCode}'`);
    }

    const values = [];
    for (let i = 0; i < size; ++i) {
      values.push(this.readFromTypeCode(typeCode));
    }

    newHandle.object = values;

    return newHandle;
  }

  private readNewObject() {
    const classDesc = this.readClassDescWithType().object;
    if (!classDesc) {
      throw new Error("got null class desc for object");
    }

    const newHandle = this.newHandle<any>();

    const objectClass = getObjectClass(classDesc.className, classDesc.serialVersionUid);
    const newObject = objectClass ? new objectClass() : new JavaObject(classDesc);

    // The classes need re-ordering from superclass to subclass.
    const classDescChain = [];
    for (let i: JavaClassDesc | null = classDesc; i !== null; i = i.superClassDesc) {
      classDescChain.unshift(i);
    }

    // Walk the class chain to read the class data.
    for (const dataClassDesc of classDescChain) {
      if ((dataClassDesc.flags & ClassDescFlags.Enum) !== 0) {
        throw new Error("unimplemented");
      }

      if ((dataClassDesc.flags & ClassDescFlags.Externalizable) !== 0) {
        throw new Error("unimplemented");
      }

      if ((dataClassDesc.flags & ClassDescFlags.Serializable) === 0) {
        throw new Error("expected the serializable flag to be set");
      }

      if ((dataClassDesc.flags & ClassDescFlags.WriteMethod) === 0) {
        const values = this.readObjectFields(dataClassDesc.fields);

        for (const [fieldName, value] of values) {
          if (newObject instanceof JavaObject) {
            newObject.fields.set(fieldName, value);
          } else {
            if (fieldName in newObject) {
              newObject[fieldName] = value;
            }
          }
        }

        continue;
      }

      const dataClass = getObjectClass(dataClassDesc.className, dataClassDesc.serialVersionUid);

      if (!dataClass) {
        if (!dataClass) {
          console.warn(`no class registered for ${dataClassDesc.className} with UID ${dataClassDesc.serialVersionUid}`);
        }

        const values = this.readObjectFields(dataClassDesc.fields);
        const annotations = this.readAnnotations();

        if (newObject instanceof JavaObject) {
          for (const [fieldName, value] of values) {
            newObject.fields.set(fieldName, value);
          }

          for (const annotation of annotations) {
            newObject.annotations.push(annotation);
          }
        }

        continue;
      }

      if (typeof dataClass.prototype.readObject !== "function") {
        throw new Error("registered class does not implement readObject method");
      }

      if (newObject instanceof JavaObject) {
        const tempObject = Object.create(null);
        dataClass.prototype.readObject.call(tempObject, new ObjectInputStream(this, tempObject, dataClassDesc.fields));

        for (const property in tempObject) {
          if (Object.prototype.hasOwnProperty.call(tempObject, property)) {
            newObject.fields.set(property, tempObject[property]);
          }
        }

        const annotations = this.readAnnotations();
        for (const annotation of annotations) {
          newObject.annotations.push(annotation);
        }

        continue;
      }

      // I'm not sure this is strictly sane in JavaScript land.
      dataClass.prototype.readObject.call(newObject, new ObjectInputStream(this, newObject, dataClassDesc.fields));

      // Read any leftover annotations, if the readObject implementation has read
      // everything this will just hit the EndBlockData and complete.
      this.readAnnotations();
    }

    newHandle.object = newObject;

    if (!(newObject instanceof JavaObject) && typeof newObject.readResolve === "function") {
      newHandle.object = newObject.readResolve();
    }

    return newHandle;
  }

  private readFromTypeCode(typeCode: TypeCode) {
    switch (typeCode) {
      case "B":
        return this.stream.readUint8();
      case "C":
        return String.fromCharCode(this.stream.readUint16());
      case "D":
        return this.stream.readFloat64();
      case "F":
        return this.stream.readFloat32();
      case "I":
        return this.stream.readUint32();
      case "J":
        return this.stream.readUint64();
      case "S":
        return this.stream.readUint16();
      case "Z":
        return this.stream.readUint8() !== 0;
      case "[":
      // TODO: Not sure about this.
      // eslint-disable-next-line no-fallthrough
      case "L":
        // TODO: Should probably be checking the type against field.className?
        return this.readObjectWithType().object;
    }
  }

  private readBlockData(type: "BlockData" | "BlockDataLong") {
    let length = null;

    switch (type) {
      case "BlockData":
        length = this.stream.readUint8();
        break;
      case "BlockDataLong":
        length = this.stream.readUint32();
        break;
    }

    const bytes = this.stream.readBytes(length);
    return new DataStream(bytes);
  }

  private readNewString(type: "String" | "LongString") {
    const newHandle = this.newHandle<string>();
    newHandle.object = this.readString(type === "LongString");

    return newHandle;
  }

  private readNewEnum() {
    const classDesc = this.readClassDescWithType().object;
    if (!classDesc) {
      throw new Error("got null class desc for enum");
    }

    const newHandle = this.newHandle<JavaEnum>();

    const enumConstantName = this.readObjectWithType().object;
    if (typeof enumConstantName !== "string") {
      throw new Error("expected string for enum constant name");
    }

    newHandle.object = {
      classDesc,
      enumConstantName,
    };

    return newHandle;
  }

  private readPrevObject<T>(): Handle<T> {
    const handle = this.stream.readUint32() - HANDLE_BASE;
    if (handle < 0 || handle >= this.handles.length) {
      throw new Error(`prevObject handle '${handle}' out of range [0, ${this.handles.length})`);
    }

    return this.handles[handle];
  }

  private readNullReference() {
    return new Handle<null>();
  }

  private readException(): never {
    throw new Error("unimplemented");
  }

  // TODO: The way this is called isn't quite right, while we're doing the right thing,
  //       the code should keep reading if it sees a TC_RESET and continue on to the next thing,
  //       as they can appear anywhere in the object stream and should just be ignored
  //       other than resetting the handle list. As we've never seen anything using them yet,
  //       just treat it as unimplemented for now so we can get the right return types elsewhere.
  private readReset(): never {
    throw new Error("unimplemented");

    // This is the right implementation, but we need to fix the caller behavior.
    // this.handles = [];
  }
}
