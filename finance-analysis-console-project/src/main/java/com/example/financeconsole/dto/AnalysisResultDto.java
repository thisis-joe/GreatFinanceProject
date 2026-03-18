package com.example.financeconsole.dto;

import java.util.List;

public record AnalysisResultDto(
        String sessionId,
        String queryIntent,
        AnalysisAnswerDto answer,
        List<CitationDto> citations,
        List<ToolTraceDto> toolTrace,
        RetrievalTraceDto retrievalTrace
) {
}
