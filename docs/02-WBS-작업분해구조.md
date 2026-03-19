# WBS (Work Breakdown Structure) — 금융 분석 AI 시스템

> 학습과 개발을 병행하며, 각 Phase가 끝날 때마다 **실행 가능한 상태**를 유지한다.
> 모든 Phase는 이전 Phase가 완료되어야 시작할 수 있다.

---

## 전체 로드맵 요약

```
Phase 0  프로젝트 뼈대 재구성          ██░░░░░░░░░░░░░░  지금 여기
Phase 1  DB + 핵심 엔티티              ████░░░░░░░░░░░░
Phase 2  JWT 인증                     ██████░░░░░░░░░░
Phase 3  문서 / 시장데이터 CRUD API     ████████░░░░░░░░
Phase 4  분석 세션 + 규칙기반 분석      ██████████░░░░░░
Phase 5  Spring AI + LLM 연결         ████████████░░░░
Phase 6  RAG (임베딩 + 벡터검색)       ██████████████░░
Phase 7  RAG 고도화 + Retrieval Trace  ████████████████
Phase 8  Tool Calling                 ████████████████
Phase 9  프론트엔드 실제 연결          ████████████████
Phase 10 마무리 + 배포               ████████████████
```

---

## Phase 0 — 프로젝트 뼈대 재구성

> **목표**: 현재 `com.example.financeconsole` 프로토타입을 `com.myllm.financeai` 구조로 재구성하고, 필요한 의존성을 모두 추가한다.

### 학습 주제

| 주제 | 내용 |
|---|---|
| Spring Boot 프로젝트 구조 | `main/java`, `main/resources`, `test` 디렉토리 역할 |
| pom.xml | Maven 빌드 도구, 의존성(dependency) 관리 방법 |
| application.yml | 설정 파일 형식, properties vs yml 차이 |
| 패키지 구조 | 계층형(controller/service/repository) vs 도메인형(user/document/analysis) |
| Lombok | 반복 코드(getter/setter/constructor) 자동 생성 라이브러리 |

### 작업 항목

| # | 작업 | 브랜치 | 산출물 |
|---|---|---|---|
| 0-1 | pom.xml 의존성 추가 (JPA, Security, Flyway, Lombok, Swagger, PostgreSQL, H2, Jackson) | `refac/project-restructure` | pom.xml |
| 0-2 | application.properties → application.yml 전환 | 동일 | application.yml |
| 0-3 | 패키지 리네임 `com.example.financeconsole` → `com.myllm.financeai` | 동일 | 전체 Java 파일 |
| 0-4 | 도메인별 패키지 디렉토리 생성 (common, auth, user, analysis, document, market, ai, rag, tool) | 동일 | 디렉토리 구조 |
| 0-5 | 기존 코드를 새 패키지로 이동 + 컴파일 확인 | 동일 | 빌드 성공 |
| 0-6 | H2 DB로 우선 기동 확인 (localhost:8080 접속 가능) | 동일 | 실행 확인 |

### 완료 기준
- [x] `./mvnw spring-boot:run` 으로 서버 기동
- [x] `http://localhost:8080` 접속 가능
- [x] 패키지 구조가 `com.myllm.financeai.*`

---

## Phase 1 — DB + Flyway + 핵심 엔티티

> **목표**: PostgreSQL 연결, Flyway 마이그레이션, 7개 핵심 테이블과 Entity 클래스를 만든다.

### 학습 주제

| 주제 | 내용 |
|---|---|
| JPA (Java Persistence API) | Java 객체와 DB 테이블을 연결하는 표준 기술 |
| Entity | `@Entity`, `@Id`, `@Column`, `@GeneratedValue` 등 어노테이션 |
| Repository | `JpaRepository`를 상속하면 CRUD 메서드가 자동 생성되는 원리 |
| Flyway | SQL 파일로 DB 구조를 버전 관리하는 방법 |
| PostgreSQL | 설치, psql 명령어, DB/유저 생성, pgvector 확장 설치 |
| BaseTimeEntity | `@MappedSuperclass`, `@EntityListeners`, `createdAt`/`updatedAt` 자동 관리 |
| UUID vs Auto Increment | PK(Primary Key) 전략 비교 |

### 작업 항목

