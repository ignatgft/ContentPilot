package com.contentpilot.publisher;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PublisherCapabilities {
    private String platform;
    private String displayName;
    private int maxTextLength;
    private List<String> supportedMediaTypes; // TEXT, IMAGE, VIDEO
    private boolean requiresPublicMediaUrl;
    private boolean requiresAppAudit;
    private boolean livePublishSupported;
    private String auditNotice;
}
