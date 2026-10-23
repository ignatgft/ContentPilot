package com.contentpilot.publisher;

import com.contentpilot.post.Post;

import java.util.Map;

public interface Publisher {
    String getPlatform();
    PublisherCapabilities capabilities();
    boolean connect(Long brandId, Map<String, String> credentials);
    boolean publish(Post post);
    Map<String, Integer> fetchMetrics(Post post);
    boolean refreshToken(Long brandId);
}
