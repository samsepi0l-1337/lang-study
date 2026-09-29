---
title: "Next.js로 언어 문서 사이트"
slug: nextjs
order: 10
level: "중급"
minutes: 40
tags: [Next.js]
summary: "App Router의 파일 경로로 언어 문서 목록과 상세를 나누고, 검색만 클라이언트 상태로 둡니다."
---

# Next.js로 언어 문서 사이트

이 노트는 samsepi0l이 Next.js App Router로 언어 문서 사이트의 경로를 정리한 것입니다. 주소는 라우트 표가 아니라 `app` 디렉터리의 파일이 만듭니다. 목록은 `/`이고 상세는 `/languages/python` 같은 경로입니다. 데이터는 모듈 안의 배열이며 네트워크 요청은 하지 않습니다. 의존성은 `next` 14.2.35, `react` 18.3.1, `react-dom` 18.3.1입니다.

## 이 장을 끝내면

- `page.js`와 `layout.js`가 경로가 되는 방식과, `data.js`가 경로가 아닌 이유를 구분합니다.
- 서버 컴포넌트와 `"use client"`의 경계를 설명하고, 함수 대신 평범한 배열만 넘깁니다.
- `next/link`의 `Link`로 목록과 상세를 연결합니다.

## 파일 경로가 주소입니다

`app/layout.js`는 모든 페이지를 감쌉니다. `<html>`과 `<body>`는 루트 레이아웃에 둡니다. `metadata`는 문서 제목과 설명입니다. `app/page.js`는 `/`입니다. 서버에서 언어 배열의 길이를 문장으로 만듭니다.

`app/languages/[slug]/page.js`는 `/languages/python`처럼 슬러그마다 한 페이지입니다. 폴더 이름 `[slug]`가 동적 조각입니다. Next.js 14에서 페이지 인자는 `{ params }` 동기 객체이고 `params.slug`는 문자열입니다. 이 프로젝트는 next 14에 고정하므로 params를 Promise로 받지 않습니다. Next.js 15의 비동기 params와 섞지 않습니다.

`generateStaticParams`는 빌드 때 열 개 슬러그를 알려 줍니다. 없는 슬러그는 이 예제에서 안내 문단을 그립니다. 상태 코드를 404로 바꾸려면 `next/navigation`의 `notFound`를 쓰는데, 그 호출은 넣지 않았습니다. `app/languages/data.js`와 `app/components/Search.js`는 `page.js`가 아니므로 주소가 되지 않습니다. `getLanguage(slug)`는 찾으면 언어를, 없으면 `null`을 반환합니다.

`year`는 이 노트가 고정한 최초 공개 연도입니다. 패러다임은 화면용 한글 표기입니다.

## 서버가 그리고, 검색만 브라우저 상태입니다

기본은 서버 컴포넌트입니다. `layout.js`, `page.js`, `[slug]/page.js`에는 `"use client"`가 없습니다. 이 페이지들은 서버에서 렌더합니다. `data.js`는 컴포넌트가 아니라 언어 배열과 `getLanguage`를 내보내는 모듈입니다. 네트워크 `fetch`는 쓰지 않습니다.

상태와 입력 이벤트는 클라이언트 컴포넌트에만 둡니다. `Search.js` 첫 줄의 `"use client"`가 경계입니다. 지시문 앞에 import를 두지 않습니다. 이 파일이 가져오는 `useState`와 `Link`는 브라우저 번들에 포함됩니다.

서버 컴포넌트는 클라이언트 컴포넌트를 import할 수 있습니다. `app/page.js`가 `Search`에 `languages`를 넘깁니다. 그 값은 평범한 객체 배열이라 직렬화됩니다. `getLanguage` 같은 함수는 직렬화되지 않으므로 넘기지 않습니다. 검색어는 `useState`에만 있습니다. 이 입력 밖으로 공유할 필요가 없기 때문입니다. 빈 검색은 열 개를 모두 보여주고, 글자가 있으면 이름, 슬러그, 패러다임을 소문자로 비교합니다.

## Link는 앱 안의 경로로 이동합니다

`<a href>`는 브라우저가 문서를 통째로 다시 요청합니다. `Link`는 이 Next 앱 안의 경로로 전환합니다. 목록 항목의 href는 `/languages/` 뒤에 슬러그를 붙입니다. 상세의 목록 링크와 헤더 제목은 `href="/"`입니다. 헤더의 `Link`는 서버 컴포넌트인 레이아웃에 두었습니다. `Link`는 클라이언트 전용 API가 아닙니다.

## 예제

`examples/nextjs`에서 `npm install`을 한 뒤 `npm run dev`로 개발 서버를 띄웁니다. `npm run build`와 `npm start`가 있고, 빌드는 `generateStaticParams`의 열 개 슬러그를 정적 페이지로 만듭니다.

`examples/nextjs/package.json`

```json
{
  "name": "language-docs",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "14.2.35",
    "react": "18.3.1",
    "react-dom": "18.3.1"
  }
}
```

`examples/nextjs/next.config.js`

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

