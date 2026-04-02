package com.sra.backend.service;

import com.sra.backend.dto.history.HistoryItemResponse;
import com.sra.backend.entity.PredictionHistory;
import com.sra.backend.entity.User;
import com.sra.backend.repository.PredictionHistoryRepository;
import com.sra.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class HistoryService {

    private final PredictionHistoryRepository predictionHistoryRepository;
    private final UserRepository userRepository;

    @Value("${server.port:8080}")
    private String serverPort;

    @Transactional(readOnly = true)
    public List<HistoryItemResponse> getMyHistory(String email) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new RuntimeException("User not found."));

        return predictionHistoryRepository.findByUserOrderByCreatedAtDesc(user)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public HistoryItemResponse getMyHistoryItem(Long id, String email) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new RuntimeException("User not found."));

        PredictionHistory item = predictionHistoryRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new RuntimeException("History item not found."));

        return mapToResponse(item);
    }

    private HistoryItemResponse mapToResponse(PredictionHistory entity) {
        String normalizedPath = entity.getStoredImagePath() == null
                ? null
                : entity.getStoredImagePath().replace("\\", "/");

        String imageUrl = null;
        if (normalizedPath != null) {
            int uploadsIndex = normalizedPath.indexOf("uploads/");
            if (uploadsIndex >= 0) {
                String relativePath = normalizedPath.substring(uploadsIndex);
                imageUrl = "http://localhost:" + serverPort + "/" + relativePath;
            }
        }

        return HistoryItemResponse.builder()
                .id(entity.getId())
                .originalFileName(entity.getOriginalFileName())
                .storedImagePath(entity.getStoredImagePath())
                .imageUrl(imageUrl)
                .predictionJson(entity.getPredictionJson())
                .createdAt(entity.getCreatedAt().toString())
                .build();
    }
}