| # | 작업 | 브랜치 | 산출물 |
|---|---|---|---|
| 1-1 | PostgreSQL 설치 + DB 생성 (`financeai`) + pgvector 확장 | `feat/database-setup` | DB 환경 |
| 1-2 | application.yml에 PostgreSQL 연결 설정 | 동일 | application.yml |
| 1-3 | Flyway V1 — users, documents, document_chunks 테이블 | `feat/flyway-migrations` | V1__init_core_tables.sql |
| 1-4 | Flyway V2 — analysis_sessions, analysis_results 테이블 | 동일 | V2__init_analysis_tables.sql |
| 1-5 | Flyway V3 — price_daily, financial_metrics 테이블 | 동일 | V3__init_market_tables.sql |
| 1-6 | BaseTimeEntity 작성 (createdAt, updatedAt 자동) | `feat/core-entities` | BaseTimeEntity.java |
| 1-7 | User 엔티티 + UserRepository | 동일 | User.java, UserRepository.java |
| 1-8 | Document + DocumentChunk 엔티티 + Repository | 동일 | Document.java, DocumentChunk.java |
| 1-9 | PriceDaily 엔티티 + Repository | 동일 | PriceDaily.java |
| 1-10 | FinancialMetric 엔티티 + Repository | 동일 | FinancialMetric.java |
| 1-11 | AnalysisSession + AnalysisResult 엔티티 + Repository | 동일 | AnalysisSession.java, AnalysisResult.java |
| 1-12 | 서버 기동 + Flyway 마이그레이션 자동 실행 확인 | — | psql로 테이블 확인 |

### 완료 기준
- [ ] 서버 기동 시 Flyway가 테이블 7개를 자동 생성
- [ ] psql에서 `\dt` 로 테이블 목록 확인 가능
- [ ] Entity 클래스 7개 컴파일 성공

---

## Phase 2 — JWT 인증

> **목표**: 회원가입/로그인 API를 만들고, JWT 토큰으로 API를 보호한다.

### 학습 주제

| 주제 | 내용 |
|---|---|
| Spring Security | 인증(Authentication)과 인가(Authorization)의 차이 |
| SecurityFilterChain | 요청이 들어올 때 거치는 보안 필터 체인 구조 |
| JWT 구조 | Header.Payload.Signature 3파트 구조, 토큰 생성/검증 원리 |
| BCrypt | 비밀번호 해시 알고리즘, 단방향 암호화 |
| DTO (Data Transfer Object) | 왜 Entity를 직접 반환하면 안 되는가 |
| @Valid, @NotBlank | 요청 데이터 유효성 검증 어노테이션 |
| GlobalExceptionHandler | `@RestControllerAdvice`로 예외를 일괄 처리하는 패턴 |

### 작업 항목

