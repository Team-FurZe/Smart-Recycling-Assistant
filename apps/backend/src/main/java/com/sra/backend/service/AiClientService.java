package com.sra.backend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sra.backend.dto.prediction.PredictionResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Service
@RequiredArgsConstructor
public class AiClientService {

    @Value("${ai.url}")
    private String aiUrl;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public PredictionResponse predict(MultipartFile file) {
        try {
            ByteArrayResource fileResource = new ByteArrayResource(file.getBytes()) {
                @Override
                public String getFilename() {
                    return file.getOriginalFilename();
                }

                @Override
                public long contentLength() {
                    return file.getSize();
                }
            };

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", fileResource);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            HttpEntity<MultiValueMap<String, Object>> requestEntity =
                    new HttpEntity<>(body, headers);

            String targetUrl = aiUrl + "/yolo/predict";

            ResponseEntity<String> response = restTemplate.postForEntity(
                    targetUrl,
                    requestEntity,
                    String.class
            );

            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                throw new RuntimeException("AI service returned an invalid response.");
            }

            return objectMapper.readValue(response.getBody(), PredictionResponse.class);

        } catch (HttpStatusCodeException ex) {
            throw new RuntimeException("AI service request failed: " + ex.getResponseBodyAsString(), ex);
        } catch (JsonProcessingException ex) {
            throw new RuntimeException("AI response could not be parsed.", ex);
        } catch (IOException ex) {
            throw new RuntimeException("AI request failed while reading file.", ex);
        } catch (Exception ex) {
            throw new RuntimeException("AI service request failed.", ex);
        }
    }

    public String toJson(PredictionResponse response) {
        try {
            return objectMapper.writeValueAsString(response);
        } catch (JsonProcessingException ex) {
            throw new RuntimeException("Prediction response could not be serialized.", ex);
        }
    }
}