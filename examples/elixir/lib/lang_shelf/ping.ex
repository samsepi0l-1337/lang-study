defmodule LangShelf.Ping do
  @moduledoc """
  GenServer 없이 프로세스 하나와 메시지 하나를 보는 예입니다.
  """

  @spec ask(pid()) :: pid()
  def ask(parent) when is_pid(parent) do
    spawn(fn -> send(parent, {:ready, self()}) end)
  end
end
