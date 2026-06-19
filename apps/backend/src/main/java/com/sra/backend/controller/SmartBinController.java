package com.sra.backend.controller;

import com.sra.backend.dto.smartbin.SmartBinSortRequest;
import com.sra.backend.dto.smartbin.SmartBinSortResponse;
import com.sra.backend.service.SmartBinService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/smart-bin")
@RequiredArgsConstructor
public class SmartBinController {

    private final SmartBinService smartBinService;

    @PostMapping(
            value = "/sort",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public SmartBinSortResponse sort(@Valid @RequestBody SmartBinSortRequest request) {
        smartBinService.sort(request.getLabel());
        return new SmartBinSortResponse("Detection is sent to Smart Recycling Bin.");
    }
}
