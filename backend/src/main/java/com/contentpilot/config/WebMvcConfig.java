package com.contentpilot.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.File;
import java.nio.file.Paths;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Value("${app.creative.storage-dir:./uploads/creative}")
    private String storageDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        File uploadFolder = new File(storageDir);
        if (!uploadFolder.exists()) {
            uploadFolder.mkdirs();
        }
        String absolutePath = Paths.get(storageDir).toAbsolutePath().toUri().toString();
        if (!absolutePath.endsWith("/")) {
            absolutePath += "/";
        }

        registry.addResourceHandler("/uploads/creative/**")
                .addResourceLocations(absolutePath);
    }
}
