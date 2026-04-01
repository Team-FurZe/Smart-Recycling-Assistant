package com.sra.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.UUID;

@Service
public class FileStorageService {

    @Value("${app.upload.dir}")
    private String uploadDir;

    public String saveFile(MultipartFile file) {
        try {
            Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(uploadPath);

            String originalName = StringUtils.cleanPath(file.getOriginalFilename() == null ? "image.jpg" : file.getOriginalFilename());
            String extension = "";

            int lastDot = originalName.lastIndexOf('.');
            if (lastDot >= 0) {
                extension = originalName.substring(lastDot);
            }

            String storedName = UUID.randomUUID() + extension;
            Path target = uploadPath.resolve(storedName);

            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

            return "/uploads/" + storedName;
        } catch (IOException ex) {
            throw new RuntimeException("File could not be saved.", ex);
        }
    }
}