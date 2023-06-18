import { CodeBlockWriter, SourceFile } from 'ts-morph';

import { getPermissionRole } from '../../common/roles';
import { TypescriptGenerator } from '../../common/typescript-generator';
import { generateModelMock } from '../../utils/mock.utils';
import { humanize, quote } from '../../utils/string.utils';
import { objectToString } from '../../utils/writer.utils';

export class UpdatePageTestGenerator extends TypescriptGenerator {
  async generate(file: SourceFile): Promise<void> {
    this.addImports(file);
    this.addMocks(file);
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
                this.addUniqueFieldTest(fieldName, writer);
              })
              .write(');');
          }

          if (this.config.permissions.update.type !== 'public') {
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

          if (this.config.permissions.update.type === 'role') {
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

  private addMocks(file: SourceFile): void {
    file.addStatements(writer => {
      writer
        .write(`jest.mock('../api/${this.kebabCaseModel}.client', () => (`)
        .write(
          objectToString({
            [`find${this.pascalCaseModel}`]: 'jest.fn()',
            [`update${this.pascalCaseModel}`]: 'jest.fn()',
          })
        )
        .write('));');
    });

    generateModelMock(`${this.camelCaseModel}Mock`, true, this.config, file);

    const basePathname = quote(`/${this.pluralKebabCaseModel}/`);
    const pathname = `${basePathname}+ ${this.camelCaseModel}Mock.id + '/update'`;

    file.addFunction({
      name: 'createMocks',
      statements: writer => {
        writer
          .write('const mockedQueryClient = new QueryClient(')
          .write(
            objectToString({
              defaultOptions: {
                queries: {
                  retry: 'false',
                },
              },
            })
          )
          .write(');');
        writer
          .write('const mockedRouter = createMemoryRouter(router.routes, ')
          .write(
            objectToString({
              initialEntries: `[{ pathname: ${pathname} }]`,
            })
          )
          .write(');');

        const emptyJwt = 'header.${btoa(JSON.stringify({ scope: [] }))}';
        let jwt: string | null = null;

        if (this.config.permissions.update.type !== 'public') {
          let role = '';
          if (this.config.permissions.update.type === 'role') {
            role = quote(getPermissionRole(this.config, this.config.permissions.update, 'update'));
          }
          jwt = 'header.${btoa(JSON.stringify({ scope: [';
          jwt += role;
          jwt += '] }))}';
        }

        writer.write(`const mockedJwt = ${jwt === null ? 'null' : quote(jwt, '`')};`);
        writer.write(`const emptyJwt = ${quote(emptyJwt, '`')};`);
        writer.write('return { mockedQueryClient, mockedRouter, mockedJwt, emptyJwt };');
      },
    });
  }

  private addLoadingTest(writer: CodeBlockWriter): void {
    writer
      .write(`const find${this.pascalCaseModel}Mock = find${this.pascalCaseModel} as jest.Mock;`)
      .write(
        `find${this.pascalCaseModel}Mock.mockReturnValue(new Promise(() => {
          // Return a promise that never resolves
        }));`
      );

    writer
      .write('const mocks = createMocks();')
      .blankLine()
      .write('setJwt(mocks.mockedJwt)')
      .blankLine();

    writer
      .write('const { container } = render(')
      .write('<QueryClientProvider client={mocks.mockedQueryClient}>')
      .write('<RouterProvider router={mocks.mockedRouter} />')
      .write('</QueryClientProvider>)');

    writer
      .blankLine()
      .write("expect(container.getElementsByClassName('ant-skeleton')[0]).toBeInTheDocument();");
  }

  private addErrorTest(writer: CodeBlockWriter): void {
    writer
      .write(`const find${this.pascalCaseModel}Mock = find${this.pascalCaseModel} as jest.Mock;`)
      .write(
        `find${this.pascalCaseModel}Mock.mockRejectedValue(${objectToString({
          json: {
            code: quote(`${this.snakeCaseModel.toUpperCase()}_NOT_FOUND`),
          },
        })});`
      );

    writer
      .write('const mocks = createMocks();')
      .blankLine()
      .write('setJwt(mocks.mockedJwt)')
      .blankLine();

    writer
      .write('render(')
      .write('<QueryClientProvider client={mocks.mockedQueryClient}>')
      .write('<RouterProvider router={mocks.mockedRouter} />')
      .write('</QueryClientProvider>)');

    writer
      .blankLine()
      .write(
        `expect(await screen.findByText('Sorry, the page you visited does not exist.')).toBeInTheDocument();`
      );
  }

  private addFormTest(writer: CodeBlockWriter): void {
    writer
      .write(`const find${this.pascalCaseModel}Mock = find${this.pascalCaseModel} as jest.Mock;`)
      .write(`find${this.pascalCaseModel}Mock.mockResolvedValue(${this.camelCaseModel}Mock);`);

    writer
      .write('const mocks = createMocks();')
      .blankLine()
      .write('setJwt(mocks.mockedJwt)')
      .blankLine();

    writer
      .write('render(')
      .write('<QueryClientProvider client={mocks.mockedQueryClient}>')
      .write('<RouterProvider router={mocks.mockedRouter} />')
      .write('</QueryClientProvider>)');

    writer.blankLine();

    for (const [fieldName, field] of Object.entries(this.config.fields)) {
      if (field.immutable) {
        continue;
      }

      // TODO - Add support to these fields
      if (field.type === 'date' || field.type === 'boolean') {
        continue;
      }
      if (field.type === 'string' && field.options) {
        continue;
      }

      const nullableFix = field.required ? '' : " ?? ''";
      writer.write(
        `expect(await screen.findByDisplayValue(${this.camelCaseModel}Mock.${fieldName}${nullableFix})).toBeInTheDocument();`
      );
    }
  }

  private addInvalidFormTest(writer: CodeBlockWriter): void {
    writer
      .write(`const find${this.pascalCaseModel}Mock = find${this.pascalCaseModel} as jest.Mock;`)
      .write(`find${this.pascalCaseModel}Mock.mockResolvedValue(${this.camelCaseModel}Mock);`);

    writer
      .write('const mocks = createMocks();')
      .blankLine()
      .write('setJwt(mocks.mockedJwt)')
      .blankLine();

    writer
      .write('const { container } = render(')
      .write('<QueryClientProvider client={mocks.mockedQueryClient}>')
      .write('<RouterProvider router={mocks.mockedRouter} />')
      .write('</QueryClientProvider>)');

    const editableFieldNames = Object.entries(this.config.fields)
      .filter(([, field]) => {
        if (field.immutable || !field.required) {
          return false;
        }

        // TODO - Add support to these fields
        if (field.type === 'date' || field.type === 'boolean') {
          return false;
        }
        if (field.type === 'string' && field.options) {
          return false;
        }

        return true;
      })
      .map(([fieldName]) => fieldName);

    // Wait for the form to load
    const [firstEditableFieldName] = editableFieldNames;

    writer
      .blankLine()
      .write(
        `expect(await screen.findByDisplayValue(${this.camelCaseModel}Mock.${firstEditableFieldName})).toBeInTheDocument();`
      );

    // Reset the fields
    writer.blankLine();
    for (const fieldName of editableFieldNames) {
      writer.write(
        `fireEvent.change(container.querySelectorAll('#${fieldName}')[0], { target: { value: '' } });`
      );
    }

    writer.blankLine().write("fireEvent.click(await screen.findByText('Submit'));");

    // Check the error
    writer.blankLine();
    for (const fieldName of editableFieldNames) {
      writer.write(
        `expect(await screen.findByText('Please input the ${humanize(
          fieldName,
          true
        )}!')).toBeInTheDocument();`
      );
    }
  }

  private addSuccessTest(writer: CodeBlockWriter): void {
    writer
      .write(
        `const update${this.pascalCaseModel}Mock = update${this.pascalCaseModel} as jest.Mock;`
      )
      .write(`update${this.pascalCaseModel}Mock.mockResolvedValue(${this.camelCaseModel}Mock);`)
      .write(`const find${this.pascalCaseModel}Mock = find${this.pascalCaseModel} as jest.Mock;`)
      .write(`find${this.pascalCaseModel}Mock.mockResolvedValue(${this.camelCaseModel}Mock);`);

    writer
      .write('const mocks = createMocks();')
      .blankLine()
      .write('setJwt(mocks.mockedJwt)')
      .blankLine();

    writer
      .write('render(')
      .write('<QueryClientProvider client={mocks.mockedQueryClient}>')
      .write('<RouterProvider router={mocks.mockedRouter} />')
      .write('</QueryClientProvider>)');

    writer.blankLine().write("fireEvent.click(await screen.findByText('Submit'))");

    writer
      .blankLine()
      .write(
        `expect(await screen.findByText('${humanize(
          this.config.model
        )} updated successfully!')).toBeInTheDocument();`
      )
      .write(
        `expect(mocks.mockedRouter.state.location.pathname).toBe('/${this.pluralKebabCaseModel}/' + ${this.camelCaseModel}Mock.id);`
      );
  }

  private addUniqueFieldTest(uniqueFieldName: string, writer: CodeBlockWriter): void {
    writer
      .write(
        `const update${this.pascalCaseModel}Mock = update${this.pascalCaseModel} as jest.Mock;`
      )
      .write(
        `update${this.pascalCaseModel}Mock.mockRejectedValue(${objectToString({
          json: {
            code: quote(
              `${this.snakeCaseModel.toUpperCase()}_${uniqueFieldName.toUpperCase()}_NOT_UNIQUE`
            ),
          },
        })});`
      )
      .write(`const find${this.pascalCaseModel}Mock = find${this.pascalCaseModel} as jest.Mock;`)
      .write(`find${this.pascalCaseModel}Mock.mockResolvedValue(${this.camelCaseModel}Mock);`);

    writer
      .write('const mocks = createMocks();')
      .blankLine()
      .write('setJwt(mocks.mockedJwt)')
      .blankLine();

    writer
      .write('render(')
      .write('<QueryClientProvider client={mocks.mockedQueryClient}>')
      .write('<RouterProvider router={mocks.mockedRouter} />')
      .write('</QueryClientProvider>)');

    writer.blankLine().write("fireEvent.click(await screen.findByText('Submit'))");

    const humanModelName = humanize(this.pascalCaseModel, true);
    const humanFieldName = humanize(uniqueFieldName, true);
    writer
      .blankLine()
      .write(
        ` expect(await screen.findByText('A ${humanModelName} with this ${humanFieldName} already exists!')).toBeInTheDocument();`
      );
  }

  private addAuthenticationTest(writer: CodeBlockWriter): void {
    writer.write('const mocks = createMocks();').blankLine().write('setJwt(null)').blankLine();

    writer
      .write('render(')
      .write('<QueryClientProvider client={mocks.mockedQueryClient}>')
      .write('<RouterProvider router={mocks.mockedRouter} />')
      .write('</QueryClientProvider>)');

    writer
      .blankLine()
      .write(
        " expect(await screen.findByText('Sorry, you need to be logged in to access this page.')).toBeInTheDocument();"
      );
  }

  private addPermissionTest(writer: CodeBlockWriter): void {
    writer
      .write('const mocks = createMocks();')
      .blankLine()
      .write('setJwt(mocks.emptyJwt)')
      .blankLine();

    writer
      .write('render(')
      .write('<QueryClientProvider client={mocks.mockedQueryClient}>')
      .write('<RouterProvider router={mocks.mockedRouter} />')
      .write('</QueryClientProvider>)');

    writer
      .blankLine()
      .write(
        "expect(await screen.findByText('Sorry, you are not authorized to access this page.')).toBeInTheDocument();"
      );
  }

  private addImports(file: SourceFile): void {
    // React
    file.addImportDeclaration({
      moduleSpecifier: 'react',
      defaultImport: 'React',
    });

    // Testing library
    file.addImportDeclaration({
      moduleSpecifier: '@testing-library/react',
      namedImports: ['fireEvent', 'render', 'screen'],
    });

    // React query
    file.addImportDeclaration({
      moduleSpecifier: 'react-query',
      namedImports: ['QueryClient', 'QueryClientProvider'],
    });

    // React router dom
    file.addImportDeclaration({
      moduleSpecifier: 'react-router-dom',
      namedImports: ['createMemoryRouter', 'RouterProvider'],
    });

    // Router
    file.addImportDeclaration({
      moduleSpecifier: this.getRelativeImportPath(
        this.config.web.rootPath,
        this.config.web.routerFilePath,
        file
      ),
      namedImports: ['router'],
    });

    // JWT
    file.addImportDeclaration({
      moduleSpecifier: '../../common/auth/jwt',
      namedImports: ['setJwt'],
    });

    // Api
    file.addImportDeclaration({
      moduleSpecifier: `../api/${this.kebabCaseModel}.types`,
      namedImports: [this.pascalCaseModel],
    });
    file.addImportDeclaration({
      moduleSpecifier: `../api/${this.kebabCaseModel}.client`,
      namedImports: [`find${this.pascalCaseModel}`, `update${this.pascalCaseModel}`],
    });
  }
}
