---
title: "NestJS로 언어 등록 API"
slug: nestjs
order: 13
level: "고급"
minutes: 50
tags: [NestJS]
summary: "모듈과 생성자 주입, DTO 검증으로 언어 열 개를 등록하는 HTTP API를 조립합니다."
---

# NestJS로 언어 등록 API

이 노트는 samsepi0l이 언어 등록 API를 NestJS로 정리한 것입니다. 프로그래밍 언어를 조회하고 추가합니다. 시드는 Python, JavaScript, Go, Rust, TypeScript, Kotlin, Elixir, Zig, Dart, Haskell입니다. Rust의 연도는 1.0이 나온 2015년으로 적습니다. 응답 JSON의 필드는 `id`, `name`, `paradigm`, `year`, `summary`입니다.

NestJS는 이 목록을 대신 설계해 주지 않습니다. 모듈은 무엇을 한 덩어리로 볼지, 프로바이더는 누가 객체를 만들지, 컨트롤러는 어떤 경로가 그 객체를 부를지, 파이프는 본문이 메서드에 들어가기 전에 무엇을 거절할지를 나눕니다.

예제는 두 층입니다. `examples/nestjs/mini-di.test.mjs`는 패키지 없이 생성자 주입과 `GET /languages` 경로 표만 확인합니다. `examples/nestjs/src`는 같은 경계를 `@nestjs/common`과 `class-validator`로 옮깁니다. 프로세스를 재시작하면 추가분은 사라집니다. 이 장의 주제는 저장소가 아니라 책임의 위치입니다.

## 이 장을 끝내면

- 모듈의 `controllers`와 `providers`가 나뉘는 이유를 경로와 생성으로 나눠 설명합니다.
- 토큰, 공장 함수, 싱글톤으로 생성자 주입을 재현합니다.
- DTO와 `ValidationPipe`가 서비스보다 먼저 잘못된 본문을 거절하는 지점을 가리킵니다.

## 모듈은 조립 경계입니다

`LanguagesModule`이 루트 모듈입니다. 자원이 언어 등록부뿐이므로 별도의 앱 모듈을 두지 않습니다. 자원이 늘면 루트는 기능 모듈을 `imports`에 넣기만 합니다. 컨트롤러를 루트 파일에 계속 쌓지 않습니다.

`controllers`는 HTTP에 노출할 클래스이고 `providers`는 Nest가 만들어 줄 클래스입니다. 서비스가 프로바이더 배열에 없으면 부팅이 실패합니다. 첫 요청이 온 뒤가 아니라 기동할 때 실패하는 편이 안전합니다. 경로가 없는 것이 아니라 의존 토큰을 못 찾은 것입니다.

이 모듈은 `exports`가 비어 있습니다. 다른 모듈이 서비스를 주입받지 않기 때문입니다. 다른 기능이 언어 이름을 확인해야 하면 서비스를 `exports`에 넣고, 그 모듈을 상대의 `imports`에 넣습니다. 프로바이더를 다른 파일에서 `new`하지 않습니다.

## 프로바이더는 만드는 방법을 숨깁니다

`@Injectable()`이 붙은 `LanguagesService`가 프로바이더입니다. 컨트롤러는 `constructor(private readonly languages: LanguagesService)`라고만 적습니다. 서비스 생성은 모듈 선언과 컨테이너가 맡습니다.

TypeScript는 생성자 인자 타입을 런타임에서 지웁니다. `emitDecoratorMetadata`와 `import 'reflect-metadata'`가 `design:paramtypes`를 남겨 Nest가 `LanguagesService` 토큰을 읽게 합니다. `experimentalDecorators`와 `emitDecoratorMetadata`는 켜 두고, `useDefineForClassFields`는 꺼 둡니다. 후자가 켜지면 매개변수 프로퍼티와 검증 데코레이터의 초기화 순서가 어긋날 수 있습니다.

`private`는 다른 TypeScript 파일이 필드를 읽지 못하게 하는 컴파일 제약입니다. 지워진 뒤의 자바스크립트 필드 접근을 막지는 못합니다. 메타데이터에는 생성자 인자 타입이 남습니다.

기본 스코프는 싱글톤입니다. 같은 토큰은 프로세스에서 한 번만 만듭니다. 목록을 요청마다 새로 만들면 시드가 요청마다 갈라지므로 이 자원에는 싱글톤이 맞습니다. 요청 스코프는 요청마다 상태가 달라질 때만 씁니다.

`mini-di.test.mjs`의 컨테이너는 그 모양만 설치 없이 보여 줍니다. `register(token, factory, deps)`가 공장과 의존 토큰을 기록하고, `resolve`가 의존을 먼저 만든 뒤 공장에 넘깁니다. 인스턴스는 `Map`에 두므로 두 번째 `resolve`는 같은 객체입니다. 해결 중인 토큰을 `Set`에 넣어 순환을 예외로 끊습니다. 이 파일의 라우터 표는 `GET /languages`만 가집니다. `POST /languages`는 Nest 컨트롤러가 담당합니다.

