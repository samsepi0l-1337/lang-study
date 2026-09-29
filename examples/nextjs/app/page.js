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
