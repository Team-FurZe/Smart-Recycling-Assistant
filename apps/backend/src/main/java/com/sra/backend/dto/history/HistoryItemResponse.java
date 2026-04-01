package com.sra.backend.dto.history;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class HistoryItemResponse {
    private Long id;
    private String originalFileName;
    private String storedImagePath;
    private String predictionJson;
    private String createdAt;
}