defmodule LangShelfTest do
  use ExUnit.Case, async: true

  test "put returns a new map and leaves the previous one unchanged" do
    shelf = LangShelf.new()
    assert {:ok, next} = LangShelf.put(shelf, "Rust", "소유권")
    assert shelf == %{}
    assert {:ok, "소유권"} = LangShelf.fetch(next, "Rust")
  end

  test "pattern matching separates known and unknown cards" do
    {:ok, shelf} = LangShelf.put(LangShelf.new(), "Elixir", "프로세스")
    assert {:known, "Elixir: 프로세스"} = LangShelf.describe(shelf, "Elixir")
    assert {:unknown, "Haskell"} = LangShelf.describe(shelf, "Haskell")
  end

  test "catalog sorts names and blank input is rejected" do
    {:ok, shelf} = LangShelf.put(LangShelf.new(), "Rust", "이동")
    {:ok, shelf} = LangShelf.put(shelf, "Elixir", "메시지")
    assert LangShelf.catalog(shelf) == ["Elixir :: 메시지", "Rust :: 이동"]
    assert {:error, :empty_name} = LangShelf.put(shelf, "  ", "노트")
    assert {:error, :empty_note} = LangShelf.put(shelf, "Go", "  ")
    assert {:error, {:duplicate, "Rust"}} = LangShelf.put(shelf, "Rust", "다시")
  end

  test "longer note uses grapheme length" do
    assert LangShelf.longer_note("가", "가나") == "가나"
  end

  test "server keeps state in one process" do
    {:ok, pid} = LangShelf.Server.start_link()
    assert :ok = LangShelf.Server.put(pid, "Rust", "소유권")
    assert :ok = LangShelf.Server.put(pid, "Elixir", "메시지")
    assert {:error, {:duplicate, "Rust"}} = LangShelf.Server.put(pid, "Rust", "다시")
    assert {:ok, "소유권"} = LangShelf.Server.fetch(pid, "Rust")
    assert {:ok, "메시지"} = LangShelf.Server.fetch(pid, "Elixir")
    assert LangShelf.Server.names(pid) == ["Elixir", "Rust"]
  end

  test "a spawned process sends its pid back" do
    child = LangShelf.Ping.ask(self())
    assert_receive {:ready, ^child}
  end
end
