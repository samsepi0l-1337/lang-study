defmodule LangShelf do
  @moduledoc """
  불변 맵으로 된 언어 선반입니다.
  `put/3`은 받은 맵을 바꾸지 않고 새 맵을 돌려줍니다.
  """

  @type shelf :: %{optional(String.t()) => String.t()}

  @spec new() :: shelf()
  def new, do: %{}

  @spec put(shelf(), String.t(), String.t()) ::
          {:ok, shelf()} | {:error, :empty_name | :empty_note | {:duplicate, String.t()}}
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

  @spec fetch(shelf(), String.t()) :: {:ok, String.t()} | :error
  def fetch(shelf, name) when is_binary(name), do: Map.fetch(shelf, name)

  @spec describe(shelf(), String.t()) :: {:known, String.t()} | {:unknown, String.t()}
  def describe(shelf, name) do
    case fetch(shelf, name) do
      {:ok, note} -> {:known, name <> ": " <> note}
      :error -> {:unknown, name}
    end
  end

  @spec catalog(shelf()) :: [String.t()]
  def catalog(shelf) do
    shelf
    |> Map.keys()
    |> Enum.sort()
    |> Enum.map(fn name ->
      {:ok, note} = fetch(shelf, name)
      name <> " :: " <> note
    end)
  end

  @spec longer_note(String.t(), String.t()) :: String.t()
  def longer_note(left, right) when is_binary(left) and is_binary(right) do
    if String.length(left) >= String.length(right), do: left, else: right
  end
end
