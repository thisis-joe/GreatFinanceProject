# MCP 개념과 이 프로젝트에의 적용 방안

> 작성일: 2026-03-20

---

## 1. MCP란?

**MCP (Model Context Protocol)** 는 Anthropic이 2024년 말 발표한 오픈 프로토콜로,
AI 모델(Claude 등)이 외부 도구·데이터 소스에 **표준화된 방식으로 연결**되도록 합니다.

```
[AI Client (Claude, Cursor 등)]
       ↕  (MCP 프로토콜: JSON-RPC over stdio/SSE)
[MCP Server]  ← 여기서 도구/리소스 노출
       ↕
[실제 데이터: 주가 API, DB, 파일시스템 등]
```

### 핵심 개념

| 개념 | 설명 | 예시 |
|------|------|------|
| **Tools** | 모델이 호출할 수 있는 함수 | `get_stock_price`, `search_news` |
| **Resources** | 모델이 읽을 수 있는 데이터 | 문서, DB 레코드, 파일 |
| **Prompts** | 재사용 가능한 프롬프트 템플릿 | 분석 리포트 양식 등 |

---

## 2. 이 프로젝트는 MCP인가?

**아니다.** 이 프로젝트는 REST API 서버이다.

| 항목 | 이 프로젝트 | MCP Server |
|------|------------|------------|
| 역할 | AI 분석 결과를 사람(프론트엔드)에게 보여주는 **REST API 서버** | AI 모델에게 도구/데이터를 제공하는 **플러그인 서버** |
| 프로토콜 | HTTP/REST (Spring MVC) | JSON-RPC over stdio 또는 SSE |
| 클라이언트 | 브라우저/프론트엔드 | Claude, Cursor, Zed 등 MCP 호환 AI 클라이언트 |
| LLM 연결 | 없음 (현재 mock 데이터) | MCP의 존재 이유 자체가 LLM 연결 |

> 현재 `AnalysisService`는 실제 LLM을 호출하지 않고 하드코딩된 mock 데이터를 반환한다.
> Spring AI + 실제 RAG 파이프라인은 아직 미구현 상태.

---

## 3. 주가정보 MCP 적용 방안

두 가지 방향이 있다.

---

### 방향 1: Claude Code에 주가 MCP 서버 연결 (개발 보조용)

Claude Code 자체에 주가 MCP를 붙여서, **개발 중에 실시간 주가를 Claude가 참조**하도록 한다.

```json
// ~/.claude/claude_desktop_config.json 또는 프로젝트 루트 .mcp.json
{
  "mcpServers": {
    "stock-price": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-finance"]
    }
  }
}
```

- 장점: 코드 변경 없이 바로 적용 가능
- 용도: 개발자(나)가 Claude와 대화할 때 실시간 주가 데이터 참조

---

### 방향 2: 이 프로젝트 내에 MCP Server 모듈 추가 (아키텍처 확장)

Spring Boot 앱 안에 MCP 서버를 추가하여, **Claude 같은 AI가 이 서버의 도구를 Tool Calling으로 사용**하도록 한다.

```
Claude (AI) → MCP 프로토콜 → [Spring Boot MCP 모듈]
                                    ├── get_stock_price(ticker)    → KIS/Yahoo Finance API
                                    ├── search_financial_news(q)   → 뉴스 API
                                    └── get_financial_summary(id)  → 내부 DB
```

#### pom.xml 의존성 추가

```xml
<!-- Spring AI MCP Server -->
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-mcp-server-spring-boot-starter</artifactId>
</dependency>
```

#### Tool 구현 예시

```java
@Component
public class StockPriceTool {

    @Tool(description = "주식 티커로 현재가 및 등락률을 조회합니다.")
    public StockPriceResult getStockPrice(
            @ToolParam("주식 티커 (예: 000660)") String ticker,
            @ToolParam("시장 구분: KR 또는 US") String market
    ) {
        // KIS API 또는 Yahoo Finance 호출
        return stockApiClient.fetch(ticker, market);
    }
}
```

#### 구조 비교

| 항목 | 방향 1 | 방향 2 |
|------|--------|--------|
| 구현 난이도 | 낮음 (설정만) | 중간 (모듈 개발 필요) |
| 대상 사용자 | 개발자 본인 | Claude 등 AI 클라이언트 |
| 프로젝트 가치 | 개발 편의성 향상 | 서비스 아키텍처의 일부 |
| 추천 시점 | 지금 바로 | RAG 실구현 이후 |

---

## 4. 권장 로드맵

```
현재 (mock 서버)
    ↓
Phase 1: Spring AI + 실제 LLM 연결 (RAG 파이프라인 구현)
    ↓
Phase 2: 방향 1 적용 — Claude Code에 주가 MCP 연결 (개발 보조)
    ↓
Phase 3: 방향 2 적용 — Spring Boot MCP 서버 모듈 추가
          └── get_stock_price, search_news 등 Tool 노출
          └── Claude가 직접 이 서버를 Tool Calling으로 활용
```

---

## 5. 참고 자료

- [MCP 공식 사이트](https://modelcontextprotocol.io)
- [Spring AI MCP 문서](https://docs.spring.io/spring-ai/reference/api/mcp/mcp-server-boot-starter-docs.html)
- [Anthropic MCP GitHub](https://github.com/modelcontextprotocol)
