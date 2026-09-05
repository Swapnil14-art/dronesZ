package com.dronestore.system.dto;

import java.util.List;

public class ReorderSectionsRequest {

    private List<Long> sectionIds;

    public ReorderSectionsRequest() {
    }

    public List<Long> getSectionIds() {
        return sectionIds;
    }

    public void setSectionIds(List<Long> sectionIds) {
        this.sectionIds = sectionIds;
    }
}
