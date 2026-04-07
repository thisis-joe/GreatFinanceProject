# Phase 0 — 프로젝트 뼈대 재구성 작업 기록

> 브랜치: `refac/project-restructure` → `dev` 병합 완료
> 커밋: `9ee89c0 refac: restructure project to com.myllm.financeai domain-based packages`

---

## 목표

현재 Claude가 생성한 프로토타입 코드(`com.example.financeconsole`)를 실제 프로젝트 구조(`com.myllm.financeai`)로 재구성하고, 앞으로 Phase 1~10에서 필요한 의존성을 미리 추가한다.

---

## Step 0-1: pom.xml 의존성 추가

### pom.xml이란?

Maven의 `pom.xml`은 이 프로젝트가 어떤 외부 라이브러리를 쓰는지 선언하는 파일이다. Maven은 여기에 적힌 라이브러리를 인터넷에서 자동으로 다운받아 프로젝트에 연결해준다.

### 변경 내용

`groupId`를 `com.example` → `com.myllm`로, `artifactId`를 `finance-ai`로 변경했다. `groupId`는 Maven이 프로젝트를 식별하는 그룹 이름으로, Java 패키지 규칙상 보통 역도메인(reverse domain) 형식을 쓴다.

기존 4개 의존성에 12개를 추가했다. 각 의존성의 역할은 다음과 같다:

| 의존성 | 역할 |
|---|---|
| `spring-boot-starter-data-jpa` | Java 객체와 DB 테이블을 연결하는 ORM 기술. `@Entity`를 쓸 수 있게 된다 |
| `spring-boot-starter-security` | 인증/인가 프레임워크. JWT 필터를 거는 기반 |
| `postgresql` | PostgreSQL JDBC 드라이버. Java에서 PostgreSQL과 통신하려면 필요 |
| `h2` | 메모리 내장 DB. PostgreSQL 없이도 서버를 띄워볼 수 있다. 개발 초기에 유용 |
| `flyway-core` + `flyway-database-postgresql` | SQL 파일로 DB 테이블을 버전 관리 |
| `lombok` | getter, setter, constructor 등 반복 코드를 어노테이션 하나로 자동 생성 |
| `springdoc-openapi-starter-webmvc-ui` | Swagger UI를 자동 생성. 브라우저에서 API를 테스트할 수 있는 화면 제공 |
| `jjwt-api` / `jjwt-impl` / `jjwt-jackson` | JWT 토큰을 생성하고 검증하는 라이브러리 |
| `jackson-datatype-jsr310` | Java 8 날짜(`LocalDateTime` 등)를 JSON으로 올바르게 변환 |
| `spring-security-test` | Security 관련 테스트 유틸 |

Lombok은 빌드 결과물(jar)에 포함될 필요가 없으므로 `spring-boot-maven-plugin`에서 제외 설정을 추가했다.

---

## Step 0-2: application.properties → application.yml 전환

### 왜 전환하는가?

Spring Boot는 `application.properties` 또는 `application.yml` 파일에서 서버 설정을 읽는다. 둘 다 똑같은 역할이지만 형식이 다르다.

- `.properties`는 `spring.datasource.url=xxx` 같이 점(.)으로 계층을 표현
- `.yml`은 들여쓰기로 계층을 표현

설정이 많아질수록 `.yml`이 깔끔하다. 이 프로젝트는 DB, Security, AI, Flyway 등 설정이 많아질 예정이므로 `.yml`로 전환했다.

### 주요 설정

| 설정 | 값 | 이유 |
|---|---|---|
| `datasource.url` | `jdbc:h2:mem:financeai` | H2 메모리 DB. PostgreSQL 없이도 서버가 뜨게 하기 위함 |
| `h2.console.enabled` | `true` | `http://localhost:8080/h2-console`에서 DB를 직접 확인 가능 |
| `jpa.hibernate.ddl-auto` | `create-drop` | 서버 시작 시 테이블 자동 생성 (개발용) |
| `jpa.show-sql` | `true` | 실행되는 SQL을 콘솔에 출력하여 학습에 도움 |
| `flyway.enabled` | `false` | 아직 마이그레이션 SQL 파일이 없으므로 비활성화. Phase 1에서 활성화 |
| `springdoc.swagger-ui.path` | `/swagger-ui.html` | Swagger API 문서 접근 경로 |

기존 `application.properties` 파일은 삭제했다.

---

## Step 0-3: 패키지 재구성

### 패키지(Package)란?

Java에서 `package`는 파일을 논리적으로 묶는 폴더 구조다. `package com.myllm.financeai.analysis.controller`라고 선언하면, 이 Java 파일은 반드시 `com/myllm/financeai/analysis/controller/` 폴더 안에 있어야 한다. 패키지명과 실제 폴더 경로가 1:1로 대응되는 것이 Java의 규칙이다.

