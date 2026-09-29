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

/// `year`는 `Copy`라서 대입 뒤에도 원래 이름을 쓸 수 있습니다.
pub fn copy_year(year: i32) -> (i32, i32) {
    let again = year;
    (year, again)
}

/// 더 긴 노트의 슬라이스를 돌려줍니다.
/// 반환된 참조는 `left`와 `right`가 둘 다 살아있는 동안만 유효합니다.
pub fn longer_note<'a>(left: &'a str, right: &'a str) -> &'a str {
    if left.chars().count() >= right.chars().count() {
        left
    } else {
        right
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn add_moves_the_name_in_and_keeps_a_clone() {
        let mut shelf = Shelf::new();
        let name = String::from("Rust");
        let kept = name.clone();
        shelf.add(name, "소유권은 값을 옮깁니다.").unwrap();
        assert_eq!(kept, "Rust");
        assert_eq!(
            shelf.find("Rust").unwrap().note(),
            "소유권은 값을 옮깁니다."
        );
    }

    #[test]
    fn copy_leaves_both_years_usable() {
        assert_eq!(copy_year(2015), (2015, 2015));
    }

    #[test]
    fn duplicate_and_blank_are_errors() {
        let mut shelf = Shelf::new();
        shelf.add("Rust", "첫 카드").unwrap();
        assert_eq!(
            shelf.add("Rust", "다시"),
            Err(ShelfError::Duplicate("Rust".into()))
        );
        assert_eq!(shelf.add("  ", "노트"), Err(ShelfError::EmptyName));
        assert_eq!(shelf.add("Go", "   "), Err(ShelfError::EmptyNote));
        assert_eq!(shelf.names().count(), 1);
    }

    #[test]
    fn update_borrows_mutably_and_reports_missing() {
        let mut shelf = Shelf::new();
        shelf.add("Elixir", "메시지로 상태를 바꿉니다.").unwrap();
        shelf
            .update_note("Elixir", "프로세스가 메시지를 받습니다.")
            .unwrap();
        assert_eq!(
            shelf.find("Elixir").unwrap().note(),
            "프로세스가 메시지를 받습니다."
        );
        assert_eq!(
            shelf.update_note("Haskell", "순수 함수"),
            Err(ShelfError::Missing("Haskell".into()))
        );
    }

    #[test]
    fn iterator_counts_scalar_values_not_bytes() {
        let mut shelf = Shelf::new();
        shelf.add("Rust", "가").unwrap();
        assert_eq!(shelf.total_note_chars(), 1);
        assert_eq!(longer_note("가", "가나"), "가나");
        let card = shelf.find("Rust").unwrap();
        assert_eq!(card.summary(), "Rust: 가");
    }
}
