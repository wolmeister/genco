import { CodeBlockWriter, SourceFile } from 'ts-morph';

import { TypescriptGenerator } from '../common/typescript-generator';
import { Field } from '../config.schemas';
import { humanize, quote } from '../utils/string.utils';
import { objectToString, WritableObject, writeObject } from '../utils/writer.utils';

export class FormComponentGenerator extends TypescriptGenerator {
  async generate(file: SourceFile): Promise<void> {
    this.addImports(file);
    this.addFormComponent(file);
  }

  private addFormComponent(file: SourceFile): void {
    const valueTypeName = `${this.pascalCaseModel}FormValue`;

    file.addTypeAlias({
      name: valueTypeName,
      isExported: true,
      type: writer => {
        const objectToWrite: WritableObject = {};
        for (const [fieldName, field] of Object.entries(this.config.fields)) {
          const [typeFieldName, type] = this.getFieldNameAndType(fieldName, field);
          objectToWrite[typeFieldName] = type;
        }
        writeObject(writer, objectToWrite);
      },
    });

    file.addTypeAlias({
      name: `${this.pascalCaseModel}FormProps`,
      isExported: true,
      leadingTrivia: '\n\n',
      type: objectToString({
        mode: "'create' | 'update' | 'view'",
        'initialValue?': `${valueTypeName} | null`,
        'onSubmit?': `(data: ${valueTypeName}, form: FormInstance<${valueTypeName}>) => void`,
      }),
    });

    file.addFunction({
      name: `${this.pascalCaseModel}Form`,
      isExported: true,
      parameters: [
        {
          name: '{ mode, initialValue, onSubmit }',
          type: `${this.pascalCaseModel}FormProps`,
        },
      ],
      statements: writer => {
        writer.writeLine('const [form] = Form.useForm()');
        writer.writeLine('');

        writer
          .write('const handleSubmit = useCallback(')
          .write(`(data: ${valueTypeName}) =>`)
          .block(() => {
            writer.writeLine('if (!onSubmit)').block(() => writer.write('return;'));
            writer.writeLine('onSubmit(data, form);');
          })
          .write(', [form, onSubmit]);');

        writer.writeLine('');

        writer
          .write('return (')
          .write('<Form ')
          .write('form={form}')
          .write('initialValues={initialValue ?? undefined}')
          .write(`disabled={mode === 'view'}`)
          .write('onFinish={handleSubmit}')
          .write('>');

        for (const [fieldName, field] of Object.entries(this.config.fields)) {
          this.addFormInputComponent(fieldName, field, writer);
        }

        writer
          .write(`{mode !== 'view' && (`)
          .write(`<Button type="primary" htmlType="submit">Submit</Button>`)
          .write(`)}`);
        writer.write('</Form>)');
      },
    });
  }

  private addFormInputComponent(fieldName: string, field: Field, writer: CodeBlockWriter): void {
    writer
      .write('<Form.Item ')
      .write(`label="${humanize(fieldName)}"`)
      .write(`name="${fieldName}"`)
      .conditionalWrite(field.type === 'boolean', `valuePropName="checked"`)
      .write(field.immutable ? "hidden={mode === 'update'}" : '')
      .write(`rules={${this.getFormInputRules(fieldName, field)}}`)
      .write('>');

    switch (field.type) {
      case 'string':
        if (field.options) {
          writer
            .writeLine('<Select options={[')
            .write(
              field.options
                .map(option =>
                  objectToString({
                    label: quote(option.label),
                    value: quote(option.value),
                  })
                )
                .join(',')
            )
            .write(']} ')
            .write('allowClear')
            .write(' />');
        } else {
          writer.writeLine('<Input />');
        }
        break;
      case 'int':
      case 'double':
        writer.writeLine('<InputNumber />');
        break;
      case 'boolean':
        writer.writeLine('<Checkbox />');
        break;
      case 'date':
        writer.writeLine('<DatePicker  />');
        break;
      default:
        throw new Error('Field type not implemented');
    }

    writer.writeLine('</Form.Item>');
  }

