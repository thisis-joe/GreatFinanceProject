package com.example.financeconsole.dto;

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
