---
description: Generate environment files from .env (runs automatically with build/start)
---
Generate environment files from `.env`:

```bash
node scripts/genenv.js
```

This overwrites `src/environments/environment*.ts` from `.env`.
**Edit `.env`, never the generated files.** Never commit secrets.