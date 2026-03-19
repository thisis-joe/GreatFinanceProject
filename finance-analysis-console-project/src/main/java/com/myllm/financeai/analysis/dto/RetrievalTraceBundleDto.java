package com.myllm.financeai.analysis.dto;

public record RetrievalTraceBundleDto(
        String sessionId,
        String mode,
        RetrievalTraceDto pipeline,
        RetrievalTraceDto toolCalling
) {
}
