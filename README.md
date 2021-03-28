# Java Object Serialization

Ergonomic `java.io.Serializable` parsing for JavaScript and TypeScript projects.

## Example

```typescript
import { ObjectInputStream } from "java-object-serialization";

class List {
    value: number = 0;
    next: List | null = null;
}

ObjectInputStream.RegisterObjectClass(List, "List", "7622494193198739048");

const data = "rO0ABXNyAARMaXN0aciKFUAWrmgCAAJJAAV2YWx1ZUwABG5leHR0AAZMTGlzdDt4cAAAABFzcQB+AAAAAAATcHEAfgAD";
const serialized = Buffer.from(data, "base64");

const stream = new ObjectInputStream(serialized);
const list1 = stream.readObject();
const list2 = stream.readObject();
```

The above code deserializes the example given in the Java Object Serialization specification:

```java
class List implements java.io.Serializable {
    int value;
    List next;
    
    public static void main(String[] args) {
        List list1 = new List();
        List list2 = new List();
        list1.value = 17;
        list1.next = list2;
        list2.value = 19;
        list2.next = null;

        ByteArrayOutputStream o = new ByteArrayOutputStream();
        ObjectOutputStream out = new ObjectOutputStream(o);
        out.writeObject(list1);
        out.writeObject(list2);
        out.flush();
        ...
    }
}
```

There is a `JavaSerializable` interface that can be implemented to customize the deserialization behaviour for classes:

```typescript
interface JavaSerializable {
    readObject?(stream: ObjectInputStream): void
    readResolve?(): any
}
```

`readObject` needs to be implemented for classes that were serialized with a `writeObject` implementation. As with the Java interface the methods on the passed in `ObjectInputStream` can be used to read data related to the class, including the `defaultReadObject` method to read and populate the standard serialized fields.

`readResolve` can be implemented to return an alternative value when deserializing, this can be useful to e.g. return a JavaScript array for `java.util.ArrayList`:

```typescript
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
```

## Status
The full Java Object Serialization specification isn't covered, and the API surface isn't stable, but it is usable for parsing real data.

## License
[MIT](https://choosealicense.com/licenses/mit/)
