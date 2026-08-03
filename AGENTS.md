# Repository guidelines

- Use Node 22.21.1 and pnpm 10.34.3. Do not add npm or Yarn lockfiles.
- Keep every FullCalendar package on exactly the same 6.1.x version.
- UI components consume domain types through `src/data`; they must not issue Supabase queries directly.
- Every user-owned database table must have RLS and a `user_id` ownership policy.
- Preserve responsive behavior at 390px phone, 768–1024px tablet, and desktop widths.
- Before committing, run `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`, and relevant Playwright tests.
- Never commit `.env` files, service-role keys, OAuth tokens, or user calendar data.
