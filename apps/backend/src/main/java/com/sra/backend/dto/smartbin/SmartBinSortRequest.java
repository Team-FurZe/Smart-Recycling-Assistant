package com.sra.backend.dto.smartbin;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SmartBinSortRequest {
    @NotBlank(message = "Label is required.")
    private String label;
}
