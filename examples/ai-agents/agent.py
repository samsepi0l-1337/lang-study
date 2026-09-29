"""로컬 도구만 쓰는 학습용 에이전트 루프입니다. 네트워크는 사용하지 않습니다."""

from __future__ import annotations

import sys

MAX_STEPS = 4

CATALOG = {
    "Python": "Python은 들여쓰기로 블록을 나타내고, 동적 타입으로 값을 다룹니다.",
    "JavaScript": "JavaScript는 이벤트 루프 위에서 비동기 작업을 이어 갑니다.",
    "Go": "Go는 고루틴으로 가벼운 동시 실행을 표현합니다.",
    "Rust": "Rust는 소유권으로 메모리 안전을 돕습니다.",
    "TypeScript": "TypeScript의 타입은 컴파일되면 JavaScript로 지워집니다.",
    "Kotlin": "Kotlin은 널 가능 여부를 타입으로 구분합니다.",
    "Elixir": "Elixir는 BEAM의 가벼운 프로세스로 상태를 격리합니다.",
    "Zig": "Zig는 메모리 할당자를 호출하는 쪽에서 넘깁니다.",
    "Dart": "Dart는 사운드 널 안전성을 타입 시스템에 둡니다.",
    "Haskell": "Haskell은 순수 함수와 지연 평가를 기본으로 합니다.",
}

ALIASES = {name.lower(): name for name in CATALOG}
ALIASES.update(
    {
        "파이썬": "Python",
        "자바스크립트": "JavaScript",
        "js": "JavaScript",
        "golang": "Go",
        "러스트": "Rust",
        "타입스크립트": "TypeScript",
        "코틀린": "Kotlin",
        "엘릭서": "Elixir",
        "지그": "Zig",
        "다트": "Dart",
        "하스켈": "Haskell",
    }
)


def resolve(name: str) -> str:
    key = ALIASES.get(name.strip().lower())
    if key is None:
        raise KeyError(name)
    return key


def lookup_language(name: str) -> str:
    try:
        canonical = resolve(name)
    except KeyError:
        return f"카탈로그에 없는 이름입니다: {name}"
    return f"{canonical}: {CATALOG[canonical]}"


def compare_languages(a: str, b: str) -> str:
    return "\n".join((lookup_language(a), lookup_language(b)))


TOOLS = {
    "lookup_language": lookup_language,
    "compare_languages": compare_languages,
}


class MockModel:
    """관찰을 읽지 않고, 정해 둔 행동을 순서대로 돌려줍니다."""

    def __init__(self, actions: list[dict]) -> None:
        self.actions = list(actions)
        self.index = 0

    def choose(self, goal: str, observations: list[dict]) -> dict:
        _ = (goal, observations)
        if self.index >= len(self.actions):
            return {"type": "final", "content": ""}
        action = self.actions[self.index]
        self.index += 1
        return action


def run_agent(goal: str, model: MockModel, max_steps: int = MAX_STEPS) -> dict:
    observations: list[dict] = []
    for step in range(1, max_steps + 1):
        action = model.choose(goal, observations)
        kind = action.get("type")
        if kind == "final":
            return {
                "final": str(action.get("content", "")),
                "steps": step,
                "observations": observations,
            }
        if kind != "tool":
            raise ValueError(f"알 수 없는 행동입니다: {kind}")
        tool_name = action.get("name")
        if tool_name not in TOOLS:
            raise ValueError(f"알 수 없는 도구입니다: {tool_name}")
        args = action.get("args") or {}
        result = TOOLS[tool_name](**args)
        observations.append(
            {
                "step": step,
                "tool": tool_name,
                "args": args,
                "result": result,
            }
        )
    return {
        "final": "",
        "steps": max_steps,
        "observations": observations,
        "stopped": "max_steps",
    }


def main() -> int:
    goal = "compare Rust and Go"
    model = MockModel(
        [
            {"type": "tool", "name": "lookup_language", "args": {"name": "Rust"}},
            {"type": "tool", "name": "lookup_language", "args": {"name": "Go"}},
            {
                "type": "tool",
                "name": "compare_languages",
                "args": {"a": "Rust", "b": "Go"},
            },
            {
                "type": "final",
                "content": (
                    "Rust는 소유권으로 메모리 안전을 돕고, "
                    "Go는 고루틴으로 동시 실행을 표현합니다. "
                    "비교 대상은 Rust와 Go입니다."
                ),
            },
        ]
    )
    outcome = run_agent(goal, model)
    final = outcome["final"]
    if "Rust" not in final or "Go" not in final:
        print("최종 답에 목표의 언어 이름이 모두 없습니다.", file=sys.stderr)
        return 1
    print(final)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