  private getFormInputRules(fieldName: string, field: Field): string {
    const rules: Record<string, unknown>[] = [];

    if (field.required) {
      rules.push({
        required: true,
        message: `Please input the ${humanize(fieldName, true)}!`,
      });
    }
    switch (field.type) {
      case 'string': {
        if (field.format === 'email') {
          rules.push({
            type: 'email',
            message: 'Please input a valid email!',
          });
        }
        if (field.validations?.minLength) {
          rules.push({
            min: field.validations.minLength,
            message: `${humanize(fieldName)} must be minimum ${
              field.validations.minLength
            } characters!`,
          });
        }
        if (field.validations?.maxLength) {
          rules.push({
            max: field.validations.maxLength,
            message: `${humanize(fieldName)} must be maximum ${
              field.validations.maxLength
            } characters!`,
          });
        }

        break;
      }
      case 'int':
      case 'double': {
        let validationMessage = `Please input a ${field.type === 'int' ? 'integer' : 'float'}`;
        if (field.validations?.min !== undefined && field.validations?.max !== undefined) {
          validationMessage += ` between ${field.validations.min} and ${field.validations.max}`;
        } else if (field.validations?.min !== undefined) {
          validationMessage += ` greater than ${field.validations.min}`;
        } else if (field.validations?.max !== undefined) {
          validationMessage += ` smaller than ${field.validations.min}`;
        }
        validationMessage += '!';

        rules.push({
          type: field.type === 'int' ? 'integer' : 'float',
          message: validationMessage,
          min: field.validations?.min,
          max: field.validations?.max,
        });

        break;
      }
      case 'date':
      case 'boolean':
        // No custom validations supported
        break;
      default:
        throw new Error('Field type not implemented');
    }

    return JSON.stringify(rules);
  }

  private getFieldNameAndType(fieldName: string, field: Field): [string, string] {
    let typeFieldName = fieldName;
    let type: string;

    switch (field.type) {
      case 'date':
      case 'string': {
        if (field.type === 'string' && field.options) {
          type = field.options.map(o => quote(o.value)).join('|');
        } else {
          type = 'string';
        }
        break;
      }
      case 'int':
      case 'double': {
        type = 'number';
        break;
      }
      case 'boolean': {
        type = 'boolean';
        break;
      }
      default:
        throw new Error('Field type not implemented');
    }

    if (field.required === false) {
      type += ' | null';
      typeFieldName += '?';
    }

    return [typeFieldName, type];
  }

  private addImports(file: SourceFile): void {
    // React
    file.addImportDeclaration({
      moduleSpecifier: 'react',
      defaultImport: 'React',
      namedImports: ['useCallback'],
    });

    // Components
    file.addImportDeclaration({
      moduleSpecifier: this.getRelativeImportPath(
        this.config.web.rootPath,
        this.config.web.formComponentFilePath,
        file
      ),
      namedImports: ['Form', 'FormInstance'],
    });
    file.addImportDeclaration({
      moduleSpecifier: this.getRelativeImportPath(
        this.config.web.rootPath,
        this.config.web.buttonComponentFilePath,
        file
      ),
      namedImports: ['Button'],
    });

    const fields = Object.values(this.config.fields);

    if (fields.some(f => f.type === 'string')) {
      if (fields.some(f => f.type === 'string' && f.options === undefined)) {
        file.addImportDeclaration({
          moduleSpecifier: this.getRelativeImportPath(
            this.config.web.rootPath,
            this.config.web.inputComponentFilePath,
            file
          ),
          namedImports: ['Input'],
        });
      }

      if (fields.some(f => f.type === 'string' && f.options?.length)) {
        file.addImportDeclaration({
          moduleSpecifier: this.getRelativeImportPath(
            this.config.web.rootPath,
            this.config.web.selectComponentFilePath,
            file
          ),
          namedImports: ['Select'],
        });
      }
    }

    if (fields.some(f => f.type === 'int' || f.type === 'double')) {
      file.addImportDeclaration({
        moduleSpecifier: this.getRelativeImportPath(
          this.config.web.rootPath,
          this.config.web.inputNumberComponentFilePath,
          file
        ),
        namedImports: ['InputNumber'],
      });
    }

    if (fields.some(f => f.type === 'boolean')) {
      file.addImportDeclaration({
        moduleSpecifier: this.getRelativeImportPath(
          this.config.web.rootPath,
          this.config.web.checkboxComponentFilePath,
          file
        ),
        namedImports: ['Checkbox'],
      });
    }

    if (fields.some(f => f.type === 'date')) {
      file.addImportDeclaration({
        moduleSpecifier: this.getRelativeImportPath(
          this.config.web.rootPath,
          this.config.web.datePickerComponentFilePath,
          file
        ),
        namedImports: ['DatePicker'],
      });
    }
  }
}
