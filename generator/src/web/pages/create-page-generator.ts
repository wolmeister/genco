import { SourceFile } from 'ts-morph';

import { TypescriptGenerator } from '../../common/typescript-generator';
import { humanize, quote, snakeCase } from '../../utils/string.utils';
import { objectToString } from '../../utils/writer.utils';

export class CreatePageGenerator extends TypescriptGenerator {
  async generate(file: SourceFile): Promise<void> {
    this.addImports(file);
    this.addCreatePage(file);
  }

  private addCreatePage(file: SourceFile): void {
    const fields = this.config.fields;

    file.addFunction({
      name: `Create${this.pascalCaseModel}Page`,
      isExported: true,
      statements: writer => {
        writer.writeLine('const navigate = useNavigate()');
        writer.writeLine(
          `const create${this.pascalCaseModel}Mutation = useCreate${this.pascalCaseModel}Mutation();`
        );
        writer.writeLine('');

        // Add submit
        writer
          .write('const handleSubmit = useCallback(')
          .write(`async (data: ${this.pascalCaseModel}FormValue,`)
          .write(`form: FormInstance<${this.pascalCaseModel}FormValue>) =>`)
          .block(() => {
            writer
              .write('try')
              .block(() => {
                writer.write(
                  `const ${this.camelCaseModel} = await create${this.pascalCaseModel}Mutation.mutateAsync(data);`
                );
                writer.write(
                  `message.success('${humanize(this.pascalCaseModel)} created successfully!');`
                );
                writer.write(
                  `navigate('/${this.pluralKebabCaseModel}/' + ${this.camelCaseModel}.id);`
                );
              })
              .write('catch (error)')
              .block(() => {
                let haveCustomError = false;

                for (const [fieldName, field] of Object.entries(fields)) {
                  if (field.unique === false) {
                    continue;
                  }
                  if (haveCustomError === true) {
                    // If it's not the first field, we need to include the else clause
                    // Otherwise it's just a if
                    writer.write('else ');
                  }
                  haveCustomError = true;

                  const errorName = `${this.snakeCaseModel.toUpperCase()}_${snakeCase(
                    fieldName
                  ).toUpperCase()}_NOT_UNIQUE`;
                  const humanModelName = humanize(this.pascalCaseModel, true);
                  const humanFieldName = humanize(fieldName, true);
                  const message = `A ${humanModelName} with this ${humanFieldName} already exists!`;

                  writer
                    .write(`if (isApiError(error) && error.json.code === '${errorName}')`)
                    .block(() => {
                      writer
                        .write('form.setFields([')
                        .write(
                          objectToString({
                            name: quote(fieldName),
                            errors: `[${quote(message)}]`,
                          })
                        )
                        .write(']);');
                    });
                }

                writer.conditionalWrite(haveCustomError, 'else {');
                writer.write("message.error('An unknown error occurred');");
                writer.conditionalWrite(haveCustomError, '}');
              });
          })
          .write(`, [navigate, create${this.pascalCaseModel}Mutation]);`);

        // Add render
        writer.writeLine('');
        writer.write(
          `return <${this.pascalCaseModel}Form mode="create" onSubmit={handleSubmit} />`
        );
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
      namedImports: ['useNavigate'],
    });

    // Components
    file.addImportDeclaration({
      moduleSpecifier: this.getRelativeImportPath(
        this.config.web.rootPath,
        this.config.web.formComponentFilePath,
        file
      ),
      namedImports: ['FormInstance'],
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
      namedImports: [`${this.pascalCaseModel}Form`, `${this.pascalCaseModel}FormValue`],
    });

    // Api
    file.addImportDeclaration({
      moduleSpecifier: `../api/${this.kebabCaseModel}.hooks`,
      namedImports: [`useCreate${this.pascalCaseModel}Mutation`],
    });

    // Utils
    if (Object.values(this.config.fields).some(f => f.unique)) {
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
}
