package com.myllm.financeai.analysis.dto;

public record AnalysisAnswerDto(
        String summary,
        String fullText,
        double confidenceScore,
        String uncertaintyNote
) {
}