module.exports = nextConfig;
```

`examples/nextjs/app/layout.js`

```javascript
import Link from "next/link";

export const metadata = {
  title: "언어 문서",
  description: "열 가지 프로그래밍 언어의 패러다임과 공개 연도",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>
        <header>
          <Link href="/">언어 문서</Link>
        </header>
        {children}
      </body>
    </html>
  );
}
```

`examples/nextjs/app/page.js`

```javascript
import Search from "./components/Search";
import { languages } from "./languages/data";

export default function HomePage() {
  return (
    <main>
      <h1>언어 문서</h1>
      <p>
        등록된 언어는 {languages.length}개입니다. 검색은 브라우저 상태에서 이름, 슬러그,
        패러다임을 거릅니다.
      </p>
      <Search languages={languages} />
    </main>
  );
}
```

`examples/nextjs/app/languages/data.js`

```javascript
export const languages = [
  { slug: "python", name: "Python", year: 1991, paradigm: "다중 패러다임", summary: "들여쓰기로 블록을 나누고, 동적 타입으로 스크립트와 데이터 처리를 작성합니다." },
  { slug: "javascript", name: "JavaScript", year: 1995, paradigm: "다중 패러다임", summary: "브라우저와 서버 런타임에서 이벤트 루프와 비동기 호출을 다룹니다." },
  { slug: "go", name: "Go", year: 2009, paradigm: "명령형", summary: "고루틴과 채널로 동시성을 표현하고, 문법은 작게 유지합니다." },
  { slug: "rust", name: "Rust", year: 2010, paradigm: "다중 패러다임", summary: "소유권과 빌림으로 메모리 안전을 컴파일 시점에 검사합니다." },
  { slug: "typescript", name: "TypeScript", year: 2012, paradigm: "다중 패러다임", summary: "JavaScript에 정적 타입을 얹고, 기존 파일부터 점진적으로 도입합니다." },
  { slug: "kotlin", name: "Kotlin", year: 2011, paradigm: "객체지향", summary: "널 가능 타입을 타입 시스템에서 구분하고 JVM 바이트코드로 컴파일합니다." },
  { slug: "elixir", name: "Elixir", year: 2011, paradigm: "함수형", summary: "BEAM 프로세스와 패턴 매칭으로 동시성과 분기를 작성합니다." },
  { slug: "zig", name: "Zig", year: 2016, paradigm: "명령형", summary: "호출자가 넘긴 할당자를 쓰고, comptime으로 컴파일 시점 코드를 실행합니다." },
  { slug: "dart", name: "Dart", year: 2011, paradigm: "객체지향", summary: "널 안전과 AOT 컴파일로 클라이언트 UI를 작성합니다." },
  { slug: "haskell", name: "Haskell", year: 1990, paradigm: "함수형", summary: "순수 함수가 기본이고, 효과는 타입으로 구분합니다." },
];

export function getLanguage(slug) {
  return languages.find((language) => language.slug === slug) ?? null;
}
```

`examples/nextjs/app/components/Search.js`

```javascript
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
```

`examples/nextjs/app/languages/[slug]/page.js`

```javascript
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
```

## 연습

1. `app/paradigms/[name]/page.js`를 추가합니다. 패러다임이 같은 언어만 서버 컴포넌트로 그리고, `generateStaticParams`에는 데이터에 있는 패러다임만 넣습니다.
2. 검색어를 주소 쿼리로 옮기면 새로고침 뒤에도 남습니다. 서버가 읽어야 하는지, 지금처럼 클라이언트 상태로 충분한지 한 문장으로 정합니다. 함수를 props로 넘기지 않습니다.
3. 없는 슬러그를 404로 바꿉니다. `notFound`를 호출하고, 있는 슬러그 열 개는 계속 문서를 보여 주는지 확인합니다.

## 스스로 확인

1. `data.js`가 `/languages/data`로 열리지 않는 이유는 무엇입니까?

라우트는 `page.js`만 만듭니다. `data.js`는 같은 폴더의 모듈입니다.

2. `Search`에 `getLanguage`를 넘기면 왜 안 됩니까?

서버 컴포넌트에서 클라이언트 컴포넌트로 가는 props는 직렬화되어야 합니다. 함수는 직렬화되지 않고, 언어 배열은 평범한 데이터라서 넘길 수 있습니다.

3. `"use client"`를 `layout.js`에 붙이면 무엇이 바뀝니까?

루트 레이아웃이 클라이언트 경계가 됩니다. 이 예제는 검색 파일에만 지시문을 두어 목록 길이와 상세 문서를 서버 컴포넌트로 남깁니다.

4. Next.js 14에서 `LanguagePage`의 `params`는 어떤 모양입니까?

`{ params }`로 받는 동기 객체이고 `params.slug`가 문자열입니다. 의존성이 next 14이므로 Promise로 기다리지 않습니다.

5. `Link` 대신 `<a>`를 쓰면 무엇이 다릅니까?

`<a>`는 문서 전체를 다시 요청합니다. `Link`는 `/languages/${slug}` 또는 `/`로 앱 안에서 전환합니다.
