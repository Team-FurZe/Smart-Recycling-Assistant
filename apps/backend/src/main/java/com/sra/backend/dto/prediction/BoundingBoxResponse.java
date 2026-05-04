package com.sra.backend.dto.prediction;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BoundingBoxResponse {
    private double x;
    private double y;
    private double width;
    private double height;
}