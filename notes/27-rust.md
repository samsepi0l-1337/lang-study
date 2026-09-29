---
title: "Rust의 소유권과 빌림"
slug: rust
order: 27
level: "중급"
minutes: 55
tags: [Rust]
summary: "언어 선반에 카드를 옮기고, 공유 참조와 가변 참조가 동시에 성립하지 않는 지점을 컴파일러로 확인합니다."
---

# Rust의 소유권과 빌림

이 장은 samsepi0l이 Rust의 소유권, 빌림, 열거형, 트레이트를 언어 선반으로 정리한 노트입니다. 선반이 카드의 문자열을 소유하고, 조회는 그 문자열을 빌려 옵니다. 화면 라이브러리나 비동기 런타임은 다루지 않습니다.

예제는 `examples/rust`입니다. 라이브러리는 `src/lib.rs`, 실행 파일은 `src/main.rs`입니다. 크레이트 이름은 `lang_shelf`입니다.

```bash
cd examples/rust
cargo test
cargo run
```

`cargo test`는 라이브러리 테스트를 실행합니다. `cargo run`은 Rust 카드와 Elixir 카드를 출력합니다.

## 이 장을 끝내면

- `String`을 함수에 넘긴 뒤 원래 변수를 쓸 수 없는 이유와, `clone`이 그 제한을 어떻게 우회하는지 설명합니다.
- 공유 참조 `&Card`를 들고 있는 동안 `update_note`가 컴파일되지 않는 이유를 말합니다.
- `Option`, `Result`, 트레이트, 반복자로 선반을 조회하고 글자 수를 셉니다.

## 값은 소유자가 하나다

Rust에서 값은 한 번에 소유자가 하나입니다. `String`은 `Copy`가 아닙니다. 다른 이름으로 대입하거나 함수 인자로 넘기면 소유권이 이동하고, 이전 이름은 더 이상 그 값을 가리키지 않습니다.

`Shelf::add`는 `impl Into<String>`을 받습니다. 문자열 리터럴은 `String`으로 바뀌어 들어가고, 이미 `String`인 값은 그대로 이동합니다. 선반이 그 문자열의 소유자가 됩니다.

이동 뒤에도 이름을 남기려면 넘기기 전에 `clone`합니다. 복제본은 다른 할당입니다.

```rust
let name = String::from("Rust");
let kept = name.clone();
shelf.add(name, "소유권은 값을 옮깁니다.").unwrap();
assert_eq!(kept, "Rust");
```

`i32`는 `Copy`입니다. 대입은 이동이 아니라 비트 복사입니다. `copy_year`는 인자와 복사본을 둘 다 돌려줍니다.

```rust
pub fn copy_year(year: i32) -> (i32, i32) {
    let again = year;
    (year, again)
}
```

`String`에 같은 대입을 하면 첫 이름은 사용할 수 없습니다. 컴파일러가 이동을 거절하는 것이지, 실행 중에 가끔 실패하는 검사가 아닙니다.

## 빌림은 소유권을 넘기지 않는다

`find`는 카드를 꺼내 주지 않습니다. `Option<&Card>`를 돌려줍니다. `&`는 공유 참조입니다. 선반이 소유권을 유지하고, 호출자는 그 카드를 읽는 동안만 빌립니다.

```rust
pub fn find(&self, name: &str) -> Option<&Card> {
    self.cards.iter().find(|card| card.name == name)
}
```

`&self`는 이 메서드가 선반을 바꾸지 않는다는 표시입니다. `update_note`는 `&mut self`입니다. 노트를 교체하려면 그 시점의 가변 참조가 하나뿐이어야 합니다.

아래는 컴파일되지 않는 예입니다. 파일에는 없습니다.

```rust
let card = shelf.find("Rust").unwrap();
shelf.update_note("Rust", "다른 노트").unwrap();
println!("{}", card.note());
```

`card`가 `shelf`를 공유 참조로 빌린 채 `update_note`가 가변 참조를 요구합니다. 같은 값에 공유 참조와 가변 참조를 겹치면, 읽는 도중에 다른 코드가 그 메모리를 바꿀 수 있습니다. Rust는 그 겹침을 컴파일 단계에서 거절합니다.

공유 참조끼리는 겹칠 수 있습니다. `main`은 `names()`가 빌려 온 이름으로 `find`를 다시 호출합니다. 둘 다 `&self`만 필요하므로 컴파일됩니다. 루프 안에서 `update_note`를 호출하면 위의 예와 같이 거절됩니다.

