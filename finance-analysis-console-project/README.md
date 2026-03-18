# Finance Analysis Console Project

A single-run Spring Boot project that serves both:

- a **backend API** for finance analysis sessions
- a **single-screen static frontend console** from `src/main/resources/static`

The UI is intentionally simple and legacy-style so the system architecture and retrieval flow remain the main focus.

## Features

- Single-screen analysis console
- Analysis mode:
  - `PIPELINE`
  - `TOOL_CALLING`
  - `BOTH`
- Session history with:
  - mode
  - confidence
  - sorting
  - filtering
  - pinned selected row
- Retrieval trace viewer
- In-memory sample data so the app is usable immediately after startup

## Tech Stack

- Java 21
- Spring Boot 3
- Static HTML / CSS / JavaScript frontend served by Spring Boot

## Project Structure

```text
finance-analysis-console-project/
├─ mvnw
├─ mvnw.cmd
├─ pom.xml
├─ src/
│  ├─ main/
│  │  ├─ java/com/example/financeconsole/
│  │  │  ├─ FinanceAnalysisConsoleApplication.java
│  │  │  ├─ api/ApiResponse.java
│  │  │  ├─ controller/AnalysisController.java
│  │  │  ├─ dto/
│  │  │  └─ service/AnalysisService.java
│  │  └─ resources/
│  │     ├─ application.properties
│  │     └─ static/
│  │        ├─ index.html
│  │        ├─ app.js
│  │        └─ styles.css
└─ .gitignore
```

## Run

### macOS / Linux

```bash
chmod +x mvnw
./mvnw spring-boot:run
```

### Windows

```bat
mvnw.cmd spring-boot:run
```

The first run downloads Maven automatically if it is not installed.

Then open:

```text
http://localhost:8080
```

## Notes

- This version uses **in-memory session storage** for easy execution.
- The UI and API shapes were designed to match the interview/console workflow.
- If you want a database-backed version later, you can replace `AnalysisService` in-memory storage with JPA entities and repositories without changing the frontend flow too much.
