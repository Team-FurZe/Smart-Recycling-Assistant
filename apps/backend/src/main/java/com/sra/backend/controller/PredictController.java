package com.sra.backend.controller;

import com.sra.backend.service.PredictionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class PredictController {

    private final PredictionService predictionService;

    @PostMapping(value = "/predict", consumes = MediaType.MULTIPART_FORM_DATA_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public String predict(@RequestPart("file") MultipartFile file, Authentication authentication) {
        return predictionService.predictAndSave(file, authentication.getName());
    }

    @GetMapping("/health")
    public String health() {
        return "{\"status\":\"ok\"}";
    }
}