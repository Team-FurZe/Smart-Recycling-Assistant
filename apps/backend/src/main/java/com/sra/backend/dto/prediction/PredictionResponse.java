package com.sra.backend.dto.prediction;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PredictionResponse {
    private int imageWidth;
    private int imageHeight;
    private boolean noWaste;
    private List<DetectionResponse> detections;
}