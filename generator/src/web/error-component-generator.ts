import { SourceFile } from 'ts-morph';

import { TypescriptGenerator } from '../common/typescript-generator';
import { objectToString } from '../utils/writer.utils';

export class ErrorComponentGenerator extends TypescriptGenerator {
  async generate(file: SourceFile): Promise<void> {
    this.addImports(file);
    this.addErrorComponent(file);
  }

  private addErrorComponent(file: SourceFile): void {
    const { operations } = this.config;

    file.addTypeAlias({
      name: `${this.pascalCaseModel}ErrorProps`,
      isExported: true,
      type: objectToString({
        error: 'unknown',
      }),
    });

    file.addFunction({
      name: `${this.pascalCaseModel}Error`,
      isExported: true,
      parameters: [
        {
          name: '{ error }',
          type: `${this.pascalCaseModel}ErrorProps`,
        },
      ],
      statements: writer => {
        writer.writeLine('const navigate = useNavigate()');
        writer.writeLine('');

        if (operations.findById || operations.update) {
          writer
            .write(
              `if (isApiError(error) && error.json.code === '${this.snakeCaseModel.toUpperCase()}_NOT_FOUND')`
            )
            .block(() => {
              writer
                .write('return (')
                .write('<Result ')
                .write('status="404"')
                .write('title="404"')
                .write('subTitle="Sorry, the page you visited does not exist."')
                .write(
                  `extra={<Button type="primary" onClick={() => navigate('/${this.pluralKebabCaseModel}')}>`
                )
                .write('Back Home')
                .write('</Button>}')
                .write('/>')
                .write(')');
            });
        }

        writer.writeLine('');
        writer
          .write('return (')
          .write('<Result ')
          .write('status="500"')
          .write('title="500"')
          .write('subTitle="Sorry, a unknown error happened."')
          .write(
            `extra={<Button type="primary" onClick={() => navigate('/${this.pluralKebabCaseModel}')}>`
          )
          .write('Back Home')
          .write('</Button>}')
          .write('/>')
          .write(')');
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
        this.config.web.resultComponentFilePath,
        file
      ),
      namedImports: ['Result'],
    });
    file.addImportDeclaration({
      moduleSpecifier: this.getRelativeImportPath(
        this.config.web.rootPath,
        this.config.web.buttonComponentFilePath,
        file
      ),
      namedImports: ['Button'],
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
