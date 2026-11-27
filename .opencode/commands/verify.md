---
description: Run build, test, and verify checks
---
Run full verification:

```bash
npm run build
npm test
```
Also verify:
- All affected data screens handle loading, empty, and error states
- No `@spartan-ng/*` or `libs/ui` imports were added
- No `console.log`, commented-out code, or unused imports were introduced
- `docs/` updated if routes, endpoints, models, UI behavior, or tooling changed
- Responsive behavior verified from mobile to desktop
- Keyboard navigation and `:focus-visible` states work