alter table public.calendar_events
  add column if not exists color text
  check (color is null or color ~ '^#[0-9A-Fa-f]{6}$');
