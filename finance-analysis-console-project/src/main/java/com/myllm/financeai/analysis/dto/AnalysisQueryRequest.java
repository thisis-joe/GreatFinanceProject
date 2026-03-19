package com.myllm.financeai.analysis.dto;

public record AnalysisQueryRequest(
        String query,
        String market,
        String ticker,
        String timeFrom,
        String timeTo,
        Boolean saveResult,
        String analysisMode
) {
}
