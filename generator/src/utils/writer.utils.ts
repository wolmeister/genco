import { CodeBlockWriter } from 'ts-morph';

export interface WritableObject {
  [key: string]: string | WritableObject;
}

export function writeObject(writer: CodeBlockWriter, obj: WritableObject): void {
  writer.block(() => {
    for (const [key, value] of Object.entries(obj)) {
      writer.write(key).conditionalWrite(typeof value !== 'string' || value.length > 0, ': ');
      if (typeof value === 'string') {
        writer.write(value);
      } else {
        writeObject(writer, value);
      }

      writer.write(',');
    }
  });
}

export function objectToString(obj: WritableObject): string {
  const writer = new CodeBlockWriter();
  writeObject(writer, obj);
  return writer.toString();
}