`Option`은 값이 있을 수도, 없을 수도 있음을 타입으로 말합니다. 없는 이름에 `unwrap`을 호출하면 그 자리에서 패닉합니다. 라이브러리 메서드는 실패를 `Result`로 돌려주고, `unwrap`은 테스트와 실행 파일의 성공 경로에만 둡니다.

## 실패는 열거형이다

`ShelfError`는 빈 이름, 빈 노트, 중복, 없는 카드를 구분합니다. 중복과 없음은 문제의 이름을 `String`으로 가집니다. 그 문자열은 에러 값이 소유합니다.

```rust
pub enum ShelfError {
    EmptyName,
    EmptyNote,
    Duplicate(String),
    Missing(String),
}
```

`add`는 공백을 잘라 저장합니다. 잘낸 결과가 빈 문자열이면 `Err`를 돌려주고 선반에는 넣지 않습니다. 이미 같은 이름이 있으면 `Duplicate`이고, 이때도 `push`하지 않습니다. 성공은 `Ok(())`입니다. 카드 자체는 선반 안에 남고, 호출자에게 참조를 돌려주지 않습니다. 반환 참조의 수명을 이 장의 범위 밖으로 밀지 않기 위해서입니다.

`()`는 성공했다는 사실 외에 돌려줄 데이터가 없다는 뜻입니다.

## 트레이트는 공통 행동의 이름이다

`Summary`는 `summary(&self) -> String`을 요구합니다. `Card`가 그 트레이트를 구현하면, `summary`를 요구하는 자리에는 `Summary`를 구현한 다른 타입도 나중에 넣을 수 있습니다. 이 예제는 `Card`만 구현합니다.

반환은 새 `String`입니다. 참조를 돌려주면 카드의 수명에 묶이므로, 소유된 문장을 만들어 호출자가 그 문장을 갖게 합니다.

## 반복자와 글자 수

`names`는 선반을 복사하지 않습니다. 각 이름의 `&str`을 만드는 반복자를 돌려줍니다.

```rust
pub fn names(&self) -> impl Iterator<Item = &str> {
    self.cards.iter().map(|card| card.name.as_str())
}
```

`impl Iterator`는 구체 타입 이름을 숨기고, 반복할 수 있다는 약속만 드러냅니다. `Item = &str`의 참조는 `&self`가 살아있는 동안만 유효합니다.

`total_note_chars`는 `chars().count()`로 셉니다. `String::len`은 바이트 수입니다. `"가".len()`은 3이고, `chars().count()`는 1입니다. 한국어 노트를 바이트로 세면 글자 수와 어긋납니다.

```rust
pub fn total_note_chars(&self) -> usize {
    self.cards
        .iter()
        .map(|card| card.note.chars().count())
        .sum()
}
```

## 수명은 참조가 유효한 구간이다

`longer_note`의 두 인자와 반환은 같은 수명 `'a`를 공유합니다. 반환된 `&str`은 둘 중 더 긴 쪽을 가리키고, 그 원본이 스코프를 벗어나면 함께 무효가 됩니다.

```rust
pub fn longer_note<'a>(left: &'a str, right: &'a str) -> &'a str {
    if left.chars().count() >= right.chars().count() {
        left
    } else {
        right
    }
}
```

함수 안에서 만든 `String`의 참조를 반환하는 코드는 컴파일되지 않습니다. 그 `String`은 함수가 끝나면 해제되는데, 반환된 참조가 해제된 메모리를 가리키게 되기 때문입니다.

```rust
fn owned_note() -> &str {
    let owned = String::from("Rust");
    &owned
}
```

이 함수는 `lib.rs`에 없습니다. 돌려주려면 `String` 자체를 반환해 호출자가 소유하게 합니다.

## 예제

라이브러리의 공개 API는 다음입니다. 테스트는 같은 파일 아래 `tests` 모듈에 있습니다.

