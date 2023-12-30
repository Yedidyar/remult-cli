# remult-cli

## 0.5.2

### Patch Changes

- fix typescript issues

## 0.5.1

### Patch Changes

- 1b21af3: add cmd "pull"

## 0.5.0

### Minor Changes

- 9da7e94: remove TMP_JYC flag
  new formats (timestamp with time zone, json, jsonb)
  refactor singular / plural table name
  options to give different schemas
  Relations.toOne & raw
  Relations.toMany
  entities & enums index.ts

### Patch Changes

- 9da7e94: feat - adding schemas-prefix SMART, NEVER or ALWAYS to name your entities

## 0.4.1

### Patch Changes

- 1ba1caf: update readme

  fix: pluralize keys kababToConstantCase to handle from camelCase space PascalCase

  fix: use kababToConstantCase on enum defaultVal

## 0.4.0

### Minor Changes

- add custom-decorators flag & add default-order-by flag
