package com.example.financeconsole.dto;

public record CitationDto(
        String documentId,
        String title,
        String sourceName,
        String publishedAt,
        String url
) {
}
