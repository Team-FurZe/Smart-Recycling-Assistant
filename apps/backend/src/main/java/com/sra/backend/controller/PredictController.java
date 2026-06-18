package com.sra.backend.controller;

import com.sra.backend.dto.prediction.PredictionResponse;
import com.sra.backend.service.PredictionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.core.Authentication;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class PredictController {

    private final PredictionService predictionService;

    @PostMapping(
            value = "/predict",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public PredictionResponse predict(
            @RequestPart("file") MultipartFile file,
            Authentication authentication
    ) {
        return predictionService.predictAndSave(file, authentication.getName());
    }

    @PostMapping(
            value = "/predict/live",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public PredictionResponse predictLive(@RequestPart("file") MultipartFile file) {
        return predictionService.predictOnly(file);
    }

    @GetMapping("/health")
    public String health() {
        return "{\"status\":\"ok\"}";
    }
}
