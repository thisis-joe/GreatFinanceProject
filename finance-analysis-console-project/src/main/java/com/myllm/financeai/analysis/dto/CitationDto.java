package com.myllm.financeai.analysis.dto;

public record CitationDto(
        String documentId,
        String title,
        String sourceName,
        String publishedAt,
        String url
) {
}
