package com.myllm.financeai.analysis.dto;

public record SessionSummaryDto(
        String sessionId,
        String title,
        String queryText,
        String createdAt,
        String mode,
        double confidence
) {
}
