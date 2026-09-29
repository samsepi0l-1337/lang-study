import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateLanguageDto } from './create-language.dto';

export interface Language {
  id: number;
  name: string;
  paradigm: string;
  year: number;
  summary: string;
}

const SEED: Omit<Language, 'id'>[] = [
  {
    name: 'Python',
    paradigm: '다중 패러다임',
    year: 1991,
    summary: '들여쓰기로 블록을 나누고 표준 라이브러리가 넓습니다.',
  },
  {
    name: 'JavaScript',
    paradigm: '다중 패러다임',
    year: 1995,
    summary: '브라우저와 서버가 같은 언어를 실행합니다.',
  },
  {
    name: 'Go',
    paradigm: '명령형',
    year: 2009,
    summary: '단순한 문법과 표준 라이브러리 HTTP를 함께 둡니다.',
  },
  {
    name: 'Rust',
    paradigm: '다중 패러다임',
    year: 2015,
    summary: '소유권으로 메모리 안전을 컴파일할 때 검사합니다.',
  },
  {
    name: 'TypeScript',
    paradigm: '다중 패러다임',
    year: 2012,
    summary: 'JavaScript에 정적 타입과 컴파일 단계를 더합니다.',
  },
  {
    name: 'Kotlin',
    paradigm: '다중 패러다임',
    year: 2011,
    summary: 'JVM에서 null 허용 여부를 타입으로 구분합니다.',
  },
  {
    name: 'Elixir',
    paradigm: '함수형',
    year: 2011,
    summary: '가벼운 프로세스와 메시지로 동시성을 만듭니다.',
  },
  {
    name: 'Zig',
    paradigm: '명령형',
    year: 2016,
    summary: '할당자를 호출자가 고르고 오류를 값으로 돌려줍니다.',
  },
  {
    name: 'Dart',
    paradigm: '객체지향',
    year: 2011,
    summary: '화면과 서버를 한 언어의 타입 시스템으로 작성합니다.',
  },
  {
    name: 'Haskell',
    paradigm: '순수 함수형',
    year: 1990,
    summary: '순수 함수와 강한 타입으로 부작용을 경계 밖에 둡니다.',
  },
];

@Injectable()
export class LanguagesService {
  private readonly items: Language[] = SEED.map((row, index) => ({
    id: index + 1,
    ...row,
  }));

  private nextId = this.items.length + 1;

  findAll(): Language[] {
    return this.items.map((row) => ({ ...row }));
  }

  findOne(id: number): Language {
    const found = this.items.find((row) => row.id === id);
    if (!found) {
      throw new NotFoundException(`없는 언어 id입니다: ${id}`);
    }
    return { ...found };
  }

  create(dto: CreateLanguageDto): Language {
    const name = dto.name.trim();
    const paradigm = dto.paradigm.trim();
    const summary = dto.summary.trim();
    if (!name || !paradigm || !summary) {
      throw new BadRequestException('이름, 패러다임, 요약을 비울 수 없습니다.');
    }
    const duplicated = this.items.some((row) => row.name.toLowerCase() === name.toLowerCase());
    if (duplicated) {
      throw new ConflictException(`이미 등록된 언어입니다: ${name}`);
    }
    const created: Language = {
      id: this.nextId,
      name,
      paradigm,
      year: dto.year,
      summary,
    };
    this.nextId += 1;
    this.items.push(created);
    return { ...created };
  }
}
