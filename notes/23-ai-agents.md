---
title: "도구를 쓰는 에이전트 루프"
slug: ai-agents
order: 23
level: "중급"
minutes: 45
tags: [에이전트]
summary: "목표를 받은 뒤 로컬 도구의 결과를 관찰로 쌓고, 최종 답이나 네 걸음에서 멈춥니다."
---

# 도구를 쓰는 에이전트 루프

이 장은 samsepi0l이 도구를 쓰는 루프를 언어 공부용으로 정리한 노트입니다.
목표는 Rust와 Go를 비교하는 한 문장입니다.
모델 자리는 미리 적어 둔 순서를 재생하는 MockModel이 채웁니다.
도구는 이 파일 안의 lookup_language와 compare_languages뿐입니다.
네트워크도, 계정 키도, 다른 프로그램 호출도 없습니다.
루프가 하는 일은 고르고, 실행하고, 관찰을 붙이고, 멈추는 것입니다.

## 이 장을 끝내면

- 한 걸음이 도구 호출인지 최종 답인지 구분합니다.
- 도구 결과가 다음 선택의 관찰로 돌아가는 순서를 따라갑니다.
- 네 걸음 상한과 모르는 도구에서 예외가 나는 이유를 말합니다.

## 루프의 한 바퀴

입력은 목표 문자열입니다.
이번 스크립트의 목표는 compare Rust and Go입니다.

매 걸음마다 모델 자리가 행동을 하나 고릅니다.
행동의 type이 tool이면 name과 args로 함수를 실행합니다.
실행 결과는 관찰입니다.
관찰에는 걸음 번호, 도구 이름, 인자, 결과 문자열이 들어갑니다.
다음 걸음은 같은 목표와, 지금까지의 관찰 목록을 다시 받습니다.

type이 final이면 content를 최종 답으로 두고 루프를 끝냅니다.
최종 답도 한 걸음입니다.
도구만 세고 final을 공짜로 두면 상한의 의미가 흐려집니다.

MockModel은 목표와 관찰을 읽지 않습니다.
생성자에 넣은 목록을 앞에서부터 하나씩 돌려줍니다.
목록이 끝나면 빈 final을 돌려 루프가 멈추게 합니다.
진짜 모델을 붙일 자리는 choose입니다.
이 장은 그 함수를 네트워크로 바꾸지 않습니다.
순서가 고정되어야 테스트가 같은 답을 보기 때문입니다.

## 로컬 도구

도구는 두 개입니다.
둘 다 같은 카탈로그를 읽고, 같은 입력에 같은 문자열을 돌려줍니다.
난수도 없고 시계도 없습니다.

lookup_language(name)은 이름을 정규 이름으로 바꿉니다.
Rust, rust, 러스트는 모두 Rust입니다.
Go와 golang은 Go입니다.
카탈로그에 없으면 예외 대신 "없는 이름"이라는 문장을 돌려줍니다.
틀린 언어 이름은 관찰로 남길 데이터입니다.

compare_languages(a, b)는 lookup을 두 번 호출해 줄바꿈으로 잇습니다.
비교라고 해서 새 사실을 만들지 않습니다.
두 설명의 나열입니다.

카탈로그의 문장은 앞 장과 같습니다.
Rust는 소유권으로 메모리 안전을 돕습니다.
Go는 고루틴으로 가벼운 동시 실행을 표현합니다.
나머지 여덟 언어도 같은 파일에 있습니다.
Python, JavaScript, TypeScript, Kotlin, Elixir, Zig, Dart, Haskell입니다.

도구 이름이 TOOLS에 없으면 ValueError를 일으킵니다.
함수를 호출하기 전에 확인합니다.
모르는 이름은 데이터가 아니라 루프가 받을 수 없는 행동입니다.
인자 이름이 틀린 경우는 그 다음의 TypeError입니다.
스크립트는 맞는 인자만 넣습니다.

## 멈추는 조건

상한은 4입니다.
MAX_STEPS가 그 값이고, run_agent의 기본 인자도 4입니다.
final을 받으면 그 걸음에서 반환합니다.
네 번 안에 final이 없으면 final은 빈 문자열이고 stopped는 max_steps입니다.

이번 스크립트는 네 걸음을 모두 씁니다.

