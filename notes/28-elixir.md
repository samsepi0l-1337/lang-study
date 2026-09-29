---
title: "Elixir의 불변 데이터와 프로세스"
slug: elixir
order: 28
level: "중급"
minutes: 55
tags: [Elixir]
summary: "언어 선반을 불변 맵으로 갱신하고, 그 맵을 프로세스 하나의 상태로 옮겨 메시지를 순서대로 처리합니다."
---

# Elixir의 불변 데이터와 프로세스

이 장은 samsepi0l이 Elixir의 불변 데이터, 패턴 매칭, 프로세스, GenServer를 언어 선반으로 정리한 노트입니다. 맵을 그 자리에서 고치지 않습니다. 상태를 한곳에 모을 때는 프로세스 하나가 맵을 들고, 다른 프로세스는 메시지로 요청합니다.

예제는 `examples/elixir`의 Mix 프로젝트입니다. 의존 패키지는 없습니다.

```bash
cd examples/elixir
mix test
```

`mix test`는 `test/lang_shelf_test.exs`의 6개 테스트를 실행합니다.

## 이 장을 끝내면

- `put/3`이 받은 맵을 바꾸지 않고 새 맵을 돌려주는 이유를 테스트로 확인합니다.
- `{:ok, value}`와 `:error`를 함수 머리와 `case`로 갈라냅니다.
- GenServer 프로세스가 요청을 하나씩 처리하고, 실패 응답에서는 이전 상태를 유지한다는 점을 설명합니다.

## 데이터는 바꾸지 않고 새로 만든다

`LangShelf.new/0`은 빈 맵 `%{}`를 돌려줍니다. `put/3`은 그 맵에 키를 덮어 쓰지 않습니다. `Map.put/3`의 결과를 새 맵으로 반환하고, 인자로 받은 맵은 그대로입니다.

```elixir
def put(shelf, name, note) when is_binary(name) and is_binary(note) do
  name = String.trim(name)
  note = String.trim(note)

  cond do
    name == "" -> {:error, :empty_name}
    note == "" -> {:error, :empty_note}
    Map.has_key?(shelf, name) -> {:error, {:duplicate, name}}
    true -> {:ok, Map.put(shelf, name, note)}
  end
end
```

이름은 다시 바인딩됩니다. `name = String.trim(name)`은 기존 문자열을 수정하는 문장이 아닙니다. 같은 이름 `name`이 이제 잘린 문자열을 가리킵니다. 이전 문자열은 그대로 남아 있고, 더 이상 이 변수가 가리키지 않을 뿐입니다.

테스트는 이전 맵이 빈 맵인지 확인합니다.

```elixir
shelf = LangShelf.new()
assert {:ok, next} = LangShelf.put(shelf, "Rust", "소유권")
assert shelf == %{}
assert {:ok, "소유권"} = LangShelf.fetch(next, "Rust")
```

`:ok`, `:error`, `:empty_name`은 원자입니다. 원자와 값을 묶은 `{:ok, next}`는 튜플입니다. 성공과 실패를 예외로 섞지 않고 반환 값의 모양으로 구분합니다.

`when` 가드는 인자가 바이너리일 때만 이 함수 머리로 들어옵니다. Elixir의 사용자 문자열은 UTF-8 바이너리입니다.

## 패턴 매칭은 모양을 검사한다

`describe/2`는 `fetch/2`의 두 모양을 `case`로 나눕니다.

```elixir
def describe(shelf, name) do
  case fetch(shelf, name) do
    {:ok, note} -> {:known, name <> ": " <> note}
    :error -> {:unknown, name}
  end
end
```

왼쪽이 패턴이고 오른쪽이 값입니다. `{:ok, note}`는 두 칸짜리 튜플이며 첫 칸이 `:ok`인 경우만 맞고, 둘째 칸은 `note`에 묶입니다. `:error`는 원자 하나와 맞습니다. `Map.fetch/2`가 돌려주는 것도 이 두 모양입니다.

