import {parseFrom} from './partParsers.js';
import {addError} from './utils.js';

import type {DynamicImport, ExcludeUndefined, MutableImportsExports, OnParse} from './types';

/**
 * Adds error of parsing `import('...')`/`import("...")` statement.
 */
export const onDynamicImportError: OnParse<MutableImportsExports, 1> = (
  importsExports,
  _source,
  {start, end},
) => addError(importsExports, 'Cannot find end of `import(...)` statement', start, end);

/**
 * Parses `import('...')`/`import("...")` statement.
 */
export const onDynamicImportParse: OnParse<MutableImportsExports, 3> = (
  importsExports,
  source,
  {start: importStart},
  {start: unparsedStart},
  {start: unparsedEnd, end: importEnd, token: endToken},
) => {
  const unparsed = source.slice(unparsedStart, unparsedEnd);
  const isTypeImport = source.slice(importStart - 7, importStart) === 'typeof ';
  const quoteCharacter = endToken[0];

  if (quoteCharacter === undefined) {
    return addError(
      importsExports,
      `Cannot find end of path string literal of dynamic \`import(...)\`${isTypeImport ? ' of type' : ''}`,
      importStart,
      importEnd,
    );
  }

  const {from, index} = parseFrom(quoteCharacter, unparsed);

  if (index !== 0) {
    return addError(
      importsExports,
      `Cannot find start of path string literal of dynamic \`import(${quoteCharacter}...${quoteCharacter})\`${isTypeImport ? ' of type' : ''}`,
      importStart,
      importEnd,
    );
  }

  const parsedImport: DynamicImport = {start: importStart, end: importEnd};

  let key: 'dynamicImports' | 'typeDynamicImports' = 'dynamicImports';

  if (isTypeImport) {
    key = 'typeDynamicImports';
  }

  let imports = importsExports[key];

  imports ??= importsExports[key] = {__proto__: null} as ExcludeUndefined<typeof imports>;

  let importsList = imports[from];

  importsList ??= imports[from] = [];

  (importsList as DynamicImport[]).push(parsedImport);
};
