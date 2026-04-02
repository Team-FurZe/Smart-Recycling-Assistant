package com.sra.backend.service;

import com.sra.backend.dto.prediction.PredictionResponse;
import com.sra.backend.entity.PredictionHistory;
import com.sra.backend.entity.User;
import com.sra.backend.repository.PredictionHistoryRepository;
import com.sra.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class PredictionService {

    private final UserRepository userRepository;
    private final PredictionHistoryRepository predictionHistoryRepository;
    private final FileStorageService fileStorageService;
    private final AiClientService aiClientService;

    public PredictionResponse predictAndSave(MultipartFile file, String email) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new RuntimeException("User not found."));

        String storedImagePath = fileStorageService.saveFile(file);
        PredictionResponse predictionResponse = aiClientService.predict(file);

        PredictionHistory history = PredictionHistory.builder()
                .originalFileName(file.getOriginalFilename() == null ? "unknown" : file.getOriginalFilename())
                .storedImagePath(storedImagePath)
                .predictionJson(aiClientService.toJson(predictionResponse))
                .createdAt(LocalDateTime.now())
                .user(user)
                .build();

        predictionHistoryRepository.save(history);

        return predictionResponse;
    }
}