package com.sra.backend.controller;

import com.sra.backend.dto.PredictResponse;
import com.sra.backend.service.PredictService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class PredictController {

  private final PredictService service;

  @GetMapping("/health")
  public Object health() {
    return java.util.Map.of("status", "ok");
  }

  @PostMapping(value = "/predict", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public PredictResponse predict(@RequestPart("file") MultipartFile file) {
    return service.predict(file);
  }
}
