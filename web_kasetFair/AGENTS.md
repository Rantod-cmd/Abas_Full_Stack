# Repository Guidelines

## Project Structure & Module Organization

- `app/`: Next.js app router pages and layouts (`page.tsx`, `dashboard`, `login`).
- `components/`: Reusable UI primitives (buttons, cards, inputs, skeleton) and dashboard widgets.
- `lib/`: Auth/config utilities.
- `public/`: Static assets.
- `app/dashboard/constants.ts`: Seed/mock data (advice, CSV, metrics) and palette.
- `app/dashboard/components/`: Dashboard cards (advice, financial table, chart, product mix, sidebar/header).

## Build, Test, and Development Commands

- `npm run dev`: Start the Next.js dev server.
- `npm run build`: Production build.
- `npm run start`: Run the built app.
- `npm run lint`: Lint the codebase with ESLint.

## Coding Style & Naming Conventions

- TypeScript + React (Next.js). Prefer functional components and hooks.
- Use Tailwind utility classes already present; keep classNames concise.
- Follow existing naming: components in `PascalCase.tsx`, helpers in `camelCase`.
- Linting: ESLint (Next.js config). Fix issues before committing.
- Avoid inline `any`; use typed helpers in `app/dashboard/types.ts`.

## Testing Guidelines

- Currently no automated tests present; add tests co-located when introducing complex logic.
- Name test files `*.test.ts`/`*.test.tsx`. Prefer lightweight unit tests for utils and component logic.
- Run `npm run lint` before pushing to catch basic issues.

## Commit & Pull Request Guidelines

- Commits: keep messages imperative and scoped, e.g., `Align dashboard with new API responses`.
- PRs: include summary, screenshots for UI changes, steps to reproduce/test, and link related issues.
- Do not ship lint errors; ensure `npm run lint` passes.

## Security & Configuration Tips

- Secrets for Google OAuth live in environment variables (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_SECRET`); never commit them.
- API endpoint currently hardcoded to `http://localhost:8000/generate-plan` in `usePlannerState`; move to env config for deployment.

## Agent-Specific Instructions

- Preserve existing user-touched changes; avoid destructive git commands.
- Use `apply_patch` for small edits; prefer `rg` for searches.
- Keep responses concise and reference files with relative paths when describing changes.\*\*\*

## Don't

- don't hardcode colors
