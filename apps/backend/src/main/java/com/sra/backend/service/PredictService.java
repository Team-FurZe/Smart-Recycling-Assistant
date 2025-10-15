package com.sra.backend.service;

import com.sra.backend.dto.PredictResponse;
import com.sra.backend.entity.Prediction;
import com.sra.backend.repository.PredictionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PredictService {

  @Value("${ai.url}")
  private String aiUrl;

  private final PredictionRepository repo;
  private final RestTemplate http;

  public PredictResponse predict(MultipartFile file) {
    // 1) Görseli AI servisine multipart olarak ilet
    MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
    body.add("file", new MultipartInputResource(file));

    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.MULTIPART_FORM_DATA);

    ResponseEntity<Map> resp = http.postForEntity(
        aiUrl + "/predict",
        new HttpEntity<>(body, headers),
        Map.class
    );

    if (!resp.getStatusCode().is2xxSuccessful() || resp.getBody() == null) {
      throw new RuntimeException("AI service error");
    }

    String label = String.valueOf(resp.getBody().get("label"));
    double confidence = Double.parseDouble(String.valueOf(resp.getBody().get("confidence")));

    // 2) DB'ye kaydet
    var p = new Prediction();
    p.setLabel(label);
    p.setConfidence(confidence);
    repo.save(p);

    // 3) Zenginleştir: çöp kutusu rengi + kısa ipuçları (şimdilik hard-coded)
    String binColor = switch (label) {
      case "plastic" -> "yellow";
      case "paper", "cardboard" -> "blue";
      case "glass" -> "green";
      case "metal" -> "gray";
      case "organic" -> "brown";
      default -> "black";
    };

    List<String> tips = switch (label) {
      case "plastic" -> List.of("Rinse bottles", "Remove caps if required");
      case "paper" -> List.of("Keep dry", "No greasy paper");
      case "glass" -> List.of("Remove lids", "Avoid broken glass");
      case "metal" -> List.of("Flatten cans", "No paint cans");
      case "organic" -> List.of("Compost if available");
      default -> List.of("Check local rules");
    };

    return new PredictResponse(label, confidence, binColor, tips);
  }

  // MultipartFile'i RestTemplate'e InputStreamResource olarak sarmalayan yardımcı sınıf
  static class MultipartInputResource extends InputStreamResource {
    private final String filename;
    MultipartInputResource(MultipartFile f) {
      super(getStream(f));
      this.filename = f.getOriginalFilename();
    }
    private static InputStream getStream(MultipartFile f) {
      try { return f.getInputStream(); } catch (Exception e) { throw new RuntimeException(e); }
    }
    @Override public String getFilename() { return filename != null ? filename : "image.jpg"; }
    @Override public long contentLength() { return -1; } // gerekli değil
  }
}
