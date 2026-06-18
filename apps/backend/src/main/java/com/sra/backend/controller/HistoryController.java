package com.sra.backend.controller;

import com.sra.backend.dto.history.HistoryItemResponse;
import com.sra.backend.service.HistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/history")
@RequiredArgsConstructor
public class HistoryController {

    private final HistoryService historyService;

    @GetMapping("/me")
    public List<HistoryItemResponse> getMyHistory(Authentication authentication) {
        return historyService.getMyHistory(authentication.getName());
    }

    @GetMapping("/{id}")
    public HistoryItemResponse getMyHistoryItem(@PathVariable Long id, Authentication authentication) {
        return historyService.getMyHistoryItem(id, authentication.getName());
    }

    @DeleteMapping("/me")
    public void clearMyHistory(Authentication authentication) {
        historyService.clearMyHistory(authentication.getName());
    }
}