`catalog/1` 안의 `{:ok, note} = fetch(shelf, name)`은 다른 종류의 매칭입니다. 오른쪽이 `:error`이면 `MatchError`가 납니다. 여기서는 `Map.keys/1`로 얻은 이름만 조회하므로 키가 있습니다. 없을 수 있는 조회에는 `describe/2`처럼 `case`를 씁니다.

`<>`는 바이너리를 이어 붙입니다. 문자열 보간 `"#{name}"`과 같고, 이 예제는 이어 붙이기로 통일합니다.

## 파이프는 앞의 결과를 첫 인자로 넘긴다

`catalog/1`은 맵의 키를 정렬한 뒤 각 이름을 문장으로 바꿉니다.

```elixir
def catalog(shelf) do
  shelf
  |> Map.keys()
  |> Enum.sort()
  |> Enum.map(fn name ->
    {:ok, note} = fetch(shelf, name)
    name <> " :: " <> note
  end)
end
```

`|>`의 왼쪽 값이 오른쪽 함수의 첫 인자가 됩니다. `Map.keys(shelf)`와 `shelf |> Map.keys()`는 같습니다. 파이프는 평가 순서를 위에서 아래로 읽게 할 뿐, 맵을 수정하지 않습니다.

`String.length/1`은 그래핌 개수입니다. `"가나"`는 2입니다. `longer_note/2`는 그 길이로 더 긴 쪽의 바이너리 자체를 돌려줍니다. 새 문자열을 만들 필요가 없는 경우에는 인자 중 하나를 그대로 반환합니다.

## 프로세스는 상태와 우편함을 가진다

Elixir에서 상태를 공유 메모리에 두고 여러 실행 흐름이 동시에 고치지 않습니다. 프로세스 하나가 값을 소유하고, 다른 프로세스는 메시지를 보냅니다. 각 프로세스에는 우편함이 있고, 메시지는 그 우편함에 쌓인 순서대로 꺼냅니다.

`LangShelf.Ping.ask/1`은 GenServer 없이 그 구조만 보여 줍니다.

```elixir
def ask(parent) when is_pid(parent) do
  spawn(fn -> send(parent, {:ready, self()}) end)
end
```

`spawn/1`은 새 프로세스를 만들고 pid를 돌려줍니다. 그 프로세스 안에서의 `self/0`는 자식 pid입니다. `send/2`는 부모의 우편함에 `{:ready, 자식pid}`를 넣습니다. 테스트는 `assert_receive`로 그 메시지를 꺼냅니다.

```elixir
child = LangShelf.Ping.ask(self())
assert_receive {:ready, ^child}
```

`^child`는 이미 묶인 `child`와 같은 pid만 받습니다. 새 변수에 다시 묶지 않습니다.

이 프로세스는 메시지 하나를 보낸 뒤 함수가 끝나면 종료됩니다. 선반 데이터를 들고 있지 않습니다.

## GenServer는 호출을 한 프로세스에서 처리한다

`LangShelf.Server`는 맵을 프로세스 상태로 둡니다. `init/1`이 `{:ok, shelf}`를 돌려주면 그 맵이 상태가 됩니다.

클라이언트 함수는 `GenServer.call/2`로 요청을 보내고 응답을 기다립니다.

```elixir
def handle_call({:put, name, note}, _from, shelf) do
  case LangShelf.put(shelf, name, note) do
    {:ok, next} -> {:reply, :ok, next}
    {:error, reason} -> {:reply, {:error, reason}, shelf}
  end
end
```

`{:reply, 응답, 새상태}`의 세 번째 칸이 이 호출 이후의 상태입니다. 성공이면 `next`이고, 실패이면 인자로 받은 `shelf` 그대로입니다. 중복된 `"Rust"`를 다시 넣어도 프로세스 안의 노트는 `"소유권"`으로 남습니다. 테스트가 그 조회를 확인합니다.

호출은 이 프로세스의 우편함에서 하나씩 처리됩니다. 두 클라이언트가 동시에 `put`을 보내도, 맵을 갱신하는 코드는 한 프로세스 안에서 차례로 실행됩니다. 잠금 변수를 따로 두지 않습니다.

