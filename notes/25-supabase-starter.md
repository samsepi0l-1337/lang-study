---
title: "직접 설계하는 Supabase 스타터"
slug: supabase-starter
order: 25
level: "중급"
minutes: 50
tags: [Supabase]
summary: "프로필과 언어와 학습 노트를 RLS로 나누고, 서비스 롤은 서버에만 둡니다."
---

# 직접 설계하는 Supabase 스타터

이 장은 samsepi0l이 언어 학습 기록을 직접 스키마로 설계한 노트입니다.
표는 profiles, languages, study_notes 세 개입니다.
행을 누가 읽을 수 있는지는 SQL에 적습니다.
생성기가 대신 숨기는 구조가 아닙니다.
클라이언트 코드는 만들지 않습니다.
서비스 롤 키도 만들지 않습니다.

## 이 장을 끝내면

- auth.users와 profiles.id가 같은 사용자인지 설명합니다.
- 언어는 모두 읽고, 학습 노트는 자기 행만 고치는 정책을 읽습니다.
- 스타터가 만들어야 할 파일과, 숨기면 안 되는 키의 차이를 말합니다.

## auth.users와 프로필

Supabase Auth는 auth.users에 사용자를 둡니다.
가입이 그 행을 만듭니다.
앱이 임의의 uuid를 사용자 id로 지어 넣지 않습니다.

profiles.id는 auth.users.id를 참조합니다.
지우는 동작은 cascade입니다.
계정이 지워지면 프로필도 지워집니다.
표시 이름은 빈 문자열을 기본값으로 둡니다.
행이 생긴 시각은 created_at이고, timestamptz이며 기본값은 now()입니다.

study_notes.user_id도 auth.users.id를 참조합니다.
프로필 행이 없어도 노트 행의 주인은 계정입니다.
언어는 languages.id를 참조합니다.
본문은 빈 문자열을 거절합니다.
노트에도 created_at이 있고 기본값은 now()입니다.
user_id에 색인을 두어 자기 행을 찾는 조건을 돕습니다.

languages는 공통 목록입니다.
이름은 유일하고, summary에 짧은 설명을 둡니다.
설명 문장은 앞 장의 열 개 언어와 같습니다.
Python부터 Haskell까지 시드가 파일 아래쪽에 있습니다.
on conflict (name) do nothing이라 같은 파일을 다시 실행해도 이름이 중복되지 않습니다.

## RLS와 정책

세 표 모두 row level security를 켭니다.
정책이 없는 명령은, RLS를 우회하지 않는 역할에게 거절됩니다.
GRANT와 정책은 하는 일이 다릅니다.
GRANT는 그 역할이 표에 손을 대도 되는지를 엽니다.
정책은 그중에서 어떤 행인지를 고릅니다.
둘 중 하나만 있으면 의도와 다르게 막히거나, 너무 넓게 열립니다.

authenticated에 준 권한은 다음입니다.
프로필은 조회, 삽입, 수정입니다.
언어는 조회만입니다.
학습 노트는 조회, 삽입, 수정, 삭제입니다.
identity 열에 삽입하려면 시퀀스 사용 권한이 필요합니다.
그래서 public의 시퀀스에 usage와 select를 줍니다.
이 파일은 anon에 GRANT를 적지 않습니다.
프로젝트가 표를 만들 때 anon에 권한을 붙이는 경우가 있습니다.
그때도 anon용 정책이 없으면 기본은 거절입니다.

언어 정책은 하나이며 select입니다.
대상은 authenticated이고 using (true)입니다.
로그인한 사용자는 언어 행을 모두 읽습니다.
삽입 정책이 없으므로 사용자는 언어를 추가하지 못합니다.
시드는 마이그레이션 역할로 실행합니다.
그 역할은 RLS를 우회합니다.
FORCE ROW LEVEL SECURITY는 켜지 않았습니다.
켜면 같은 파일의 시드가 정책에 걸릴 수 있습니다.
API로 들어오는 authenticated는 우회하지 않습니다.

학습 노트의 조건은 auth.uid() = user_id입니다.
select, insert, update, delete에 각각 있습니다.
insert 정책은 using을 가질 수 없고 with check만 봅니다.
update는 using으로 기존 행을 고르고, with check로 바뀐 행을 검사합니다.
update에서 with check를 빼면 using이 그 검사까지 맡습니다.
이 파일은 빼지 않고 둘 다 적었습니다.
다른 user_id로 넣는 삽입과, 자기 행의 user_id를 다른 사람으로 바꾸는 수정이 거절됩니다.
select를 둔 이유는 방금 넣은 행을 클라이언트가 다시 읽게 하기 위해서입니다.
쓰기만 허용하면 기록은 들어가고 조회는 거절됩니다.

프로필은 자기 id만 조회, 삽입, 수정합니다.
삭제 정책은 없습니다.
계정 삭제는 auth.users에서 시작하고 프로필은 cascade로 따라갑니다.

