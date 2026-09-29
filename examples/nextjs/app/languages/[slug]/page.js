import Link from "next/link";
import { getLanguage, languages } from "../data";

export function generateStaticParams() {
  return languages.map((language) => ({ slug: language.slug }));
}

export default function LanguagePage({ params }) {
  const language = getLanguage(params.slug);

  if (!language) {
    return (
      <main>
        <h1>없는 문서</h1>
        <p>요청한 슬러그에 해당하는 언어가 없습니다.</p>
        <Link href="/">목록으로</Link>
      </main>
    );
  }

  return (
    <main>
      <p>
        <Link href="/">목록</Link>
      </p>
      <h1>{language.name}</h1>
      <p>{language.summary}</p>
      <dl>
        <dt>슬러그</dt>
        <dd>{language.slug}</dd>
        <dt>패러다임</dt>
        <dd>{language.paradigm}</dd>
        <dt>공개 연도</dt>
        <dd>{language.year}</dd>
      </dl>
    </main>
  );
}
