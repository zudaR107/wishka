# i18n Foundation

## Default Locale
- `ru` is the default locale for the current foundation.

## Structure
- `src/modules/i18n/server.ts`: centralized access to locale dictionaries
- `src/modules/i18n/dictionaries/ru/*`: namespace-based dictionaries for Russian

## Namespaces
- `common`: shared short labels
- `metadata`: application metadata strings
- `app`: current app shell, auth flow, owner dashboard, and protected-route text

## Current Usage
- The `app` namespace now covers owner dashboard empty states, CRUD form labels,
  per-action success messages, and action-aware error feedback on `/`.

## Growth Rule
- Add future locales by mirroring the same namespace files, for example
  `src/modules/i18n/dictionaries/en/*`, without changing the `getTranslations`
  call sites.
