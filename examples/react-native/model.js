export function createDeck() {
  return [
    {
      id: "dart",
      name: "Dart",
      summary: "널 안전과 Future를 갖춘 언어",
      streak: 0,
    },
    {
      id: "rust",
      name: "Rust",
      summary: "소유권으로 메모리를 다루는 언어",
      streak: 0,
    },
    {
      id: "haskell",
      name: "Haskell",
      summary: "순수 함수와 타입으로 짜는 언어",
      streak: 0,
    },
  ];
}

export function review(card, grade) {
  if (grade === "again") {
    return { ...card, streak: 0 };
  }
  if (grade === "good") {
    return { ...card, streak: card.streak + 1 };
  }
  throw new Error(`unknown grade: ${grade}`);
}
