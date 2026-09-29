-- 언어 학습 기록용 스키마입니다.
-- 서비스 롤 키는 이 파일에 두지 않습니다.
-- 서비스 롤은 RLS를 우회하므로 서버에만 둡니다.
--
-- 저장 버킷 이름: snippet-files
-- 비공개 버킷으로 두고, 객체 경로의 첫 폴더를 사용자 id로 맞춥니다.
-- 다음 단계의 storage.objects 정책은 bucket_id = 'snippet-files' 이고
-- 첫 폴더가 auth.uid()와 같을 때만 읽기와 쓰기를 허용합니다.
-- 이 파일은 storage 스키마를 수정하지 않습니다.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  created_at timestamptz not null default now()
);

create table public.languages (
  id bigint generated always as identity primary key,
  name text not null unique,
  summary text not null,
  created_at timestamptz not null default now()
);

create table public.study_notes (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  language_id bigint not null references public.languages (id),
  body text not null check (char_length(body) > 0),
  created_at timestamptz not null default now()
);

create index study_notes_user_id_idx on public.study_notes (user_id);

alter table public.profiles enable row level security;
alter table public.languages enable row level security;
alter table public.study_notes enable row level security;

grant select, insert, update on public.profiles to authenticated;
grant select on public.languages to authenticated;
grant select, insert, update, delete on public.study_notes to authenticated;
grant usage, select on all sequences in schema public to authenticated;

create policy profiles_select_own
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

create policy profiles_insert_own
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

create policy profiles_update_own
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy languages_select_all
  on public.languages
  for select
  to authenticated
  using (true);

create policy study_notes_select_own
  on public.study_notes
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy study_notes_insert_own
  on public.study_notes
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy study_notes_update_own
  on public.study_notes
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy study_notes_delete_own
  on public.study_notes
  for delete
  to authenticated
  using (auth.uid() = user_id);

insert into public.languages (name, summary)
values
  ('Python', 'Python은 들여쓰기로 블록을 나타내고, 동적 타입으로 값을 다룹니다.'),
  ('JavaScript', 'JavaScript는 이벤트 루프 위에서 비동기 작업을 이어 갑니다.'),
  ('Go', 'Go는 고루틴으로 가벼운 동시 실행을 표현합니다.'),
  ('Rust', 'Rust는 소유권으로 메모리 안전을 돕습니다.'),
  ('TypeScript', 'TypeScript의 타입은 컴파일되면 JavaScript로 지워집니다.'),
  ('Kotlin', 'Kotlin은 널 가능 여부를 타입으로 구분합니다.'),
  ('Elixir', 'Elixir는 BEAM의 가벼운 프로세스로 상태를 격리합니다.'),
  ('Zig', 'Zig는 메모리 할당자를 호출하는 쪽에서 넘깁니다.'),
  ('Dart', 'Dart는 사운드 널 안전성을 타입 시스템에 둡니다.'),
  ('Haskell', 'Haskell은 순수 함수와 지연 평가를 기본으로 합니다.')
on conflict (name) do nothing;
