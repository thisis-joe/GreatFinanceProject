package com.example.financeconsole.dto;

public record RetrievalTraceBundleDto(
        String sessionId,
        String mode,
        RetrievalTraceDto pipeline,
        RetrievalTraceDto toolCalling
) {
}