이 예제는 `start_link`로 프로세스를 직접 띄웁니다. 감독 트리가 죽인 프로세스를 다시 살리는 구성은 포함하지 않습니다. 프로세스와 메시지의 경계를 먼저 고정하기 위해서입니다.

`names`는 키를 정렬해 돌려줍니다. 맵의 키 순서를 결과의 순서로 쓰지 않습니다.

## 예제

순수 함수는 `lib/lang_shelf.ex`에 있습니다.

```elixir
defmodule LangShelf do
  def new, do: %{}

  def put(shelf, name, note) when is_binary(name) and is_binary(note) do
    name = String.trim(name)
    note = String.trim(note)

    cond do
      name == "" -> {:error, :empty_name}
      note == "" -> {:error, :empty_note}
      Map.has_key?(shelf, name) -> {:error, {:duplicate, name}}
      true -> {:ok, Map.put(shelf, name, note)}
    end
  end

  def fetch(shelf, name) when is_binary(name), do: Map.fetch(shelf, name)

  def describe(shelf, name) do
    case fetch(shelf, name) do
      {:ok, note} -> {:known, name <> ": " <> note}
      :error -> {:unknown, name}
    end
  end

  def catalog(shelf) do
    shelf
    |> Map.keys()
    |> Enum.sort()
    |> Enum.map(fn name ->
      {:ok, note} = fetch(shelf, name)
      name <> " :: " <> note
    end)
  end

  def longer_note(left, right) when is_binary(left) and is_binary(right) do
    if String.length(left) >= String.length(right), do: left, else: right
  end
end
```

파일에는 `@moduledoc`, `@type`, `@spec`이 더 있습니다. 실행되는 절은 위와 같습니다.

프로세스 경계는 `lib/lang_shelf/server.ex`와 `lib/lang_shelf/ping.ex`입니다. 서버의 `handle_call({:put, ...})`은 실패 시 세 번째 칸에 이전 `shelf`를 넣습니다.

## 연습

1. `LangShelf.delete/2`를 추가합니다. 키가 있으면 `{:ok, 새맵}`을, 없으면 `:error`를 돌려주고 인자 맵은 바꾸지 않습니다.
2. `LangShelf.Server`에 `GenServer.cast`로 노트를 지우는 `drop/2`를 추가합니다. cast는 응답을 기다리지 않으므로, 테스트는 cast 뒤에 `fetch`로 상태가 바뀌었는지 확인합니다.
3. `catalog/1`의 `{:ok, note} = fetch(...)`를 `describe/2`와 같은 `case`로 바꿉니다. 키가 항상 있는 이 함수에서도 `case`가 무엇을 드러내는지 비교합니다.

## 스스로 확인

`put/3` 이후에도 인자로 넘긴 맵이 빈 맵인 이유는 무엇입니까?

`Map.put/3`이 새 맵을 만들어 반환하고, 받은 맵의 내용은 바뀌지 않기 때문입니다. 변수 `shelf`는 계속 처음의 `%{}`를 가리킵니다.

`:ok`와 `{:ok, next}`는 어떻게 다릅니까?

`:ok`는 원자입니다. `{:ok, next}`는 첫 원소가 `:ok`인 튜플이고 둘째 원소에 값이 있습니다. 패턴이 다르면 다른 절로 들어갑니다.

`catalog/1`의 `{:ok, note} = fetch(...)`가 `:error`를 만나면 어떻게 됩니까?

매칭이 실패해 `MatchError`가 발생합니다. 없을 수 있는 결과에는 `case`로 `:error` 절을 둡니다.

`Ping.ask/1`이 돌려주는 pid와 메시지 안의 pid가 같은 이유는 무엇입니까?

`spawn/1`의 반환값과, 그 프로세스 안에서 호출한 `self/0`가 같은 프로세스를 가리키기 때문입니다. 부모는 `send`의 대상일 뿐 그 pid가 아닙니다.

중복 `put`이 GenServer에서 거절된 뒤 기존 노트가 남는 이유는 무엇입니까?

`handle_call`이 `{:reply, {:error, reason}, shelf}`를 반환해 상태 칸에 이전 맵을 다시 넣기 때문입니다. `{:ok, next}`일 때만 상태 맵이 바뀝니다.
