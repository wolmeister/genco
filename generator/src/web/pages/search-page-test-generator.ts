import { CodeBlockWriter, SourceFile, VariableDeclarationKind } from 'ts-morph';

import { getPermissionRole } from '../../common/roles';
import { TypescriptGenerator } from '../../common/typescript-generator';
import { generateModelMock } from '../../utils/mock.utils';
import { humanize, quote } from '../../utils/string.utils';
import { objectToString } from '../../utils/writer.utils';

export class SearchPageTestGenerator extends TypescriptGenerator {
  async generate(file: SourceFile): Promise<void> {
    this.addImports(file);
    this.addMocks(file);
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

  private addMocks(file: SourceFile): void {
    file.addStatements(writer => {
      writer
        .write(`jest.mock('../api/${this.kebabCaseModel}.client', () => (`)
        .write(
          objectToString({
            [`find${this.pluralPascalCaseModel}`]: 'jest.fn()',
            [`find${this.pascalCaseModel}`]: 'jest.fn()',
          })
        )
        .write('));');
    });

    generateModelMock(`${this.camelCaseModel}Mock`, true, this.config, file);

    file.addVariableStatement({
      declarationKind: VariableDeclarationKind.Const,
      declarations: [
        {
          name: `paginated${this.pascalCaseModel}Mock`,
          type: `Paginated${this.pascalCaseModel}`,
          initializer: objectToString({
            totalCount: '1',
            pageInfo: {
              hasNextPage: 'false',
              hasPreviousPage: 'false',
              startCursor: `${this.camelCaseModel}Mock.id`,
              endCursor: `${this.camelCaseModel}Mock.id`,
            },
            edges: `[${objectToString({
              cursor: `${this.camelCaseModel}Mock.id`,
              node: `${this.camelCaseModel}Mock`,
            })}]`,
          }),
        },
      ],
    });

    const pathname = quote(`/${this.pluralKebabCaseModel}`);

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

        if (this.config.permissions.findMultiple.type !== 'public') {
          let role = '';
          if (this.config.permissions.findMultiple.type === 'role') {
            role = quote(
              getPermissionRole(this.config, this.config.permissions.findMultiple, 'findMultiple')
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
      .write(
        `const find${this.pluralPascalCaseModel}Mock = find${this.pluralPascalCaseModel} as jest.Mock;`
      )
      .write(
        `find${this.pluralPascalCaseModel}Mock.mockReturnValue(new Promise(() => {
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
      .write('</QueryClientProvider>);');

    writer
      .blankLine()
      .write("expect(container.getElementsByClassName('ant-spin')[0]).toBeInTheDocument()");
  }

  private addTableTest(writer: CodeBlockWriter): void {
    writer
      .write(
        `const find${this.pluralPascalCaseModel}Mock = find${this.pluralPascalCaseModel} as jest.Mock;`
      )
      .write(
        `find${this.pluralPascalCaseModel}Mock.mockReturnValue(paginated${this.pascalCaseModel}Mock);`
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
      .write('</QueryClientProvider>);');

    writer.blankLine();

    for (const [fieldName, field] of Object.entries(this.config.fields)) {
      // TODO - Add support to these fields
      if (field.type === 'date' || field.type === 'boolean') {
        continue;
      }

      const nullableFix = field.required ? '' : " ?? ''";
      writer.write(
        `expect(await screen.findByText(${this.camelCaseModel}Mock.${fieldName}${nullableFix})).toBeInTheDocument();`
      );
    }
  }

  private addTableCLickTest(writer: CodeBlockWriter): void {
    writer
      .write(
        `const find${this.pluralPascalCaseModel}Mock = find${this.pluralPascalCaseModel} as jest.Mock;`
      )
      .write(
        `find${this.pluralPascalCaseModel}Mock.mockReturnValue(paginated${this.pascalCaseModel}Mock);`
      )
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
      .write('render(')
      .write('<QueryClientProvider client={mocks.mockedQueryClient}>')
      .write('<RouterProvider router={mocks.mockedRouter} />')
      .write('</QueryClientProvider>);');

    for (const [fieldName, field] of Object.entries(this.config.fields)) {
      // TODO - Add support to these fields
      if (field.type === 'date' || field.type === 'boolean') {
        continue;
      }

      const nullableFix = field.required ? '' : " ?? ''";
      writer
        .blankLine()
        .write(
          `fireEvent.click(await screen.findByText(${this.camelCaseModel}Mock.${fieldName}${nullableFix}));`
        );

      break;
    }

    writer
      .blankLine()
      .write(
        `expect(mocks.mockedRouter.state.location.pathname).toBe('/${this.pluralKebabCaseModel}/' + ${this.camelCaseModel}Mock.id);`
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
      namedImports: [this.pascalCaseModel, `Paginated${this.pascalCaseModel}`],
    });
    file.addImportDeclaration({
      moduleSpecifier: `../api/${this.kebabCaseModel}.client`,
      namedImports: [`find${this.pascalCaseModel}`, `find${this.pluralPascalCaseModel}`],
    });
  }
}
