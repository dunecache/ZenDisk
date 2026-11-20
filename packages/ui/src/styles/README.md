# Design tokens

The canonical ZenDisk design tokens (color, typography, spacing, radius,
elevation, motion) are defined in:

`apps/desktop/src/renderer/styles/`

- `tokens.css` — semantic design token variables (source of truth)
- `themes.css` — light and dark theme variable overrides
- `typography.css` — type scale and font primitives
- `components.css` — shared component-level token compositions
- `globals.css` — global resets and token imports

When shared primitives are added to `@zendisk/ui`, this folder can host a
copy of the token stylesheet for package-level consumption.
