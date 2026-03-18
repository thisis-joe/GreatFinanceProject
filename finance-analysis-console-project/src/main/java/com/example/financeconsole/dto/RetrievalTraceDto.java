package com.example.financeconsole.dto;

import java.util.List;

public record RetrievalTraceDto(
        List<SourceFallbackTrace> sourceFallbacks,
        List<HybridRetrievedChunkTrace> hybridResults,
        List<ExpandedChunkTrace> expandedResults,
        List<MergedContextTrace> mergedResults,
        List<RerankedContextTrace> rerankedResults
) {
    public record SourceFallbackTrace(
            String sourceType,
            int retrievedCount,
            boolean used
    ) {}

    public record HybridRetrievedChunkTrace(
            String chunkId,
            String documentId,
            String documentTitle,
            int chunkIndex,
            double vectorScore,
            double keywordScore,
            double finalScore
    ) {}

    public record ExpandedChunkTrace(
            String centerChunkId,
            String documentId,
            String documentTitle,
            int centerChunkIndex,
            List<Integer> includedChunkIndexes
    ) {}

    public record MergedContextTrace(
            String documentId,
            String documentTitle,
            List<String> centerChunkIds,
            List<Integer> hitChunkIndexes,
            List<Integer> includedChunkIndexes,
            double hybridScore
    ) {}

    public record RerankedContextTrace(
            String documentId,
            String documentTitle,
            List<Integer> includedChunkIndexes,
            double hybridScore,
            double rerankScore,
            String expandedText
    ) {}
}
