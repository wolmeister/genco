import { CodeBlockWriter, SourceFile } from 'ts-morph';

import { TypescriptGenerator } from '../../common/typescript-generator';
import { Field } from '../../config.schemas';
import { humanize } from '../../utils/string.utils';

export class UpdatePageTestGenerator extends TypescriptGenerator {
  async generate(file: SourceFile): Promise<void> {
    this.addImports(file);
    this.addTests(file);
  }

  private addTests(file: SourceFile): void {
    const humanizedModel = humanize(this.model, true);

    file.addStatements(writer => {
      writer
        .blankLine()
        .writeLine(`describe('Update${this.pascalCaseModel}Page', () => `)
        .block(() => {
          writer
            .write(`it('should render the loading state while data is being fetched', async () => `)
            .block(() => {
              this.addLoadingTest(writer);
            })
            .write(');');

          writer
            .blankLine()
            .write(`it('should render the error state when an error occurs', async () => `)
            .block(() => {
              this.addErrorTest(writer);
            })
            .write(');');

          writer
            .blankLine()
            .write(
              `it('should render the ${humanizedModel} form when data is loaded', async () => `
            )
            .block(() => {
              this.addFormTest(writer);
            })
            .write(');');

          writer
            .blankLine()
            .write(`it('should render the error state when the form is invalid', async () => `)
            .block(() => {
              this.addInvalidFormTest(writer);
            })
            .write(');');

          writer
            .blankLine()
            .write(
              `it('should display a success message and navigate to the ${humanizedModel} when successfully submitting the form', async () => `
            )
            .block(() => {
              this.addSuccessTest(writer);
            })
            .write(');');

          for (const [fieldName, field] of Object.entries(this.config.fields)) {
            if (field.unique === false) {
              continue;
            }

            writer
              .blankLine()
              .write(
                `it('should display a error message when the ${humanizedModel} ${fieldName} is not unique', async () => `
              )
              .block(() => {
                this.addUniqueFieldTest(fieldName, field, writer);
              })
              .write(');');
          }

          if (this.config.permissions.findMultiple.type !== 'public') {
            writer
              .blankLine()
              .write(
                `it('should render the 401 page if the user is not authenticated', async () => `
              )
              .block(() => {
                this.addAuthenticationTest(writer);
              })
              .write(');');
          }

          if (this.config.permissions.findMultiple.type === 'role') {
            writer
              .blankLine()
              .write(
                `it('should render the 403 page if the user does not have permission', async () => `
              )
              .block(() => {
                this.addPermissionTest(writer);
              })
              .write(');');
          }
        })
        .write(');');
    });
  }

  private addLoadingTest(writer: CodeBlockWriter): void {
    writer.write('// TODO');
  }

  private addErrorTest(writer: CodeBlockWriter): void {
    writer.write('// TODO');
  }

  private addFormTest(writer: CodeBlockWriter): void {
    writer.write('// TODO');
  }

  private addInvalidFormTest(writer: CodeBlockWriter): void {
    writer.write('// TODO');
  }

  private addSuccessTest(writer: CodeBlockWriter): void {
    writer.write('// TODO');
  }

  private addUniqueFieldTest(fieldName: string, field: Field, writer: CodeBlockWriter): void {
    writer.write('// TODO');
  }

  private addAuthenticationTest(writer: CodeBlockWriter): void {
    writer.write('// TODO');
  }

  private addPermissionTest(writer: CodeBlockWriter): void {
    writer.write('// TODO');
  }

  private addImports(file: SourceFile): void {
    // TODO
  }
}
