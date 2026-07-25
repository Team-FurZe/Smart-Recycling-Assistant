package com.sra.backend.dto.prediction;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DetectionResponse {
    private String id;
    private String label;
    private String binColor;
    private double confidence;
    private BoundingBoxResponse bbox;
}