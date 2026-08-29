# EduQuest Production v7

Public Vercel build of EduQuest for grades 1–4.

- Kid-first login: nickname, grade and avatar; no password is required on the current device.
- Russian, Uzbek and English interfaces.
- Learning hub, story missions, mini-games, coding, English, technology and room progression.
- Works without a database in device mode; progress is stored in the browser on that device.
- Cloud sync and staff tools can be connected later through Supabase; they are not required for this public static deployment.

## Build

```bash
npm install
npm run build
```

Vercel uses `vercel.json` and serves the generated `dist/` directory.
