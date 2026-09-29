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