auth.uid()는 요청의 사용자 uuid입니다.
로그인하지 않은 요청에는 이 값이 없습니다.
anon 키로 요청을 보내도, 사용자 JWT가 붙으면 역할은 authenticated가 됩니다.
anon 키라는 이름과 anon 역할은 같은 뜻이 아닙니다.

## 두 개의 키

`examples/supabase-starter/.env.example`에는 두 줄만 있습니다.

```text
SUPABASE_URL=https://example.supabase.co
SUPABASE_ANON_KEY=replace-me
```

둘 다 자리표시자입니다.
진짜 값을 이 저장소에 붙여 넣지 않습니다.

anon 키는 브라우저에 둘 수 있게 만든 공개 키입니다.
이 키만으로 RLS가 사라지지는 않습니다.
정책이 없으면 공개 키는 열린 표의 열쇠가 됩니다.
정책이 있으면 그 키로 보낸 요청도 행 단위로 거절됩니다.

서비스 롤은 RLS를 우회합니다.
서버에서만 씁니다.
예제 환경 파일에 변수로도 넣지 않았습니다.
SQL 주석에 키 값을 적지 않습니다.
나중에 브라우저 클라이언트를 만들면 anon 키만 넣고, 서비스 롤은 그 코드에 두지 않습니다.
이 장에는 클라이언트 파일이 없습니다.

## 스타터가 만들 것과 숨기면 안 되는 것

스타터가 만들어 줄 파일은 세 종류면 됩니다.
자리표시자만 있는 환경 예제, 사람이 읽을 수 있는 마이그레이션, 언어 열 개의 시드입니다.
이 장의 schema.sql이 마이그레이션과 시드를 한 파일에 두었습니다.
환경 예제는 따로 있습니다.

숨기면 안 되는 것도 분명합니다.
정책과 GRANT를 생성기 뒤에 두고 SQL을 보여 주지 않는 일입니다.
서비스 롤을 브라우저에 넣는 일입니다.
anon 키만 있으면 행이 안전하다고 말하는 일입니다.
마이그레이션 역할은 RLS를 우회하고, authenticated는 우회하지 않는다는 차이를 적지 않는 일입니다.

저장 버킷 이름은 snippet-files입니다.
스키마 파일 맨 위의 주석에만 있습니다.
비공개 버킷으로 두고, 객체 경로의 첫 폴더를 사용자 id로 맞춥니다.
이후 storage.objects 정책은 bucket_id가 snippet-files이고 첫 폴더가 auth.uid()와 같을 때만 허용하면 됩니다.
이 파일은 storage 스키마를 고치지 않습니다.
storage 마이그레이션 순서에 이 파일을 묶지 않기 위해서입니다.

## 예제

`examples/supabase-starter/schema.sql`의 학습 노트 정책입니다.
네 명령 모두 auth.uid()와 user_id를 비교합니다.

```sql
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
```

언어는 로그인 사용자 전원에게 조회만 열립니다.

```sql
create policy languages_select_all
  on public.languages
  for select
  to authenticated
  using (true);
```

프로필의 id는 auth.users를 가리킵니다.

```sql
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  created_at timestamptz not null default now()
);
```

## 연습

1. 언어 목록을 로그인 없이 읽을지 정합니다. 읽히게 하려면 anon용 select 정책과 GRANT가 둘 다 필요하다는 점을 글로 적습니다. 파일은 아직 authenticated만 유지해도 됩니다.
2. study_notes의 select 정책만 지운다고 가정하고, 삽입은 되는데 조회가 거절되는 이유를 세 줄로 적습니다.
3. .env.example에 서비스 롤 변수를 넣지 않는 이유를 적습니다. 우회한다는 점과 서버 밖에 두면 안 된다는 점을 포함합니다.

## 스스로 확인

### 1. profiles.id는 어떤 열을 참조합니까?

답: auth.users.id입니다. 계정을 지우면 프로필도 cascade로 지워집니다.

### 2. 로그인한 사용자는 언어 행을 수정할 수 있습니까?

답: 없습니다. languages에는 authenticated용 select 정책만 있고 using (true)입니다. 수정 정책과 수정 GRANT가 없습니다.

### 3. 학습 노트를 다른 user_id로 넣으면 어디서 막힙니까?

답: study_notes_insert_own의 with check입니다. 조건은 auth.uid() = user_id입니다. update도 같은 조건의 with check를 갖습니다.

### 4. anon 키를 브라우저에 두면 RLS가 꺼집니까?

답: 꺼지지 않습니다. anon 키는 공개 클라이언트 키이고, 사용자 JWT가 있으면 역할은 authenticated입니다. RLS를 우회하는 것은 서비스 롤이며 서버에만 둡니다.

### 5. snippet-files는 이 SQL이 만드는 버킷입니까?

답: 아닙니다. 버킷 이름과, 첫 폴더를 사용자 id로 두고 storage.objects에서 제한한다는 설계만 주석에 있습니다. 파일은 storage 스키마를 수정하지 않습니다.
