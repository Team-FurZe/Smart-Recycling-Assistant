package com.sra.backend.service;

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

    private final RestTemplate restTemplate = new RestTemplate();

    public String sendToAiAndGetJson(MultipartFile file) {
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
            System.out.println("AI URL = " + targetUrl);

            ResponseEntity<String> response = restTemplate.postForEntity(
                    targetUrl,
                    requestEntity,
                    String.class
            );

            return response.getBody();

        } catch (HttpStatusCodeException ex) {
            System.out.println("AI ERROR BODY = " + ex.getResponseBodyAsString());
            throw new RuntimeException("AI service request failed: " + ex.getResponseBodyAsString(), ex);
        } catch (IOException ex) {
            throw new RuntimeException("AI request failed while reading file.", ex);
        } catch (Exception ex) {
            throw new RuntimeException("AI service request failed.", ex);
        }
    }
}