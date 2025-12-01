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
import java.util.HashMap;   // ✅ NEW
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

    // 🔹 Cevabı daha rahat okumak için cast edelim
    @SuppressWarnings("unchecked")
    Map<String, Object> respBody = resp.getBody();

    // 🔹 Temel alanlar
    String label = String.valueOf(respBody.get("class"));

    Object confidenceObj = respBody.get("confidence");
    double confidence = confidenceObj != null
        ? Double.parseDouble(String.valueOf(confidenceObj))
        : 0.0;

    Object binColorObj = respBody.get("bin_color");
    String binColor = binColorObj != null
        ? String.valueOf(binColorObj)
        : null; // no_waste / uncertain durumunda null olabilir

    // 🔹 NEW: probabilities alanını oku
    Map<String, Double> probabilities = new HashMap<>();

    Object probsObj = respBody.get("probabilities");
    if (probsObj instanceof Map<?, ?> probsMap) {
      for (Map.Entry<?, ?> entry : probsMap.entrySet()) {
        String key = String.valueOf(entry.getKey());
        Object value = entry.getValue();

        if (value instanceof Number num) {
          probabilities.put(key, num.doubleValue());
        } else if (value != null) {
          try {
            probabilities.put(key, Double.parseDouble(value.toString()));
          } catch (NumberFormatException ignored) {
            // parse edemezsek o key'i atlıyoruz
          }
        }
      }
    }

    // 2) DB'ye kaydet (şimdilik sadece temel bilgiler)
    var p = new Prediction();
    p.setLabel(label);
    p.setConfidence(confidence);
    p.setBinColor(binColor);
    repo.save(p);

    // 3) Basit tips mantığı
    List<String> tips = switch (label) {
      case "plastic" -> List.of("Rinse bottles", "Remove caps if required");
      case "paper" -> List.of("Keep dry", "No greasy paper");
      case "glass" -> List.of("Remove lids", "Avoid broken glass");
      case "metal" -> List.of("Flatten cans", "No paint cans");
      case "organic" -> List.of("Compost if available");
      default -> List.of("Check local rules");
    };

    // 4) PredictResponse'e probabilities'i de ekleyerek dön
    return new PredictResponse(label, confidence, binColor, tips, probabilities);
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
