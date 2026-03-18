package com.example.financeconsole.dto;

public record AnalysisAnswerDto(
        String summary,
        String fullText,
        double confidenceScore,
        String uncertaintyNote
) {
}
