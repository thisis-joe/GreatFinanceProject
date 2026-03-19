package com.myllm.financeai.analysis.service;

import com.myllm.financeai.analysis.dto.*;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
public class AnalysisService {

    private final Map<String, SessionRecord> records = new LinkedHashMap<>();

    @PostConstruct
    public void seed() {
        AnalysisQueryRequest q1 = new AnalysisQueryRequest(
                "SK hynix recent investment points",
                "KR",
                "000660",
                "2026-03-01T00:00:00",
                "2026-03-13T23:59:59",
                true,
                "BOTH"
        );
        compare(q1);

        AnalysisQueryRequest q2 = new AnalysisQueryRequest(
                "Why did semiconductor stocks rise today?",
                "KR",
                "000660",
                "2026-03-05T00:00:00",
                "2026-03-13T23:59:59",
                true,
                "PIPELINE"
        );
        analyze(q2);

        AnalysisQueryRequest q3 = new AnalysisQueryRequest(
                "How did the market react after earnings release?",
                "KR",
                "000660",
                "2026-03-01T00:00:00",
                "2026-03-13T23:59:59",
                true,
                "TOOL_CALLING"
        );
        analyze(q3);
    }

    public SessionDetailDto analyze(AnalysisQueryRequest request) {
        String mode = normalizeMode(request.analysisMode());
        if ("BOTH".equals(mode)) {
            return compare(request);
        }

        String sessionId = newSessionId();
        String createdAt = LocalDateTime.now().withNano(0).toString();

        AnalysisResultDto pipeline = null;
        AnalysisResultDto toolCalling = null;
        double confidence;

        if ("PIPELINE".equals(mode)) {
            pipeline = buildPipelineResult(sessionId, request);
            confidence = pipeline.answer().confidenceScore();
        } else {
            toolCalling = buildToolCallingResult(sessionId, request);
            confidence = toolCalling.answer().confidenceScore();
        }

        SessionRecord record = new SessionRecord(
                sessionId,
                makeTitle(request.query()),
                request.query(),
                mode,
                createdAt,
                confidence,
                pipeline,
                toolCalling
        );
        records.put(sessionId, record);

        return toDetail(record);
    }

    public SessionDetailDto compare(AnalysisQueryRequest request) {
        String groupId = newSessionId();
        String createdAt = LocalDateTime.now().withNano(0).toString();

        AnalysisResultDto pipeline = buildPipelineResult(groupId + "-P", request);
        AnalysisResultDto toolCalling = buildToolCallingResult(groupId + "-T", request);

        double confidence = Math.max(
                pipeline.answer().confidenceScore(),
                toolCalling.answer().confidenceScore()
        );

        SessionRecord record = new SessionRecord(
                groupId,
                makeTitle(request.query()),
                request.query(),
                "BOTH",
                createdAt,
                confidence,
                pipeline,
                toolCalling
        );
        records.put(groupId, record);

        return toDetail(record);
    }

    public List<SessionSummaryDto> getSessions() {
        return records.values().stream()
                .sorted(Comparator.comparing(SessionRecord::createdAt).reversed())
                .map(this::toSummary)
                .toList();
    }

    public SessionDetailDto getSession(String sessionId) {
        SessionRecord record = records.get(sessionId);
        if (record == null) {
            return null;
        }
        return toDetail(record);
    }

    public RetrievalTraceBundleDto getRetrievalTrace(String sessionId) {
        SessionRecord record = records.get(sessionId);
        if (record == null) {
            return null;
        }

        return new RetrievalTraceBundleDto(
                record.sessionId(),
                record.mode(),
                record.pipeline() != null ? record.pipeline().retrievalTrace() : null,
                record.toolCalling() != null ? record.toolCalling().retrievalTrace() : null
        );
    }

    private SessionSummaryDto toSummary(SessionRecord record) {
        return new SessionSummaryDto(
                record.sessionId(),
                record.title(),
                record.queryText(),
                record.createdAt(),
                record.mode(),
                record.confidence()
        );
    }

    private SessionDetailDto toDetail(SessionRecord record) {
        return new SessionDetailDto(
                record.sessionId(),
                record.title(),
                record.queryText(),
                record.mode(),
                record.createdAt(),
                record.pipeline(),
                record.toolCalling()
        );
    }

    private AnalysisResultDto buildPipelineResult(String resultSessionId, AnalysisQueryRequest request) {
        String intent = inferIntent(request.query());

        AnalysisAnswerDto answer = new AnalysisAnswerDto(
                "PIPELINE mode highlights retrieval-grounded evidence and stable reasoning.",
                "The deterministic pipeline first plans source priority, then performs hybrid retrieval with vector and keyword search. "
                        + "After context expansion, overlap removal, and reranking, the final context is sent to the LLM. "
                        + "For the current question, the system emphasizes HBM demand, earnings expectations, and recent price reaction as the main explanation points.",
                scoreFromText(request.query(), 0.80, 0.89),
                "This answer is grounded in retrieval output and stored trace data, but it is still a first-pass analytical summary."
        );

        List<CitationDto> citations = List.of(
                new CitationDto("doc-1001", "SK hynix earnings note", "Mirae Asset", "2026-03-11T09:00:00", null),
                new CitationDto("doc-1002", "Semiconductor market brief", "Reuters", "2026-03-12T08:30:00", null)
        );

        List<ToolTraceDto> tools = List.of(
                new ToolTraceDto("fallbackHybridRetrieval", "SUCCESS"),
                new ToolTraceDto("neighborChunkExpansion", "SUCCESS"),
                new ToolTraceDto("adjacentHitMerge", "SUCCESS"),
                new ToolTraceDto("lightweightReranker", "SUCCESS"),
                new ToolTraceDto("springAiChatClient", "SUCCESS")
        );

        RetrievalTraceDto trace = sampleTrace(request.query());

        return new AnalysisResultDto(
                resultSessionId,
                intent,
                answer,
                citations,
                tools,
                trace
        );
    }

