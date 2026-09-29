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