| # | 작업 | 브랜치 | 산출물 |
|---|---|---|---|
| 2-1 | 공통 응답 래퍼: ApiResponse, ErrorCode, BusinessException | `feat/auth-jwt` | common/response, common/exception |
| 2-2 | GlobalExceptionHandler | 동일 | GlobalExceptionHandler.java |
| 2-3 | JwtTokenProvider (토큰 생성/검증) | 동일 | JwtTokenProvider.java |
| 2-4 | JwtAuthenticationFilter (매 요청마다 토큰 확인) | 동일 | JwtAuthenticationFilter.java |
| 2-5 | CustomUserDetailsService + UserPrincipal | 동일 | CustomUserDetailsService.java |
| 2-6 | SecurityConfig (필터 체인 설정, 공개/보호 URL 설정) | 동일 | SecurityConfig.java |
| 2-7 | AuthController + AuthService (회원가입, 로그인) | 동일 | AuthController.java, AuthService.java |
| 2-8 | SignupRequest, LoginRequest, AuthResponse DTO | 동일 | auth/dto/*.java |
| 2-9 | Swagger에서 회원가입 → 로그인 → 토큰 발급 테스트 | — | 수동 테스트 확인 |
| 2-10 | 인증 필요한 API 호출 시 토큰 없으면 401 반환 확인 | — | 수동 테스트 확인 |

### 완료 기준
- [ ] POST `/api/v1/auth/signup` → 회원가입 성공
- [ ] POST `/api/v1/auth/login` → JWT 토큰 반환
- [ ] 토큰 없이 보호된 API 호출 → 401 Unauthorized
- [ ] 토큰 포함하여 호출 → 정상 응답

---

## Phase 3 — 문서 / 시장데이터 CRUD API

> **목표**: 금융 데이터(문서, 가격, 재무)를 저장하고 조회하는 RESTful API를 만든다.

### 학습 주제

| 주제 | 내용 |
|---|---|
| RESTful API 설계 | HTTP 메서드(GET/POST/PUT/DELETE)와 URL 설계 원칙 |
| @RestController, @RequestMapping | 컨트롤러 어노테이션과 URL 매핑 |
| @RequestBody, @PathVariable, @RequestParam | 요청 데이터를 받는 3가지 방법 |
| Pageable | Spring Data의 페이징 처리 (page, size, sort) |
| QueryDSL or JPQL | 동적 검색 조건 처리 (제목, 날짜, 타입 등 복합 조건) |
| Enum 활용 | SourceType(NEWS/REPORT/FILING), IngestionStatus 등 |
| record 클래스 | Java 16+ 불변 DTO를 간결하게 만드는 방법 |

### 작업 항목

| # | 작업 | 브랜치 | 산출물 |
|---|---|---|---|
| 3-1 | Document DTO (CreateRequest, SearchCondition, DetailResponse) | `feat/document-api` | document/dto/*.java |
| 3-2 | DocumentService (저장, 검색, 상세조회) | 동일 | DocumentService.java |
| 3-3 | DocumentController (POST /documents, GET /documents, GET /documents/{id}) | 동일 | DocumentController.java |
| 3-4 | PriceDaily DTO (PriceItemResponse, PriceHistoryResponse) | `feat/market-api` | market/dto/*.java |
| 3-5 | PriceService + PriceDailyRepository (기간별 가격 조회) | 동일 | PriceService.java |
| 3-6 | FinancialMetric DTO + FinancialMetricService | 동일 | FinancialMetricService.java |
| 3-7 | MarketController (GET /market/prices, GET /market/financials) | 동일 | MarketController.java |
| 3-8 | 테스트 데이터 삽입 SQL (data.sql 또는 Swagger로 수동) | 동일 | 샘플 데이터 |
| 3-9 | Swagger에서 전체 API 테스트 | — | 수동 확인 |

### 완료 기준
- [ ] 문서 저장 → 조회 → 상세 흐름 동작
- [ ] 가격 데이터 기간 조회 동작
- [ ] 재무 지표 조회 동작
- [ ] Swagger UI에서 모든 API 확인 가능

---

## Phase 4 — 분석 세션 + 규칙 기반 분석

> **목표**: 질문을 받으면 문서 + 가격 + 재무를 검색하여 **규칙 기반 분석문**을 생성한다. (아직 AI 없이)

### 학습 주제

| 주제 | 내용 |
|---|---|
| 서비스 계층 설계 | 하나의 Service가 여러 Service를 조합하는 오케스트레이터 패턴 |
| @Transactional | DB 트랜잭션 관리 (성공하면 커밋, 실패하면 롤백) |
| 분석 파이프라인 | 여러 단계를 순서대로 실행하는 구조 설계 |
| Enum 기반 분기 | QueryIntentType에 따라 다른 검색 전략 적용 |
| JSON 컬럼 저장 | Jackson ObjectMapper로 객체 → JSON 문자열 변환 후 DB 저장 |

### 작업 항목

| # | 작업 | 브랜치 | 산출물 |
|---|---|---|---|
| 4-1 | QueryIntentType enum + QueryIntentService (규칙 기반 의도 분류) | `feat/analysis-pipeline` | QueryIntentService.java |
| 4-2 | AnalysisMaterial DTO (문서 + 가격 + 재무 통합) | 동일 | AnalysisMaterial.java |
| 4-3 | PriceSummary DTO (가격 변동 요약 계산) | 동일 | PriceSummary.java |
| 4-4 | FinancialSummary DTO (재무 변동 요약 계산) | 동일 | FinancialSummary.java |
| 4-5 | AnalysisPipelineService (문서검색 + 가격조회 + 재무조회 조합) | 동일 | AnalysisPipelineService.java |
| 4-6 | AnswerComposerService (규칙 기반 분석문 생성) | 동일 | AnswerComposerService.java |
| 4-7 | AnalysisSessionService (세션 + 결과 DB 저장) | 동일 | AnalysisSessionService.java |
| 4-8 | AnalysisService 통합 (오케스트레이터) | 동일 | AnalysisService.java |
| 4-9 | AnalysisController 수정 (POST /analysis/query, GET /analysis/sessions) | 동일 | AnalysisController.java |
| 4-10 | 분석 실행 → DB 저장 → 세션 목록 조회 테스트 | — | 수동 확인 |

### 완료 기준
- [ ] 질문 → 관련 문서/가격/재무 자동 검색 → 규칙 기반 답변 생성
- [ ] 분석 세션 + 결과가 DB에 저장됨
- [ ] 세션 목록/상세 조회 API 동작
- [ ] AI 없이도 구조화된 분석문이 출력됨

---

## Phase 5 — Spring AI + LLM 연결

> **목표**: 규칙 기반 답변을 **Mistral AI**가 생성하는 답변으로 교체한다.

### 학습 주제

| 주제 | 내용 |
|---|---|
| Spring AI 개념 | ChatClient, ChatModel, Prompt, Message 구조 |
| Mistral AI API | API 키 발급, 모델 종류, 요금 체계 |
| 프롬프트 엔지니어링 | 시스템 프롬프트 vs 유저 프롬프트, 구조화된 프롬프트 작성법 |
| API 키 관리 | 환경 변수, application.yml에 키를 안전하게 관리하는 방법 |
| 비동기 호출 | LLM 응답이 느릴 때의 타임아웃 처리 |

### 작업 항목

| # | 작업 | 브랜치 | 산출물 |
|---|---|---|---|
| 5-1 | pom.xml에 Spring AI Mistral starter 추가 | `feat/spring-ai-llm` | pom.xml |
| 5-2 | application.yml에 Mistral API 키 설정 | 동일 | application.yml |
| 5-3 | FinanceAnalysisAiService (프롬프트 조립 + ChatClient 호출) | 동일 | FinanceAnalysisAiService.java |
| 5-4 | 시스템 프롬프트 작성 (금융 분석가 역할 지시) | 동일 | 프롬프트 상수 또는 resource 파일 |
| 5-5 | AnswerComposerService 수정 → AI 응답 기반으로 전환 | 동일 | AnswerComposerService.java 수정 |
| 5-6 | 실제 질문 → AI 답변 확인 | — | 수동 확인 |

### 완료 기준
- [ ] 같은 질문에 대해 **AI가 생성한 자연어 분석문**이 반환됨
- [ ] 분석문에 검색된 문서 내용이 반영됨
- [ ] confidence_score 포함

---

## Phase 6 — RAG (임베딩 + 벡터 검색)

> **목표**: 문서를 chunk로 쪼개고, 임베딩하고, 벡터 검색으로 질문과 관련된 문서를 찾는다.

### 학습 주제

| 주제 | 내용 |
|---|---|
| 임베딩(Embedding) | 텍스트 → 벡터 변환 원리, 차원(1536) |
| pgvector | PostgreSQL 벡터 타입, 코사인 유사도 검색 쿼리 |
| Chunking 전략 | 문서를 몇 글자 단위로 쪼갤 것인가, overlap 개념 |
| Native Query | JPA에서 pgvector 쿼리를 직접 작성하는 방법 |
| 인덱스 (IVFFlat) | 벡터 검색을 빠르게 하는 인덱스 구조 |

### 작업 항목

| # | 작업 | 브랜치 | 산출물 |
|---|---|---|---|
| 6-1 | EmbeddingService (Spring AI EmbeddingModel 사용) | `feat/rag-embedding` | EmbeddingService.java |
| 6-2 | DocumentChunkService (문서 → chunk 분할 로직) | 동일 | DocumentChunkService.java |
| 6-3 | DocumentIndexingService (저장 → chunk → 임베딩 → DB 저장 파이프라인) | 동일 | DocumentIndexingService.java |
| 6-4 | Flyway V4 — document_chunks.embedding 차원 고정 + 벡터 인덱스 | 동일 | V4__vector_index.sql |
| 6-5 | DocumentChunkVectorRepository (pgvector 코사인 유사도 검색) | `feat/rag-retrieval` | DocumentChunkVectorRepository.java |
| 6-6 | RagRetrievalService (질문 임베딩 → 벡터 검색 → chunk 반환) | 동일 | RagRetrievalService.java |
| 6-7 | AnalysisPipelineService 수정 → 벡터 검색 결과 사용 | 동일 | AnalysisPipelineService.java 수정 |
| 6-8 | 실제 문서 저장 → 검색 → 답변 확인 | — | 수동 확인 |

### 완료 기준
- [ ] 문서 저장 시 자동으로 chunk + 임베딩 생성
- [ ] 질문하면 **의미적으로 관련된 문서 조각**이 검색됨
- [ ] 검색된 chunk가 AI 답변에 반영됨

---

## Phase 7 — RAG 고도화 + Retrieval Trace

> **목표**: 검색 품질을 높이고(Hybrid, Expansion, Rerank), 검색 과정을 기록한다.

### 학습 주제

| 주제 | 내용 |
|---|---|
| Full-Text Search | PostgreSQL tsvector, tsquery, ts_rank 함수 |
| Hybrid Retrieval | 벡터 + 키워드 점수 결합 방법 |
| Reranking | 검색 결과 재정렬 전략 |
| Observability | 시스템 내부 과정을 추적/기록하는 설계 원칙 |
| JSON 직렬화 | ObjectMapper로 trace 객체를 JSON 문자열로 변환 |

### 작업 항목

| # | 작업 | 브랜치 | 산출물 |
|---|---|---|---|
| 7-1 | Flyway V5 — document_chunks GIN 인덱스 (Full-Text Search용) | `feat/hybrid-retrieval` | V5__fts_index.sql |
| 7-2 | DocumentChunkKeywordRepository (PostgreSQL FTS 검색) | 동일 | DocumentChunkKeywordRepository.java |
| 7-3 | HybridRetrievalService (벡터 + 키워드 점수 합산) | 동일 | HybridRetrievalService.java |
| 7-4 | NeighborChunkExpansionService (앞뒤 chunk 확장) | `feat/rag-advanced` | NeighborChunkExpansionService.java |
| 7-5 | ContextMergeService (인접 hit 병합, 중복 제거) | 동일 | ContextMergeService.java |
| 7-6 | LightweightRerankerService (재정렬) | 동일 | LightweightRerankerService.java |
| 7-7 | SourceTypePlanningService (질문 유형별 sourceType 우선순위) | 동일 | SourceTypePlanningService.java |
| 7-8 | FallbackHybridRetrievalService (부족하면 다음 sourceType 확장) | 동일 | FallbackHybridRetrievalService.java |
| 7-9 | RetrievalTrace DTO + trace 수집 로직 | `feat/retrieval-trace` | RetrievalTrace.java 외 |
| 7-10 | analysis_results.trace_json에 trace 저장 | 동일 | AnalysisSessionService 수정 |
| 7-11 | GET /analysis/sessions/{id}/retrieval-trace API | 동일 | AnalysisController 수정 |

### 완료 기준
- [ ] 같은 질문에 대해 벡터 + 키워드 검색 결과가 합산됨
- [ ] 검색 단계별 trace가 DB에 JSON으로 저장됨
- [ ] trace 조회 API로 검색 과정 확인 가능

---

## Phase 8 — Tool Calling

> **목표**: LLM이 도구를 직접 선택하여 데이터를 수집하는 Agent 모드를 추가한다.

### 학습 주제

| 주제 | 내용 |
|---|---|
| Function Calling | LLM에게 함수 목록을 알려주고, LLM이 골라 호출하는 원리 |
| Spring AI Tool | @Tool 어노테이션, ToolCallback 등록 방법 |
| Agent 패턴 | LLM이 판단 → 도구 호출 → 결과 수신 → 다시 판단하는 루프 |
| PIPELINE vs Agent | 결정적 파이프라인과 동적 Agent의 trade-off |

### 작업 항목

| # | 작업 | 브랜치 | 산출물 |
|---|---|---|---|
| 8-1 | AnalysisToolService (3개 도구 메서드 정의) | `feat/tool-calling` | AnalysisToolService.java |
| 8-2 | 도구별 결과 DTO (ContextSearchToolResult, PriceSummaryToolResult, FinancialSummaryToolResult) | 동일 | tool/dto/*.java |
| 8-3 | ToolCallingAnalysisService (LLM + tool calling 오케스트레이션) | 동일 | ToolCallingAnalysisService.java |
| 8-4 | AnalysisService에 analysisMode 분기 추가 (PIPELINE / TOOL_CALLING) | 동일 | AnalysisService.java 수정 |
| 8-5 | POST /analysis/compare API (두 모드 동시 실행) | 동일 | AnalysisController 수정 |
| 8-6 | 동일 질문으로 PIPELINE vs TOOL_CALLING 결과 비교 테스트 | — | 수동 확인 |

### 완료 기준
- [ ] TOOL_CALLING 모드에서 LLM이 필요한 도구를 자동 선택
- [ ] BOTH 모드에서 두 결과를 동시에 반환
- [ ] 도구 호출 이력이 toolTrace에 기록됨

---

## Phase 9 — 프론트엔드 실제 연결

> **목표**: 기존 정적 프론트엔드(mock)를 실제 백엔드 API와 연결한다.

### 학습 주제

| 주제 | 내용 |
|---|---|
| fetch API | JavaScript에서 HTTP 요청을 보내는 방법 |
| CORS | 프론트와 백엔드 도메인이 다를 때의 보안 정책 |
| Authorization 헤더 | JWT 토큰을 요청에 포함하는 방법 |
| 비동기 처리 | async/await, Promise, 로딩 상태 관리 |

### 작업 항목

| # | 작업 | 브랜치 | 산출물 |
|---|---|---|---|
| 9-1 | api.ts에서 USE_MOCK = false 전환 + 실제 fetch 구현 | `feat/frontend-integration` | app.js 수정 |
| 9-2 | 로그인 폼 추가 (토큰 획득 → localStorage 저장) | 동일 | index.html, app.js |
| 9-3 | 분석 실행 → 실제 API 호출 → 결과 표시 | 동일 | app.js |
| 9-4 | 세션 목록 → 실제 API 호출 → 결과 표시 | 동일 | app.js |
| 9-5 | Retrieval Trace 표시 → 실제 API 연결 | 동일 | app.js |
| 9-6 | 전체 흐름 E2E 테스트 (가입→로그인→분석→이력조회) | — | 수동 확인 |

### 완료 기준
- [ ] 프론트에서 가입 → 로그인 → 분석 → 결과 확인 전체 흐름 동작
- [ ] mock 데이터 없이 실제 DB 데이터로 동작
- [ ] Retrieval Trace가 실제 검색 과정을 반영

---

## Phase 10 — 마무리 + 배포

> **목표**: 코드 정리, 테스트, 문서화, 배포.

### 작업 항목

| # | 작업 | 브랜치 | 산출물 |
|---|---|---|---|
| 10-1 | 코드 정리 + 불필요 코드 제거 | `refac/cleanup` | — |
| 10-2 | Swagger API 문서 정리 | 동일 | — |
| 10-3 | README.md 최종 업데이트 (실행 방법, 아키텍처 설명) | 동일 | README.md |
| 10-4 | Docker Compose (PostgreSQL + App) 작성 | `feat/docker` | docker-compose.yml |
| 10-5 | dev → main 병합 + v0.1.0 태그 | — | 첫 번째 릴리즈 |

### 완료 기준
- [ ] `docker compose up` 한 번으로 전체 시스템 실행 가능
- [ ] main 브랜치에 v0.1.0 태그
- [ ] 포트폴리오/면접에서 바로 시연 가능

---

## 예상 일정

| Phase | 내용 | 예상 소요 | 누적 |
|---|---|---|---|
| 0 | 프로젝트 뼈대 | 0.5일 | 0.5일 |
| 1 | DB + 엔티티 | 1~2일 | 2.5일 |
| 2 | JWT 인증 | 1일 | 3.5일 |
| 3 | CRUD API | 1~2일 | 5.5일 |
| 4 | 분석 파이프라인 | 2일 | 7.5일 |
| 5 | Spring AI + LLM | 1일 | 8.5일 |
| 6 | RAG 기초 | 2~3일 | 11.5일 |
| 7 | RAG 고도화 + Trace | 2~3일 | 14.5일 |
| 8 | Tool Calling | 1~2일 | 16.5일 |
| 9 | 프론트 연결 | 1일 | 17.5일 |
| 10 | 마무리 + 배포 | 1일 | 18.5일 |

> 학습 병행 기준 약 **3~4주**. 하루 집중도에 따라 유동적.

---

## 브랜치 전략 요약

```
main (릴리즈 전용)
  └── dev (개발 통합)
        ├── refac/project-restructure   ← Phase 0
        ├── feat/database-setup         ← Phase 1
        ├── feat/flyway-migrations      ← Phase 1
        ├── feat/core-entities          ← Phase 1
        ├── feat/auth-jwt               ← Phase 2
        ├── feat/document-api           ← Phase 3
        ├── feat/market-api             ← Phase 3
        ├── feat/analysis-pipeline      ← Phase 4
        ├── feat/spring-ai-llm          ← Phase 5
        ├── feat/rag-embedding          ← Phase 6
        ├── feat/rag-retrieval          ← Phase 6
        ├── feat/hybrid-retrieval       ← Phase 7
        ├── feat/rag-advanced           ← Phase 7
        ├── feat/retrieval-trace        ← Phase 7
        ├── feat/tool-calling           ← Phase 8
        ├── feat/frontend-integration   ← Phase 9
        ├── feat/docker                 ← Phase 10
        └── refac/cleanup              ← Phase 10
```
