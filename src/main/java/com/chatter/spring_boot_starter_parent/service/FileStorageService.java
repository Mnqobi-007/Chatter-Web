package com.chatter.spring_boot_starter_parent.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class FileStorageService {

    private final Path uploadDir;
    private final long maxSizeBytes;
    private final List<String> allowedExtensions;
    private final List<String> allowedContentTypes;

    public FileStorageService(
            @Value("${file.upload.directory}") String uploadDirectory,
            @Value("${file.upload.max-size}") long maxSizeBytes,
            @Value("${file.upload.allowed-extensions}") String allowedExtensionsCsv,
            @Value("${file.upload.allowed-content-types}") String allowedContentTypesCsv) {
        this.uploadDir = Paths.get(uploadDirectory).toAbsolutePath().normalize();
        this.maxSizeBytes = maxSizeBytes;
        this.allowedExtensions = Arrays.asList(allowedExtensionsCsv.split(","));
        this.allowedContentTypes = Arrays.asList(allowedContentTypesCsv.split(","));

        try {
            Files.createDirectories(this.uploadDir);
        } catch (IOException e) {
            throw new IllegalStateException("Could not create upload directory: " + uploadDir, e);
        }
    }

    public String store(MultipartFile file) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Cannot upload an empty file");
        }
        if (file.getSize() > maxSizeBytes) {
            throw new IllegalArgumentException("File exceeds maximum allowed size");
        }

        String originalName = file.getOriginalFilename();
        if (originalName == null || originalName.isBlank()) {
            throw new IllegalArgumentException("Invalid filename");
        }

        String extension = getExtension(originalName);
        if (!allowedExtensions.contains(extension.toLowerCase())) {
            throw new IllegalArgumentException("File type not allowed: " + extension);
        }

        String contentType = file.getContentType();
        if (contentType == null || !allowedContentTypes.contains(contentType)) {
            throw new IllegalArgumentException("Content type not allowed: " + contentType);
        }

        String storedFilename = UUID.randomUUID() + extension;
        Path destination = uploadDir.resolve(storedFilename).normalize();

        if (!destination.startsWith(uploadDir)) {
            throw new IllegalArgumentException("Invalid file path");
        }

        try {
            Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new IllegalStateException("Failed to store file", e);
        }

        return storedFilename;
    }

    public Path resolve(String storedFilename) {
        Path path = uploadDir.resolve(storedFilename).normalize();
        if (!path.startsWith(uploadDir)) {
            throw new IllegalArgumentException("Invalid file path");
        }
        return path;
    }

    private String getExtension(String filename) {
        int dot = filename.lastIndexOf('.');
        return dot == -1 ? "" : filename.substring(dot);
    }
}
