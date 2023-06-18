import { CodeBlockWriter, SourceFile } from 'ts-morph';

import { getPermissionRole } from '../../common/roles';
import { TypescriptGenerator } from '../../common/typescript-generator';
import { generateModelMock } from '../../utils/mock.utils';
import { humanize, quote } from '../../utils/string.utils';
import { objectToString } from '../../utils/writer.utils';

export class ViewPageTestGenerator extends TypescriptGenerator {
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

          if (this.config.permissions.findById.type !== 'public') {
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

          if (this.config.permissions.findById.type === 'role') {
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
            [`delete${this.pascalCaseModel}`]: 'jest.fn()',
          })
        )
        .write('));');
    });

    generateModelMock(`${this.camelCaseModel}Mock`, true, this.config, file);

    const basePathname = quote(`/${this.pluralKebabCaseModel}/`);
    const pathname = `${basePathname}+ ${this.camelCaseModel}Mock.id`;

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

        if (this.config.permissions.findById.type !== 'public') {
          let role = '';
          if (this.config.permissions.findById.type === 'role') {
            role = quote(
              getPermissionRole(this.config, this.config.permissions.findById, 'findById')
            );
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

  private addDataTest(writer: CodeBlockWriter): void {
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

    writer
      .blankLine()
      .write(" expect(await screen.findByText('Edit')).toBeInTheDocument();")
      .write("expect(screen.getByText('Delete')).toBeInTheDocument();");

    for (const [fieldName, field] of Object.entries(this.config.fields)) {
      // TODO - Add support to these fields
      if (field.type === 'date' || field.type === 'boolean') {
        continue;
      }
      if (field.type === 'string' && field.options) {
        continue;
      }

      const nullableFix = field.required ? '' : " ?? ''";
      writer.write(
        `expect(screen.getByDisplayValue(${this.camelCaseModel}Mock.${fieldName}${nullableFix})).toBeInTheDocument();`
      );
    }
  }

  private addEditTest(writer: CodeBlockWriter): void {
    const basePathname = quote(`/${this.pluralKebabCaseModel}/`);
    const editPathname = `${basePathname}+ ${this.camelCaseModel}Mock.id + '/update'`;

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
      .write('</QueryClientProvider>);');

    writer.blankLine().write("fireEvent.click(await screen.findByText('Edit'));");

    writer
      .blankLine()
      .write(`expect(mocks.mockedRouter.state.location.pathname).toBe(${editPathname});`);
  }

  private addDeleteTest(writer: CodeBlockWriter): void {
    writer
      .write(`const find${this.pascalCaseModel}Mock = find${this.pascalCaseModel} as jest.Mock;`)
      .write(`find${this.pascalCaseModel}Mock.mockResolvedValue(${this.camelCaseModel}Mock);`)
      .write(
        `const delete${this.pascalCaseModel}Mock = delete${this.pascalCaseModel} as jest.Mock;`
      )
      .write(`delete${this.pascalCaseModel}Mock.mockResolvedValue(${this.camelCaseModel}Mock);`);

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
      .write("fireEvent.click(await screen.findByText('Delete'));")
      .write(
        `await screen.findByText('Do you want to delete this ${humanize(
          this.config.model,
          true
        )}?');`
      )
      .write("fireEvent.click(await screen.findByText('OK'));");

    writer
      .blankLine()
      .write(
        `expect(await screen.findByText('${humanize(
          this.config.model
        )} deleted successfully!')).toBeInTheDocument();`
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
        " expect(await screen.findByText('Sorry, you are not authorized to access this page.')).toBeInTheDocument();"
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
    const apiImportDeclaration = file.addImportDeclaration({
      moduleSpecifier: `../api/${this.kebabCaseModel}.client`,
      namedImports: [`find${this.pascalCaseModel}`],
    });

    if (this.config.operations.delete) {
      apiImportDeclaration.addNamedImport(`delete${this.pascalCaseModel}`);
    }
  }
}