### 기술 계층 구조 vs 도메인 구조

기존의 "기술 계층별" 구조를 "도메인별" 구조로 변경했다.

```
기술 계층 구조 (변경 전):            도메인 구조 (변경 후):
com.example.financeconsole/        com.myllm.financeai/
├── controller/                    ├── common/        ← 공통 (응답, 예외, 설정)
├── service/                       ├── analysis/      ← 분석 핵심
├── dto/                           ├── (향후) auth/   ← 인증
└── api/                           ├── (향후) document/ ← 문서 관리
                                   ├── (향후) market/ ← 시장 데이터
                                   └── (향후) rag/    ← 검색 시스템
```

도메인 구조의 장점: 하나의 기능에 관련된 파일이 한 폴더에 모여있어서, "분석 기능을 고치려면 `analysis/` 폴더만 보면 된다"는 직관이 생긴다.

### 파일 이동 내역

| 변경 전 (com.example.financeconsole) | 변경 후 (com.myllm.financeai) |
|---|---|
| `FinanceAnalysisConsoleApplication.java` | `FinanceAiApplication.java` (클래스명도 변경) |
| `api/ApiResponse.java` | `common/response/ApiResponse.java` |
| `controller/AnalysisController.java` | `analysis/controller/AnalysisController.java` |
| `service/AnalysisService.java` | `analysis/service/AnalysisService.java` |
| `dto/*.java` (9개 record 파일) | `analysis/dto/*.java` |

모든 파일의 `package` 선언과 `import` 문을 새 경로에 맞게 수정했다. 변경 후 프로젝트 전체에서 `com.example` 참조가 **0건**임을 확인했다.

### SecurityConfig 임시 추가

Spring Security를 의존성에 추가하면, 기본적으로 **모든 URL이 로그인 필요 상태**가 된다. 아무 설정 없이 서버를 띄우면 기존 API가 전부 막힌다.

Phase 2에서 JWT 인증을 본격 구현하기 전까지, `SecurityConfig`에서 임시로 모든 요청을 허용(`permitAll`)하도록 설정했다. 또한 H2 콘솔이 iframe을 사용하므로 `frameOptions`도 `sameOrigin`으로 허용했고, REST API 서버이므로 CSRF 보호는 비활성화했다.

---

## 빌드 검증

`mvnw compile`을 실행하여 모든 Java 파일이 에러 없이 컴파일되는 것을 확인했다. 이 명령은 소스코드를 Java 바이트코드로 변환만 하는 단계로, 테스트 실행 없이 "코드에 문법 에러가 없는지"만 확인한다.

---

## 최종 프로젝트 구조

```
com/myllm/financeai/
├── FinanceAiApplication.java          ← Spring Boot 진입점
├── analysis/
│   ├── controller/
│   │   └── AnalysisController.java    ← API 엔드포인트 (POST /query, /compare 등)
│   ├── dto/
│   │   ├── AnalysisAnswerDto.java     ← 답변 데이터 (summary, fullText, confidence)
│   │   ├── AnalysisQueryRequest.java  ← 분석 요청 데이터 (query, ticker, market 등)
│   │   ├── AnalysisResultDto.java     ← 분석 결과 통합 (answer + citations + trace)
│   │   ├── CitationDto.java           ← 인용 문서 정보
│   │   ├── RetrievalTraceBundleDto.java ← retrieval trace 묶음
│   │   ├── RetrievalTraceDto.java     ← 검색 과정 단계별 기록
│   │   ├── SessionDetailDto.java      ← 세션 상세 정보
│   │   ├── SessionSummaryDto.java     ← 세션 목록 요약
│   │   └── ToolTraceDto.java          ← 도구 호출 기록
│   └── service/
│       └── AnalysisService.java       ← 분석 비즈니스 로직 (현재 mock 데이터)
└── common/
    ├── config/
    │   └── SecurityConfig.java        ← Spring Security 설정 (임시 전체 허용)
    └── response/
        └── ApiResponse.java           ← 공통 API 응답 래퍼 { success, data, message }
```

---

## Git 상태

```
main ← v0.0.0 (초기 상태, 릴리즈 전용)
 └── dev ← 9ee89c0 Phase 0 완료 (현재 위치)
      └── refac/project-restructure (작업 완료, dev에 병합됨)
```

---

## 다음 단계: Phase 1

Phase 1에서는 PostgreSQL을 연결하고, Flyway 마이그레이션으로 7개 핵심 테이블을 생성하고, 각 테이블에 대응하는 Entity 클래스를 작성한다.
