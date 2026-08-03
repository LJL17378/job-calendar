create or replace function public.ensure_user_workspace()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  target_user uuid := auth.uid();
  template uuid;
begin
  if target_user is null then
    raise exception 'Authentication required';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(target_user::text, 0));

  insert into public.profiles(id, display_name)
  values(target_user, '')
  on conflict(id) do nothing;

  insert into public.calendars(user_id, name, color, kind, read_only)
  select target_user, seed.name, seed.color, seed.kind, seed.read_only
  from (values
    ('个人日历', '#5b6ee1', 'personal'::public.calendar_kind, false),
    ('求职日程', '#e76f51', 'job'::public.calendar_kind, false),
    ('中国节假日', '#2a9d8f', 'holiday'::public.calendar_kind, true)
  ) as seed(name, color, kind, read_only)
  where not exists (
    select 1 from public.calendars
    where user_id = target_user and kind = seed.kind
  );

  update public.calendars
  set read_only = true
  where user_id = target_user and kind = 'holiday' and not read_only;

  select id into template
  from public.pipeline_templates
  where user_id = target_user and is_default
  order by created_at
  limit 1;

  if template is null then
    insert into public.pipeline_templates(user_id, name, is_default)
    values(target_user, '默认招聘流程', true)
    returning id into template;

    insert into public.pipeline_template_stages(user_id, template_id, name, position, color)
    values
      (target_user, template, '关注中', 0, '#5b6ee1'),
      (target_user, template, '已投递', 1, '#e76f51'),
      (target_user, template, '笔试/OA', 2, '#2a9d8f'),
      (target_user, template, '一面', 3, '#5b6ee1'),
      (target_user, template, '二面', 4, '#e76f51'),
      (target_user, template, '终面', 5, '#2a9d8f'),
      (target_user, template, 'Offer', 6, '#5b6ee1');
  end if;

  insert into public.calendar_subscriptions(user_id, provider, name, enabled, config)
  values(target_user, 'china-holidays', '中国节假日', true, '{"region":"CN"}')
  on conflict(user_id, provider) do nothing;
end;
$$;

revoke all on function public.ensure_user_workspace() from public;
grant execute on function public.ensure_user_workspace() to authenticated;