`create`에는 `await`가 없습니다. 이벤트 루프는 `await`에서만 다른 콜백을 끼워 넣으므로, 중복 검사와 `push`가 한 함수 안에서 끝나면 그 사이에는 다른 등록이 들어오지 않습니다. 저장을 `await`로 나누면 같은 이름이 두 번 통과할 수 있습니다. 그때는 검사와 저장을 한 구간으로 묶습니다. 지금 파일을 나누는 이유는 동시성이 아니라 책임입니다.

## 컨트롤러는 경로만 받습니다

`@Controller('languages')`가 접두사입니다. `@Get()`은 `GET /languages`, `@Post()`는 `POST /languages`, `@Get(':id')`는 `GET /languages/1`입니다. POST의 기본 상태 코드는 201입니다.

`ParseIntPipe`는 `:id`가 정수가 아니면 400을 내고 서비스에 문자열을 넘기지 않습니다. 컨트롤러는 배열에 `push`하지 않습니다. 조회는 `findAll`과 `findOne`, 등록은 `create`만 호출합니다. 경로는 서비스에 없고, 중복 규칙은 컨트롤러에 없습니다.

`findAll`과 `findOne`은 객체를 복사해 반환합니다. 호출자가 반환값의 이름을 고쳐도 저장 배열은 그대로입니다. 없는 id는 `NotFoundException`이고, 프레임워크가 404 JSON으로 바꿉니다.

## DTO와 파이프가 본문을 거절합니다

인터페이스는 컴파일 뒤에 사라지므로 데코레이터를 붙일 수 없습니다. `CreateLanguageDto`는 클래스입니다. `name!` 같은 단언은 값이 생성자가 아니라 파이프에서 채워진다는 약속입니다. 런타임 검사는 데코레이터가 합니다.

`main.ts`의 전역 `ValidationPipe`는 세 옵션을 켭니다. `transform: true`이면 class-transformer가 검증보다 먼저 돕니다. `whitelist: true`는 데코레이터가 없는 속성을 제거합니다. `forbidNonWhitelisted: true`는 그런 속성이 있으면 400으로 거절합니다. 본문의 `id`로 번호를 집어넣는 요청이 조용히 사라지지 않습니다.

`@Transform`은 문자열의 앞뒤 공백을 자릅니다. 변환이 먼저이므로 `@MinLength(1)`은 공백만 있는 이름을 거절합니다. `@Type(() => Number)`만 연도를 숫자로 바꿉니다. JSON 숫자가 이미 숫자여도 유지됩니다. 암시적 변환을 전역으로 켜지 않는 이유는, 어느 필드가 바뀌는지 선언에 남기기 위해서입니다.

연도는 1950 이상 2100 이하의 정수입니다. 요약은 4자 이상 200자 이하입니다. `MaxLength`는 자바스크립트 문자열 길이, 곧 UTF-16 코드 단위를 셉니다. 다음 장의 Go 예제는 같은 상한을 룬 개수로 셉니다. 이 시드의 한글 문장에서는 두 기준이 갈라지지 않습니다.

서비스 `create`는 파이프 뒤에도 `trim`과 빈 값을 다시 봅니다. 컨트롤러를 통하지 않은 호출에도 최소 조건을 두기 위해서입니다. 이름 비교는 `toLowerCase`입니다. `Python`과 `python`은 한 언어입니다. 이 비교는 모든 문자의 대소문자 접기와 같지는 않고, 영문 언어 이름에 한정합니다. 중복은 `ConflictException`으로 409입니다. id는 시드 다음 정수이며 클라이언트가 정하지 않습니다.

## 시드는 규칙과 같은 곳에 둡니다

`languages.service.ts`의 `SEED`가 초기 열 개입니다. id는 1부터 붙입니다. 패러다임은 그 언어를 이 공부장에서 부를 때의 짧은 분류입니다. Python, JavaScript, Rust, TypeScript, Kotlin은 다중 패러다임이고 Go와 Zig은 명령형입니다. Elixir는 함수형, Dart는 객체지향, Haskell은 순수 함수형입니다. 시드를 컨트롤러에 두면 경로를 읽는 사람이 초기 데이터와 등록 규칙을 같이 고쳐야 합니다.

## 예제

소스 경로는 `examples/nestjs/src/languages.module.ts`, `languages.controller.ts`, `languages.service.ts`, `create-language.dto.ts`, `main.ts`입니다. 설정은 `examples/nestjs/package.json`과 `tsconfig.json`입니다. `"type"`은 `commonjs`입니다. 주입 실험만 `examples/nestjs/mini-di.test.mjs`로 ESM 실행합니다.

`examples/nestjs/src/languages.module.ts` 전체입니다.

```typescript
import { Module } from '@nestjs/common';
import { LanguagesController } from './languages.controller';
import { LanguagesService } from './languages.service';

@Module({
  controllers: [LanguagesController],
  providers: [LanguagesService],
})
export class LanguagesModule {}
```