```rust
//! 언어 선반. 카드의 이름과 노트는 선반이 소유합니다.

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Card {
    name: String,
    note: String,
}

impl Card {
    pub fn name(&self) -> &str {
        &self.name
    }

    pub fn note(&self) -> &str {
        &self.note
    }
}

pub trait Summary {
    fn summary(&self) -> String;
}

impl Summary for Card {
    fn summary(&self) -> String {
        format!("{}: {}", self.name, self.note)
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ShelfError {
    EmptyName,
    EmptyNote,
    Duplicate(String),
    Missing(String),
}

#[derive(Debug, Default)]
pub struct Shelf {
    cards: Vec<Card>,
}

impl Shelf {
    pub fn new() -> Self {
        Self { cards: Vec::new() }
    }

    pub fn add(
        &mut self,
        name: impl Into<String>,
        note: impl Into<String>,
    ) -> Result<(), ShelfError> {
        let name = name.into();
        let note = note.into();
        let name = name.trim().to_string();
        let note = note.trim().to_string();
        if name.is_empty() {
            return Err(ShelfError::EmptyName);
        }
        if note.is_empty() {
            return Err(ShelfError::EmptyNote);
        }
        if self.cards.iter().any(|card| card.name == name) {
            return Err(ShelfError::Duplicate(name));
        }
        self.cards.push(Card { name, note });
        Ok(())
    }

    pub fn find(&self, name: &str) -> Option<&Card> {
        self.cards.iter().find(|card| card.name == name)
    }

    pub fn update_note(&mut self, name: &str, note: impl Into<String>) -> Result<(), ShelfError> {
        let note = note.into();
        let note = note.trim().to_string();
        if note.is_empty() {
            return Err(ShelfError::EmptyNote);
        }
        match self.cards.iter_mut().find(|card| card.name == name) {
            Some(card) => {
                card.note = note;
                Ok(())
            }
            None => Err(ShelfError::Missing(name.to_string())),
        }
    }

    pub fn names(&self) -> impl Iterator<Item = &str> {
        self.cards.iter().map(|card| card.name.as_str())
    }

    pub fn total_note_chars(&self) -> usize {
        self.cards
            .iter()
            .map(|card| card.note.chars().count())
            .sum()
    }
}

pub fn copy_year(year: i32) -> (i32, i32) {
    let again = year;
    (year, again)
}

pub fn longer_note<'a>(left: &'a str, right: &'a str) -> &'a str {
    if left.chars().count() >= right.chars().count() {
        left
    } else {
        right
    }
}
```

파일의 `copy_year`와 `longer_note` 위에는 문서 주석이 있습니다. 동작은 위 코드와 같습니다.

실행 파일은 라이브러리를 호출만 합니다.

```rust
use lang_shelf::Shelf;

fn main() {
    let mut shelf = Shelf::new();
    shelf
        .add("Rust", "소유권은 값을 한 변수에게 옮깁니다.")
        .expect("Rust 카드");
    shelf
        .add(
            "Elixir",
            "데이터는 그대로 두고 프로세스가 메시지를 받습니다.",
        )
        .expect("Elixir 카드");

    for name in shelf.names() {
        let card = shelf.find(name).expect("방금 만든 이름");
        println!("{}: {}", card.name(), card.note());
    }
    println!("노트 글자 수: {}", shelf.total_note_chars());
}
```

## 연습

1. `remove(&mut self, name: &str) -> Result<Card, ShelfError>`를 추가합니다. 찾은 카드는 `Vec`에서 빼내 소유권을 호출자에게 넘기고, 없으면 `Missing`을 돌려줍니다.
2. `find`로 받은 `&Card`를 변수에 저장한 뒤 `update_note`를 호출하는 코드를 작성해, 컴파일러 메시지가 어떤 빌림이 겹친다고 말하는지 확인합니다.
3. `total_note_chars`를 `len()`으로 바꾸고 `"가"` 한 글자 카드의 결과가 1에서 3이 되는지 테스트를 실행합니다. 확인 뒤에는 `chars().count()`로 되돌립니다.

## 스스로 확인

`String`을 `add`에 넘기면 왜 원래 변수를 바로 출력할 수 없습니까?

소유권이 선반으로 이동했기 때문입니다. `String`은 `Copy`가 아닙니다. 남기려면 넘기기 전에 `clone`합니다.

`find`의 반환이 `Card`가 아니라 `Option<&Card>`인 이유는 무엇입니까?

카드의 소유권은 선반에 남기고, 호출자에게는 읽기 위한 빌림만 주기 위해서입니다. 없으면 `None`입니다.

공유 참조를 들고 `update_note`를 호출하면 언제 실패합니까?

컴파일할 때 실패합니다. 공유 참조와 가변 참조가 겹치기 때문입니다.

`"가".len()`과 `"가".chars().count()`는 왜 다릅니까?

`len`은 UTF-8 바이트 수고, `chars().count()`는 유니코드 스칼라 값의 개수입니다. 이 글자는 바이트 3개, 스칼라 값 1개입니다.

`longer_note`의 반환 참조를 지역 `String`에 묶으면 왜 안 됩니까?

그 `String`은 함수가 끝나면 사라집니다. `'a`는 호출자가 넘겨 준 두 슬라이스가 살아있는 구간만 가리킬 수 있습니다.
