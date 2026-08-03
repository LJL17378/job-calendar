create extension if not exists pgcrypto;

create type public.calendar_kind as enum ('personal', 'job', 'holiday', 'imported');
create type public.application_status as enum ('active', 'offer', 'rejected', 'withdrawn', 'archived');
create type public.stage_status as enum ('pending', 'active', 'completed', 'skipped');
create type public.transition_action as enum ('advance', 'jump', 'back', 'skip', 'edit');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  time_zone text not null default 'Asia/Shanghai',
  locale text not null default 'zh-CN',
  week_starts_on smallint not null default 1 check (week_starts_on between 0 and 6),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.calendars (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  name text not null, color text not null default '#5b6ee1', kind public.calendar_kind not null default 'personal',
  read_only boolean not null default false, visible boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(id,user_id)
);
create table public.companies (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  name text not null, website text not null default '', color text not null default '#5b6ee1',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(id,user_id)
);
create table public.pipeline_templates (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  name text not null, is_default boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(id,user_id)
);
create table public.pipeline_template_stages (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  template_id uuid not null references public.pipeline_templates(id) on delete cascade, name text not null,
  position integer not null check(position >= 0), color text not null default '#5b6ee1', unique(template_id,position), unique(id,user_id)
);
create table public.applications (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete restrict, role text not null, job_url text not null default '',
  location text not null default '', work_mode text not null default 'hybrid' check(work_mode in ('onsite','hybrid','remote')),
  salary text not null default '', source text not null default '', applied_at timestamptz, contact text not null default '',
  tags text[] not null default '{}', notes text not null default '', status public.application_status not null default 'active',
  current_stage_id uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(id,user_id)
);
create table public.application_stages (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  application_id uuid not null references public.applications(id) on delete cascade, name text not null,
  position integer not null check(position >= 0), status public.stage_status not null default 'pending',
  planned_at timestamptz, completed_at timestamptz, color text not null default '#5b6ee1',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(application_id,position), unique(id,user_id)
);
alter table public.applications add constraint applications_current_stage_fk foreign key(current_stage_id) references public.application_stages(id) on delete set null;
create table public.calendar_events (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  calendar_id uuid not null references public.calendars(id) on delete cascade, title text not null, description text not null default '', location text not null default '',
  starts_at timestamptz not null, ends_at timestamptz not null, all_day boolean not null default false, time_zone text not null default 'Asia/Shanghai',
  recurrence_rule text, application_id uuid references public.applications(id) on delete set null, stage_id uuid references public.application_stages(id) on delete set null,
  imported_uid text, recurrence_id text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check(ends_at >= starts_at), unique(id,user_id)
);
create unique index calendar_events_import_identity on public.calendar_events(user_id,imported_uid,coalesce(recurrence_id,'')) where imported_uid is not null;
create table public.calendar_event_exceptions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  event_id uuid not null references public.calendar_events(id) on delete cascade, occurrence_start timestamptz not null,
  cancelled boolean not null default false, override jsonb not null default '{}', created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(event_id,occurrence_start), unique(id,user_id)
);
create table public.stage_transitions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  application_id uuid not null references public.applications(id) on delete cascade,
  from_stage_id uuid references public.application_stages(id) on delete set null, to_stage_id uuid references public.application_stages(id) on delete set null,
  action public.transition_action not null, occurred_at timestamptz not null default now(), note text not null default '', unique(id,user_id)
);
create table public.calendar_imports (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  calendar_id uuid not null references public.calendars(id) on delete cascade, file_name text not null,
  total integer not null default 0, created integer not null default 0, updated integer not null default 0, skipped integer not null default 0,
  created_at timestamptz not null default now(), unique(id,user_id)
);
create table public.calendar_import_items (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  import_id uuid not null references public.calendar_imports(id) on delete cascade, event_id uuid references public.calendar_events(id) on delete set null,
  uid text not null, recurrence_id text, result text not null check(result in ('created','updated','skipped','error')), error text,
  created_at timestamptz not null default now(), unique(id,user_id)
);
create table public.calendar_subscriptions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null, name text not null, enabled boolean not null default true, config jsonb not null default '{}',
  refreshed_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(user_id,provider)
);
create table public.external_connections (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null, status text not null default 'disconnected', encrypted_credentials text,
  config jsonb not null default '{}', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(user_id,provider)
);
create table public.external_event_mappings (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  connection_id uuid not null references public.external_connections(id) on delete cascade,
  event_id uuid not null references public.calendar_events(id) on delete cascade, external_calendar_id text not null, external_event_id text not null,
  external_etag text, last_synced_at timestamptz, unique(connection_id,external_event_id), unique(id,user_id)
);

create or replace function public.set_updated_at() returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end $$;
do $$ declare table_name text; begin foreach table_name in array array['profiles','calendars','companies','pipeline_templates','applications','application_stages','calendar_events','calendar_event_exceptions','calendar_subscriptions','external_connections'] loop execute format('create trigger set_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()',table_name,table_name); end loop; end $$;

alter table public.profiles enable row level security;
create policy "profiles own row" on public.profiles for all using(auth.uid()=id) with check(auth.uid()=id);
do $$ declare table_name text; begin foreach table_name in array array['calendars','companies','pipeline_templates','pipeline_template_stages','applications','application_stages','calendar_events','calendar_event_exceptions','stage_transitions','calendar_imports','calendar_import_items','calendar_subscriptions','external_connections','external_event_mappings'] loop execute format('alter table public.%I enable row level security',table_name); execute format('create policy "users own %1$s" on public.%1$I for all using(auth.uid()=user_id) with check(auth.uid()=user_id)',table_name); end loop; end $$;

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
declare template uuid;
begin
  insert into profiles(id,display_name) values(new.id,coalesce(new.raw_user_meta_data->>'name',''));
  insert into calendars(user_id,name,color,kind) values(new.id,'个人日历','#5b6ee1','personal'),(new.id,'求职日程','#e76f51','job'),(new.id,'中国节假日','#2a9d8f','holiday');
  insert into pipeline_templates(user_id,name,is_default) values(new.id,'默认招聘流程',true) returning id into template;
  insert into pipeline_template_stages(user_id,template_id,name,position,color) values
    (new.id,template,'关注中',0,'#5b6ee1'),(new.id,template,'已投递',1,'#e76f51'),(new.id,template,'笔试/OA',2,'#2a9d8f'),
    (new.id,template,'一面',3,'#5b6ee1'),(new.id,template,'二面',4,'#e76f51'),(new.id,template,'终面',5,'#2a9d8f'),(new.id,template,'Offer',6,'#5b6ee1');
  insert into calendar_subscriptions(user_id,provider,name,enabled,config) values(new.id,'china-holidays','中国节假日',true,'{"region":"CN"}');
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

insert into storage.buckets(id,name,public,file_size_limit) values('job-calendar-attachments','job-calendar-attachments',false,10485760) on conflict(id) do nothing;
create policy "users read own attachments" on storage.objects for select using(bucket_id='job-calendar-attachments' and auth.uid()::text=(storage.foldername(name))[1]);
create policy "users upload own attachments" on storage.objects for insert with check(bucket_id='job-calendar-attachments' and auth.uid()::text=(storage.foldername(name))[1]);
create policy "users update own attachments" on storage.objects for update using(bucket_id='job-calendar-attachments' and auth.uid()::text=(storage.foldername(name))[1]);
create policy "users delete own attachments" on storage.objects for delete using(bucket_id='job-calendar-attachments' and auth.uid()::text=(storage.foldername(name))[1]);
