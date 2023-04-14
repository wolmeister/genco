import { CodeBlockWriter } from 'ts-morph';

export type WritableObject = Record<
  string,
  string | Record<string, string | Record<string, string>>
>;

export function writeObject(writer: CodeBlockWriter, obj: WritableObject): void {
  writer.block(() => {
    for (const [key, value] of Object.entries(obj)) {
      writer.write(key).write(': ');
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
