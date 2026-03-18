package com.example.financeconsole.dto;

public record SessionSummaryDto(
        String sessionId,
        String title,
        String queryText,
        String createdAt,
        String mode,
        double confidence
) {
}
