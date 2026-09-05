package com.dronestore.system.dto;

import javax.validation.constraints.NotNull;
import java.util.List;

public class ReorderImagesRequest {

    @NotNull(message = "Image IDs list cannot be null")
    private List<Long> imageIds;

    public ReorderImagesRequest() {
    }

    public ReorderImagesRequest(List<Long> imageIds) {
        this.imageIds = imageIds;
    }

    public List<Long> getImageIds() {
        return imageIds;
    }

    public void setImageIds(List<Long> imageIds) {
        this.imageIds = imageIds;
    }
}
