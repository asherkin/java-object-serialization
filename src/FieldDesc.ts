export type PrimitiveTypeCode = "B" | "C" | "D" | "F" | "I" | "J" | "S" | "Z";

export class PrimitiveFieldDesc {
  public readonly typeCode: PrimitiveTypeCode;
  public readonly fieldName: string;

  constructor(typeCode: PrimitiveTypeCode, fieldName: string) {
    this.typeCode = typeCode;
    this.fieldName = fieldName;
  }
}

export type ObjectTypeCode = "[" | "L";

export class ObjectFieldDesc {
  public readonly typeCode: ObjectTypeCode;
  public readonly fieldName: string;
  public readonly className: string;

  constructor(typeCode: ObjectTypeCode, fieldName: string, className: string) {
    this.typeCode = typeCode;
    this.fieldName = fieldName;
    this.className = className;
  }
}

export type TypeCode = PrimitiveTypeCode | ObjectTypeCode;
export type FieldDesc = PrimitiveFieldDesc | ObjectFieldDesc;
