package com.sra.backend.dto.history;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class HistoryItemResponse {
    private Long id;
    private String originalFileName;
    private String storedImagePath;
    private String imageUrl;
    private String predictionJson;
    private String createdAt;
}