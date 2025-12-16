package com.sra.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PredictResponse {
    private String label;
    private double confidence;
    private String binColor;
    private List<String> tips;

    // 🔥 NEW: all class probabilities from AI service
    // Example: { "plastic": 0.12, "glass": 0.78, ... }
    private Map<String, Double> probabilities;
}
