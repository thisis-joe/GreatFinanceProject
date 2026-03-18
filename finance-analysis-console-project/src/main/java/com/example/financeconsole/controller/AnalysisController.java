package com.example.financeconsole.controller;

import com.example.financeconsole.api.ApiResponse;
import com.example.financeconsole.dto.AnalysisQueryRequest;
import com.example.financeconsole.dto.RetrievalTraceBundleDto;
import com.example.financeconsole.dto.SessionDetailDto;
import com.example.financeconsole.dto.SessionSummaryDto;
import com.example.financeconsole.service.AnalysisService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/analysis")
@CrossOrigin
public class AnalysisController {

    private final AnalysisService analysisService;

    public AnalysisController(AnalysisService analysisService) {
        this.analysisService = analysisService;
    }

    @PostMapping("/query")
    public ApiResponse<SessionDetailDto> analyze(@RequestBody AnalysisQueryRequest request) {
        return ApiResponse.success(analysisService.analyze(request));
    }

    @PostMapping("/compare")
    public ApiResponse<SessionDetailDto> compare(@RequestBody AnalysisQueryRequest request) {
        return ApiResponse.success(analysisService.compare(request));
    }

    @GetMapping("/sessions")
    public ApiResponse<List<SessionSummaryDto>> sessions() {
        return ApiResponse.success(analysisService.getSessions());
    }

    @GetMapping("/sessions/{sessionId}")
    public ResponseEntity<ApiResponse<SessionDetailDto>> session(@PathVariable String sessionId) {
        SessionDetailDto detail = analysisService.getSession(sessionId);
        if (detail == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.success(null, "Session not found"));
        }
        return ResponseEntity.ok(ApiResponse.success(detail));
    }

    @GetMapping("/sessions/{sessionId}/retrieval-trace")
    public ResponseEntity<ApiResponse<RetrievalTraceBundleDto>> retrievalTrace(@PathVariable String sessionId) {
        RetrievalTraceBundleDto dto = analysisService.getRetrievalTrace(sessionId);
        if (dto == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.success(null, "Session not found"));
        }
        return ResponseEntity.ok(ApiResponse.success(dto));
    }
}
