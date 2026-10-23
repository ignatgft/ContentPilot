package com.contentpilot.publisher;

import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class PublisherRegistry {

    private final Map<String, Publisher> publishers = new HashMap<>();

    public PublisherRegistry(List<Publisher> publisherList) {
        for (Publisher p : publisherList) {
            publishers.put(p.getPlatform().toUpperCase(), p);
        }
    }

    public Publisher getPublisher(String platform) {
        return publishers.get(platform != null ? platform.toUpperCase() : "TELEGRAM");
    }

    public List<PublisherCapabilities> getAllCapabilities() {
        return publishers.values().stream()
                .map(Publisher::capabilities)
                .toList();
    }
}
