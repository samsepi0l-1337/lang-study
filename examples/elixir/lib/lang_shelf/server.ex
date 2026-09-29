defmodule LangShelf.Server do
  @moduledoc """
  선반 맵을 프로세스 상태에 두고, 호출은 그 프로세스가 하나씩 처리합니다.
  """

  use GenServer

  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, LangShelf.new(), opts)
  end

  def put(pid, name, note) when is_pid(pid) do
    GenServer.call(pid, {:put, name, note})
  end

  def fetch(pid, name) when is_pid(pid) do
    GenServer.call(pid, {:fetch, name})
  end

  def names(pid) when is_pid(pid) do
    GenServer.call(pid, :names)
  end

  @impl true
  def init(shelf), do: {:ok, shelf}

  @impl true
  def handle_call({:put, name, note}, _from, shelf) do
    case LangShelf.put(shelf, name, note) do
      {:ok, next} -> {:reply, :ok, next}
      {:error, reason} -> {:reply, {:error, reason}, shelf}
    end
  end

  @impl true
  def handle_call({:fetch, name}, _from, shelf) do
    {:reply, LangShelf.fetch(shelf, name), shelf}
  end

  @impl true
  def handle_call(:names, _from, shelf) do
    names = shelf |> Map.keys() |> Enum.sort()
    {:reply, names, shelf}
  end
end