    private AnalysisResultDto buildToolCallingResult(String resultSessionId, AnalysisQueryRequest request) {
        String intent = inferIntent(request.query());

        AnalysisAnswerDto answer = new AnalysisAnswerDto(
                "TOOL_CALLING mode dynamically chooses which data sources are needed.",
                "The LLM reads the question and decides which tools to call. "
                        + "For this request it typically calls context retrieval first, then price summary, and then financial summary if the question needs fundamental support. "
                        + "This mode is more flexible for mixed questions, but less deterministic than the pipeline path.",
                scoreFromText(request.query(), 0.72, 0.82),
                "Tool-calling mode is intentionally more adaptive. The exact sequence of tools may vary for similar questions."
        );

        List<CitationDto> citations = List.of(
                new CitationDto("doc-2001", "Tool-selected market context", "Internal Retrieval", "2026-03-13T10:10:00", null)
        );

        List<ToolTraceDto> tools = List.of(
                new ToolTraceDto("toolCallingAgent", "SUCCESS"),
                new ToolTraceDto("searchRelevantContexts", "SUCCESS"),
                new ToolTraceDto("getPriceSummary", "SUCCESS"),
                new ToolTraceDto("getFinancialSummary", "SUCCESS"),
                new ToolTraceDto("springAiChatClient", "SUCCESS")
        );

        RetrievalTraceDto trace = null;

        return new AnalysisResultDto(
                resultSessionId,
                intent,
                answer,
                citations,
                tools,
                trace
        );
    }

    private RetrievalTraceDto sampleTrace(String query) {
        return new RetrievalTraceDto(
                List.of(
                        new RetrievalTraceDto.SourceFallbackTrace("REPORT", 2, true),
                        new RetrievalTraceDto.SourceFallbackTrace("NEWS", 3, true)
                ),
                List.of(
                        new RetrievalTraceDto.HybridRetrievedChunkTrace(
                                "chunk-1", "doc-1001", "SK hynix earnings note", 4, 0.8211, 0.7142, 0.7783
                        ),
                        new RetrievalTraceDto.HybridRetrievedChunkTrace(
                                "chunk-2", "doc-1002", "Semiconductor market brief", 2, 0.7441, 0.6882, 0.7217
                        )
                ),
                List.of(
                        new RetrievalTraceDto.ExpandedChunkTrace(
                                "chunk-1", "doc-1001", "SK hynix earnings note", 4, List.of(3, 4, 5)
                        ),
                        new RetrievalTraceDto.ExpandedChunkTrace(
                                "chunk-2", "doc-1002", "Semiconductor market brief", 2, List.of(1, 2, 3)
                        )
                ),
                List.of(
                        new RetrievalTraceDto.MergedContextTrace(
                                "doc-1001", "SK hynix earnings note", List.of("chunk-1"), List.of(4), List.of(3, 4, 5), 0.7783
                        ),
                        new RetrievalTraceDto.MergedContextTrace(
                                "doc-1002", "Semiconductor market brief", List.of("chunk-2"), List.of(2), List.of(1, 2, 3), 0.7217
                        )
                ),
                List.of(
                        new RetrievalTraceDto.RerankedContextTrace(
                                "doc-1001",
                                "SK hynix earnings note",
                                List.of(3, 4, 5),
                                0.7783,
                                0.8512,
                                "HBM demand remains the strongest driver. Margin expectations improved after the latest earnings note and recent market commentary."
                        ),
                        new RetrievalTraceDto.RerankedContextTrace(
                                "doc-1002",
                                "Semiconductor market brief",
                                List.of(1, 2, 3),
                                0.7217,
                                0.7341,
                                "Semiconductor sentiment improved as AI server demand stayed strong and HBM-related suppliers benefited from renewed investor interest."
                        )
                )
        );
    }

    private String inferIntent(String query) {
        if (query == null) {
            return "GENERAL_QA";
        }
        String lower = query.toLowerCase(Locale.ROOT);
        if (lower.contains("earnings") || lower.contains("실적")) {
            return "EARNINGS_INTERPRETATION";
        }
        if (lower.contains("why") || lower.contains("영향")) {
            return "EVENT_IMPACT_ANALYSIS";
        }
        if (lower.contains("compare") || lower.contains("비교")) {
            return "COMPANY_COMPARISON";
        }
        return "STOCK_ANALYSIS";
    }

    private double scoreFromText(String text, double min, double max) {
        int base = Math.abs(text == null ? 0 : text.hashCode());
        double normalized = (base % 1000) / 1000.0;
        double value = min + (max - min) * normalized;
        return Math.round(value * 100.0) / 100.0;
    }

    private String normalizeMode(String mode) {
        if (mode == null || mode.isBlank()) {
            return "PIPELINE";
        }
        String upper = mode.toUpperCase(Locale.ROOT);
        if ("TOOL_CALLING".equals(upper) || "BOTH".equals(upper)) {
            return upper;
        }
        return "PIPELINE";
    }

    private String newSessionId() {
        return "s-" + UUID.randomUUID().toString().substring(0, 8);
    }

    private String makeTitle(String query) {
        if (query == null || query.isBlank()) {
            return "Analysis Session";
        }
        return query.length() <= 28 ? query : query.substring(0, 28) + "...";
    }

    private record SessionRecord(
            String sessionId,
            String title,
            String queryText,
            String mode,
            String createdAt,
            double confidence,
            AnalysisResultDto pipeline,
            AnalysisResultDto toolCalling
    ) {}
}
