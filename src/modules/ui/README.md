# UI Foundation

## Theme Scope
- Light theme only for now.

## Tokens
- Theme tokens live in `src/app/globals.css` as CSS custom properties.
- Current token groups: colors, typography, spacing, radii, focus states.

## Foundation Blocks
- `PageShell`: base page container and surface composition.
- `LinkCard`: neutral interactive card for route-level navigation.

## Growth Rule
- Add future theme tokens by extending the same custom property contract.
- Keep new primitives small and driven by real reuse in the app shell.
