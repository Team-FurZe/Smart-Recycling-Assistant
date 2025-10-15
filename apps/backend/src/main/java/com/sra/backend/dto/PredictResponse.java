package com.sra.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data @AllArgsConstructor @NoArgsConstructor
public class PredictResponse {
  private String label;
  private double confidence;
  private String binColor;
  private List<String> tips;
}
