package com.example.financeconsole.dto;

public record SessionDetailDto(
        String sessionId,
        String title,
        String queryText,
        String mode,
        String createdAt,
        AnalysisResultDto pipeline,
        AnalysisResultDto toolCalling
) {
}
