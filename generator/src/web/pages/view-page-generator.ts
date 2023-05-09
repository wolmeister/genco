import { CodeBlockWriter, SourceFile } from 'ts-morph';

import { TypescriptGenerator } from '../../common/typescript-generator';
import { humanize, quote } from '../../utils/string.utils';
import { objectToString } from '../../utils/writer.utils';

export class ViewPageGenerator extends TypescriptGenerator {
  async generate(file: SourceFile): Promise<void> {
    this.addImports(file);
    this.addViewPage(file);
  }

  private addViewPage(file: SourceFile): void {
    file.addFunction({
      name: `${this.pascalCaseModel}Page`,
      isExported: true,
      statements: writer => {
        writer.writeLine('const navigate = useNavigate()');
        writer.writeLine('const { id } = useParams()');
        writer.writeLine(
          `const ${this.camelCaseModel}Query = use${this.pascalCaseModel}(id ?? '')`
        );
        writer.writeLine(
          `const delete${this.pascalCaseModel}Mutation = useDelete${this.pascalCaseModel}Mutation();`
        );
        writer.writeLine('');

        // Add update
        writer
          .write('const handleEdit = useCallback(() =>')
          .block(() => {
            writer.write(`navigate('/${this.pluralKebabCaseModel}/' + id + '/update')`);
          })
          .write(', [id, navigate]);');
        writer.writeLine('');

        // Add delete
        const deleteWriter = new CodeBlockWriter();
        deleteWriter.write('async () =>').block(() => {
          deleteWriter.write('if (!id)').block(() => {
            deleteWriter.writeLine('// This will never happen');
            deleteWriter.write(`throw new Error('${this.pascalCaseModel} id not provided');`);
          });

          deleteWriter.writeLine('');

          deleteWriter
            .write('try')
            .block(() => {
              deleteWriter.write(`await delete${this.pascalCaseModel}Mutation.mutateAsync(id);`);
              deleteWriter.write(
                `message.success('${humanize(this.pascalCaseModel)} deleted successfully!');`
              );
              deleteWriter.write(`navigate('/${this.pluralKebabCaseModel}');`);
            })
            .write('catch (error)')
            .block(() => {
              const errorName = `${this.snakeCaseModel.toUpperCase()}_NOT_FOUND`;
              const humanModelname = humanize(this.pascalCaseModel);

              deleteWriter
                .write(`if (isApiError(error) && error.json.code === '${errorName}')`)
                .block(() => {
                  deleteWriter.write(`message.error('${humanModelname} already deleted!');`);
                })
                .write('else')
                .block(() => {
                  deleteWriter.write("message.error('An unknown error occurred');");
                });
            });
        });

        writer
          .write('const handleDelete = useCallback(() =>')
          .block(() => {
            writer
              .write('Modal.confirm(')
              .write(
                objectToString({
                  title: quote(
                    `Do you want to delete this ${humanize(this.pascalCaseModel, true)}?`
                  ),
                  content: quote('This action is destructive and cannot be reverted.'),
                  onOk: deleteWriter.toString(),
                })
              )
              .write(');');
          })
          .write(`, [id, navigate, delete${this.pascalCaseModel}Mutation]);`);

        // Add renders
        writer.writeLine('');
        writer
          .write(`if (${this.camelCaseModel}Query.isLoading || ${this.camelCaseModel}Query.isIdle)`)
          .block(() => {
            writer.write(`return <${this.pascalCaseModel}Skeleton />`);
          });

        writer.writeLine('');
        writer.write(`if (${this.camelCaseModel}Query.isError)`).block(() => {
          writer.write(
            `return <${this.pascalCaseModel}Error error={${this.camelCaseModel}Query.error} />`
          );
        });

        writer.writeLine('');
        writer
          .write('return (')
          .write('<div>')
          .write(
            `<${this.pascalCaseModel}Form mode="view" initialValue={${this.camelCaseModel}Query.data} />`
          )
          .write(`<Button type="primary" onClick={handleEdit}>`)
          .write('Edit')
          .write('</Button>')
          .write(`<Button type="primary" danger onClick={handleDelete}>`)
          .write('Delete')
          .write('</Button>')
          .write('</div>')
          .write(');');
      },
    });
  }

  private addImports(file: SourceFile): void {
    // React
    file.addImportDeclaration({
      moduleSpecifier: 'react',
      defaultImport: 'React',
      namedImports: ['useCallback'],
    });

    // React router
    file.addImportDeclaration({
      moduleSpecifier: 'react-router-dom',
      namedImports: ['useNavigate', 'useParams'],
    });

    // Components
    file.addImportDeclaration({
      moduleSpecifier: this.getRelativeImportPath(
        this.config.web.rootPath,
        this.config.web.buttonComponentFilePath,
        file
      ),
      namedImports: ['Button'],
    });
    file.addImportDeclaration({
      moduleSpecifier: this.getRelativeImportPath(
        this.config.web.rootPath,
        this.config.web.modalFilePath,
        file
      ),
      namedImports: ['Modal'],
    });
    file.addImportDeclaration({
      moduleSpecifier: this.getRelativeImportPath(
        this.config.web.rootPath,
        this.config.web.messageFilePath,
        file
      ),
      namedImports: ['message'],
    });
    file.addImportDeclaration({
      moduleSpecifier: `../components/${this.pascalCaseModel}Form`,
      namedImports: [`${this.pascalCaseModel}Form`],
    });
    file.addImportDeclaration({
      moduleSpecifier: `../components/${this.pascalCaseModel}Skeleton`,
      namedImports: [`${this.pascalCaseModel}Skeleton`],
    });
    file.addImportDeclaration({
      moduleSpecifier: `../components/${this.pascalCaseModel}Error`,
      namedImports: [`${this.pascalCaseModel}Error`],
    });

    // Api
    file.addImportDeclaration({
      moduleSpecifier: `../api/${this.kebabCaseModel}.hooks`,
      namedImports: [`useDelete${this.pascalCaseModel}Mutation`, `use${this.pascalCaseModel}`],
    });

    // Utils
    file.addImportDeclaration({
      moduleSpecifier: this.getRelativeImportPath(
        this.config.web.rootPath,
        this.config.web.apiErrorsFilePath,
        file
      ),
      namedImports: ['isApiError'],
    });
  }
}
