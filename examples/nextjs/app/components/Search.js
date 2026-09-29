"use client";

import { useState } from "react";
import Link from "next/link";

export default function Search({ languages }) {
  const [keyword, setKeyword] = useState("");
  const query = keyword.trim().toLowerCase();
  const visible = languages.filter((language) => {
    const haystack = `${language.name} ${language.slug} ${language.paradigm}`.toLowerCase();
    return query === "" || haystack.includes(query);
  });

  return (
    <section>
      <label htmlFor="language-search">언어 검색</label>
      <input
        id="language-search"
        value={keyword}
        onChange={(event) => setKeyword(event.target.value)}
        placeholder="이름, 슬러그, 패러다임"
      />
      <ul>
        {visible.map((language) => (
          <li key={language.slug}>
            <Link href={`/languages/${language.slug}`}>{language.name}</Link>
            {" · "}
            {language.paradigm}
            {" · "}
            {language.year}
          </li>
        ))}
      </ul>
      {visible.length === 0 ? <p>일치하는 언어가 없습니다.</p> : null}
    </section>
  );
}
