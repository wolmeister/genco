import { CodeBlockWriter, SourceFile } from 'ts-morph';

import { TypescriptGenerator } from '../../common/typescript-generator';
import { humanize } from '../../utils/string.utils';

export class ViewPageTestGenerator extends TypescriptGenerator {
  async generate(file: SourceFile): Promise<void> {
    this.addImports(file);
    this.addTests(file);
  }

  private addTests(file: SourceFile): void {
    const humanizedModel = humanize(this.model, true);

    file.addStatements(writer => {
      writer
        .blankLine()
        .writeLine(`describe('${this.pascalCaseModel}Page', () => `)
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
              `it('should render the ${humanizedModel} data and action buttons when data is loaded', async () => `
            )
            .block(() => {
              this.addDataTest(writer);
            })
            .write(');');

          writer
            .blankLine()
            .write(
              `it('should navigate to the ${humanizedModel} page when the edit button is clicked', async () => `
            )
            .block(() => {
              this.addEditTest(writer);
            })
            .write(');');

          writer
            .blankLine()
            .write(
              `it('should display a confirmation modal and delete the ${humanizedModel} when the delete button is clicked', async () => `
            )
            .block(() => {
              this.addDeleteTest(writer);
            })
            .write(');');

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

  private addDataTest(writer: CodeBlockWriter): void {
    writer.write('// TODO');
  }

  private addEditTest(writer: CodeBlockWriter): void {
    writer.write('// TODO');
  }

  private addDeleteTest(writer: CodeBlockWriter): void {
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
