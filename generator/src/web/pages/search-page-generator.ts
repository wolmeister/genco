import { SourceFile } from 'ts-morph';

import { TypescriptGenerator } from '../../common/typescript-generator';
import { humanize, quote } from '../../utils/string.utils';
import { objectToString } from '../../utils/writer.utils';

export class SearchPageGenerator extends TypescriptGenerator {
  async generate(file: SourceFile): Promise<void> {
    this.addImports(file);
    this.addSearchPage(file);
  }

  private addSearchPage(file: SourceFile): void {
    file.addFunction({
      name: `${this.pluralPascalCaseModel}Page`,
      isExported: true,
      statements: writer => {
        writer.writeLine('const navigate = useNavigate()');
        writer.writeLine(
          `const ${this.pluralCamelCaseModel}Query = use${this.pluralPascalCaseModel}()`
        );
        writer.writeLine('');

        writer.write('return (').write('<div>');

        if (this.config.operations.create) {
          writer
            .write('<div style={')
            .write(
              objectToString({
                display: quote('flex'),
                justifyContent: quote('end'),
                gap: quote('16px'),
                marginBottom: quote('16px'),
              })
            )
            .write('}>')
            .write(
              `<Button type="primary" onClick={() => navigate('/create-${this.kebabCaseModel}')}>`
            )
            .write('Create')
            .write('</Button>')
            .write('</div>');
        }

        writer
          .write('<Table ')
          .write(`dataSource={${this.pluralCamelCaseModel}Query.data?.edges.map(e => e.node)}`)
          .write(`loading={${this.pluralCamelCaseModel}Query.isLoading}`)
          .write(`rowKey="id"`)
          .write(`onRow=`)
          .block(() => {
            writer
              .write(`${this.camelCaseModel} => (`)
              .write(
                objectToString({
                  onClick: `() => navigate('/${this.pluralKebabCaseModel}/'+${this.camelCaseModel}.id)`,
                })
              )
              .write(')');
          })
          .write(`>`);

        // Add columns
        for (const [fieldName] of Object.entries(this.config.fields)) {
          writer
            .write('<Table.Column ')
            .write(`title="${humanize(fieldName)}"`)
            .write(`dataIndex="${fieldName}"`)
            .write(`key="id"`)
            .write(`/>`);
        }

        writer.write('</Table>').write('</div>').write(');');
      },
    });
  }

  private addImports(file: SourceFile): void {
    // React
    file.addImportDeclaration({
      moduleSpecifier: 'react',
      defaultImport: 'React',
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
        this.config.web.tableComponentFilePath,
        file
      ),
      namedImports: ['Table'],
    });
    file.addImportDeclaration({
      moduleSpecifier: this.getRelativeImportPath(
        this.config.web.rootPath,
        this.config.web.buttonComponentFilePath,
        file
      ),
      namedImports: ['Button'],
    });

    // Api
    file.addImportDeclaration({
      moduleSpecifier: `../api/${this.kebabCaseModel}.hooks`,
      namedImports: [`use${this.pluralPascalCaseModel}`],
    });
  }
}