`examples/nestjs/src/languages.controller.ts`의 클래스입니다.

```typescript
@Controller('languages')
export class LanguagesController {
  constructor(private readonly languages: LanguagesService) {}

  @Get()
  list(): Language[] {
    return this.languages.findAll();
  }

  @Get(':id')
  one(@Param('id', ParseIntPipe) id: number): Language {
    return this.languages.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateLanguageDto): Language {
    return this.languages.create(dto);
  }
}
```

`examples/nestjs/src/languages.service.ts`의 등록입니다.

```typescript
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
```

`examples/nestjs/src/main.ts`는 파이프를 먼저 걸고 포트를 읽습니다. 기본 포트는 8080입니다.

```typescript
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(LanguagesModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  const raw = process.env.PORT ?? '8080';
  const port = Number(raw);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`PORT가 올바른 포트가 아닙니다: ${raw}`);
  }
  await app.listen(port);
}
```

`examples/nestjs/mini-di.test.mjs`의 `resolve`는 순환과 싱글톤을 같이 처리합니다.

```javascript
  function resolve(token) {
    if (instances.has(token)) {
      return instances.get(token);
    }
    if (stack.has(token)) {
      throw new Error(`순환 의존입니다: ${token}`);
    }
    const entry = factories.get(token);
    if (!entry) {
      throw new Error(`등록되지 않은 토큰입니다: ${token}`);
    }
    stack.add(token);
    try {
      const args = entry.deps.map((dep) => resolve(dep));
      const created = entry.factory(...args);
      instances.set(token, created);
      return created;
    } finally {
      stack.delete(token);
    }
  }
```

설치 없이 `node mini-di.test.mjs`를 실행합니다. Nest 서버는 의존성을 받은 뒤 `npx tsc -p tsconfig.json`으로 컴파일하고 `node dist/main.js`로 띄웁니다. `GET /languages`는 열 개를 반환하고, 아래 본문의 `POST /languages`는 201과 새 id를 반환합니다. 같은 이름을 대소문자만 바꿔 다시 보내면 409입니다.

```bash
curl -s localhost:8080/languages
curl -s -X POST localhost:8080/languages \
  -H 'content-type: application/json' \
  -d '{"name":"OCaml","paradigm":"함수형","year":1996,"summary":"강한 타입의 ML 계열 언어"}'
```

## 연습

1. 서버를 띄운 뒤 `GET /languages/abc`와 `GET /languages/99`의 상태 코드를 비교합니다. 하나는 `ParseIntPipe`, 다른 하나는 `NotFoundException`입니다.
2. `POST /languages` 본문에 `id`를 넣어 400을 확인합니다. `forbidNonWhitelisted`를 끄면 그 필드가 제거만 되는지도 확인합니다. 서비스는 id를 받지 않는 상태가 유지되어야 합니다.
3. 시드에 없는 언어를 201로 추가한 뒤, 같은 이름을 `toLowerCase` 형태로 다시 보냅니다. 409의 본문이 서비스의 `ConflictException` 메시지인지 확인합니다.

## 스스로 확인

1. providers에서 LanguagesService를 빼면 언제 실패합니까?

부팅할 때 실패합니다. 컨트롤러 생성자의 토큰을 컨테이너가 찾지 못하기 때문입니다. 라우트가 등록된 뒤 첫 POST에서야 알게 두면, 잘못된 조립이 요청을 받을 때까지 숨습니다.

2. DTO를 interface로 바꾸면 검증은 왜 멈춥니까?

인터페이스는 컴파일 결과에 생성자가 남지 않습니다. 데코레이터와 `design:type` 메타데이터를 붙일 대상이 없으므로 `ValidationPipe`가 클래스 검증을 수행할 수 없습니다. 서비스 인자 타입만으로는 런타임 본문 검사가 되지 않습니다.

3. whitelist만 켜면 본문의 id는 어떻게 됩니까?

데코레이터가 없는 `id`는 인스턴스에서 제거되고, 요청 자체는 통과할 수 있습니다. `forbidNonWhitelisted`가 켜져 있어야 그 필드의 존재가 400이 됩니다. 오타와 집어넣기를 구분해서 거절하려면 거절 옵션이 필요합니다.

4. 이름 비교에 toLowerCase를 쓴 한계는 무엇입니까?

영문 언어 이름의 대소문자를 같게 보는 비교입니다. 모든 문자의 대소문자 접기와 같지 않습니다. 다음 장의 Go 저장소는 `strings.EqualFold`를 사용합니다. 두 API의 거절 의도는 같고, 알고리즘은 같지 않습니다.

5. mini-di의 두 번째 resolve가 같은 객체를 주는 이유는 무엇입니까?

`resolve`가 공장을 호출한 결과를 토큰 `Map`에 저장하기 때문입니다. Nest의 기본 스코프도 싱글톤이라 같은 클래스 토큰은 프로세스에 하나가 됩니다. 순환은 그 `Map`에 넣기 전에, 해결 중 집합을 보고 예외로 끊습니다.
