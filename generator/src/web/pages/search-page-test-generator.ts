import { CodeBlockWriter, SourceFile } from 'ts-morph';

import { TypescriptGenerator } from '../../common/typescript-generator';
import { humanize } from '../../utils/string.utils';

export class SearchPageTestGenerator extends TypescriptGenerator {
  async generate(file: SourceFile): Promise<void> {
    this.addImports(file);
    this.addTests(file);
  }

  private addTests(file: SourceFile): void {
    const pluralHumanizedModel = humanize(this.model, true, true);
    const humanizedModel = humanize(this.model, true);

    file.addStatements(writer => {
      writer
        .blankLine()
        .writeLine(`describe('${this.pluralPascalCaseModel}Page', () => `)
        .block(() => {
          writer
            .write(`it('should render the loading state while data is being fetched', async () => `)
            .block(() => {
              this.addLoadingTest(writer);
            })
            .write(');');

          writer
            .blankLine()
            .write(`it('should render the table with ${pluralHumanizedModel} data', async () => `)
            .block(() => {
              this.addTableTest(writer);
            })
            .write(');');

          writer
            .blankLine()
            .write(
              `it('should navigate to the ${humanizedModel} page when a row is clicked', async () => `
            )
            .block(() => {
              this.addTableCLickTest(writer);
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

  private addTableTest(writer: CodeBlockWriter): void {
    writer.write('// TODO');
  }

  private addTableCLickTest(writer: CodeBlockWriter): void {
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