1. lookup_language에 Rust를 넣습니다.
2. lookup_language에 Go를 넣습니다.
3. compare_languages에 Rust와 Go를 넣습니다.
4. final로 두 이름이 모두 들어간 문장을 돌려줍니다.

다섯 번째 행동은 실행되지 않습니다.
모델 목록에 더 있어도 루프는 네 번째에서 final을 보고 끝납니다.
final을 빼고 도구만 다섯 번 넣으면 관찰은 네 개에서 멈추고 최종 답은 비어 있습니다.

`python3 agent.py`는 최종 답에 Rust와 Go가 모두 있으면 0으로 끝납니다.
하나라도 없으면 표준 오류에 이유를 적고 1을 반환합니다.
비교는 대소문자를 가리는 부분 문자열입니다.
rust만 있고 Rust가 없으면 실패입니다.

표준 라이브러리만 사용합니다.
파일은 `examples/ai-agents/agent.py` 하나입니다.

## 관찰을 남기는 이유

이번 MockModel은 관찰을 버려도 다음 행동이 정해져 있습니다.
그래도 루프는 관찰을 쌓습니다.
모델을 바꾸는 사람이 목표만 보고 도구를 고르면, 같은 호출을 반복하기 쉽습니다.
관찰은 이미 본 결과를 다음 선택에 넘기는 칸입니다.

관찰의 result는 도구가 돌려준 문자열 그대로입니다.
루프가 문장을 다듬지 않습니다.
다듬기는 final을 적는 쪽의 일입니다.
이번 final은 스크립트에 고정된 문장이고, 도구 출력을 이어 붙인 문장은 아닙니다.
고정해 둔 이유는 종료 조건을 이름 두 개로 분명하게 보기 위해서입니다.

## 예제

`examples/ai-agents/agent.py`의 루프입니다.
모르는 도구는 호출 전에 예외입니다.

```python
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
```

같은 파일의 main은 목표의 두 이름이 최종 답에 있는지로 종료 코드를 정합니다.

```python
    outcome = run_agent(goal, model)
    final = outcome["final"]
    if "Rust" not in final or "Go" not in final:
        print("최종 답에 목표의 언어 이름이 모두 없습니다.", file=sys.stderr)
        return 1
    print(final)
    return 0
```

실행은 `python3 examples/ai-agents/agent.py`입니다.
성공하면 Rust와 Go가 모두 들어 있는 문장을 출력하고 종료 코드는 0입니다.

## 연습

1. 스크립트에서 lookup 두 번을 빼고 compare 다음에 final만 남깁니다. 걸음 수는 줄어도 최종 답의 두 이름은 유지합니다.
2. final을 다섯 번째 행동으로 밀어 넣습니다. 네 걸음 상한 때문에 그 final이 실행되지 않고 프로세스가 0이 아님을 확인한 뒤 원상 복구합니다.
3. 도구 이름을 lookup_language가 아닌 값으로 바꿉니다. ValueError가 나는지 보고, 예외 메시지에 그 이름이 있는지 확인합니다.

## 스스로 확인

### 1. MockModel은 관찰을 읽고 다음 도구를 고릅니까?

답: 고르지 않습니다. 미리 넣은 행동을 순서대로 재생합니다. 루프는 그래도 목표와 관찰을 choose에 넘깁니다.

### 2. 최종 답은 상한 밖의 추가 걸음입니까?

답: 아닙니다. type이 final인 행동도 한 걸음입니다. 이번 스크립트에서는 네 번째 걸음이 최종 답입니다.

### 3. 카탈로그에 없는 언어 이름은 어떻게 됩니까?

답: lookup_language가 예외를 내지 않고, 없다는 문장을 결과로 돌려줍니다. 예외는 도구 이름 자체를 모를 때 납니다.

### 4. 상한을 넘기면 무엇을 돌려줍니까?

답: final은 빈 문자열이고 steps는 4이며 stopped는 max_steps입니다. 관찰은 네 개까지입니다.

### 5. 왜 종료 조건을 도구 성공이 아니라 최종 문장으로 봅니까?

답: 루프의 결과는 관찰 목록이 아니라 최종 답이기 때문입니다. 목표에 적힌 Rust와 Go가 그 문장에 없으면 1로 끝냅니다.
