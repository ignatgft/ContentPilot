package com.contentpilot.creative;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.geom.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;

@Slf4j
@Component
public class FallbackImageProvider implements ImageGenerationProvider {

    @Override
    public String getProviderName() {
        return "BUILTIN_CREATIVE_ENGINE";
    }

    @Override
    public boolean isAvailable() {
        return true;
    }

    @Override
    public ImageGenerationResult generateImage(ImageGenerationRequest request) throws Exception {
        log.info("Generating creative visual via Builtin Engine: {}", request.getPrompt());

        int width = 1080;
        int height = 1080;
        if ("9:16".equals(request.getAspectRatio())) {
            width = 1080;
            height = 1920;
        } else if ("16:9".equals(request.getAspectRatio())) {
            width = 1920;
            height = 1080;
        } else if ("4:5".equals(request.getAspectRatio())) {
            width = 1080;
            height = 1350;
        }

        BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D g2 = image.createGraphics();

        // Enable highest rendering quality
        g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g2.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
        g2.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);
        g2.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);

        // Determine color palette based on style/tone (brand-neutral studio compositions)
        String style = request.getStyle() != null ? request.getStyle().toUpperCase() : "STUDIO_COMMERCIAL";

        Color bgTop;
        Color bgBottom;
        Color accentGlow;
        Color lightGlow;
        Color accentSolid;
        boolean lightBackdrop;

        if (style.contains("COFFEE") || style.contains("WARM")) {
            bgTop = new Color(44, 26, 18);
            bgBottom = new Color(18, 10, 7);
            accentGlow = new Color(217, 119, 6, 70);
            lightGlow = new Color(254, 243, 199, 90);
            accentSolid = new Color(217, 119, 6, 220);
            lightBackdrop = false;
        } else if (style.contains("DARK") || style.contains("LUXURY")) {
            bgTop = new Color(15, 23, 42);
            bgBottom = new Color(2, 6, 23);
            accentGlow = new Color(99, 102, 241, 60);
            lightGlow = new Color(224, 231, 255, 80);
            accentSolid = new Color(99, 102, 241, 220);
            lightBackdrop = false;
        } else if (style.contains("POP") || style.contains("VIBRANT")) {
            bgTop = new Color(49, 10, 56);
            bgBottom = new Color(15, 5, 20);
            accentGlow = new Color(236, 72, 153, 70);
            lightGlow = new Color(253, 224, 71, 90);
            accentSolid = new Color(236, 72, 153, 220);
            lightBackdrop = false;
        } else if (style.contains("MINIMAL") || style.contains("ECO")) {
            bgTop = new Color(238, 242, 234);
            bgBottom = new Color(214, 222, 210);
            accentGlow = new Color(16, 185, 129, 45);
            lightGlow = new Color(255, 255, 255, 150);
            accentSolid = new Color(16, 185, 129, 220);
            lightBackdrop = true;
        } else { // STUDIO_COMMERCIAL and any unknown style: clean light studio
            bgTop = new Color(246, 243, 238);
            bgBottom = new Color(223, 217, 209);
            accentGlow = new Color(245, 158, 11, 55);
            lightGlow = new Color(255, 255, 255, 150);
            accentSolid = new Color(245, 158, 11, 225);
            lightBackdrop = true;
        }

        // 1. Studio backdrop gradient
        GradientPaint bgGradient = new GradientPaint(0, 0, bgTop, 0, height, bgBottom);
        g2.setPaint(bgGradient);
        g2.fillRect(0, 0, width, height);

        // 2. Atmospheric radial lighting spot (soft spotlight)
        float spotRadius = Math.max(width, height) * 0.7f;
        Point2D spotCenter = new Point2D.Float(width * 0.5f, height * 0.42f);
        RadialGradientPaint spotlight = new RadialGradientPaint(
                spotCenter,
                spotRadius,
                new float[]{0.0f, 0.4f, 1.0f},
                new Color[]{lightGlow, accentGlow, new Color(0, 0, 0, 0)}
        );
        g2.setPaint(spotlight);
        g2.fillRect(0, 0, width, height);

        // 3. Studio pedestal / product platform
        int platformY = (int) (height * 0.68);
        int platformWidth = (int) (width * 0.75);
        int platformHeight = (int) (height * 0.12);
        int platformX = (width - platformWidth) / 2;

        // Platform soft shadow
        g2.setColor(new Color(0, 0, 0, 140));
        g2.fillOval(platformX - 30, platformY + platformHeight / 2, platformWidth + 60, platformHeight + 40);

        // Platform surface
        GradientPaint platformPaint = new GradientPaint(
                platformX, platformY, new Color(255, 255, 255, 35),
                platformX, platformY + platformHeight, new Color(255, 255, 255, 10)
        );
        g2.setPaint(platformPaint);
        g2.fillRoundRect(platformX, platformY, platformWidth, platformHeight, 40, 40);
        g2.setColor(new Color(255, 255, 255, 40));
        g2.setStroke(new BasicStroke(1.5f));
        g2.drawRoundRect(platformX, platformY, platformWidth, platformHeight, 40, 40);

        // 4. Stylized product centerpiece (neutral packaging silhouette on the pedestal)
        int centerY = (int) (height * 0.44);
        int radius = (int) (Math.min(width, height) * 0.22);

        // Aura around the product
        RadialGradientPaint aura = new RadialGradientPaint(
                new Point2D.Float(width * 0.5f, centerY),
                radius * 1.5f,
                new float[]{0.0f, 0.8f, 1.0f},
                new Color[]{
                        lightBackdrop ? new Color(255, 255, 255, 160) : new Color(255, 255, 255, 70),
                        new Color(accentSolid.getRed(), accentSolid.getGreen(), accentSolid.getBlue(), 35),
                        new Color(0, 0, 0, 0)
                }
        );
        g2.setPaint(aura);
        g2.fillOval(width / 2 - (int) (radius * 1.5), centerY - (int) (radius * 1.5), radius * 3, radius * 3);

        // Product silhouette: rounded "packaging" body with a cap
        int bodyW = (int) (radius * 1.35);
        int bodyH = (int) (radius * 2.1);
        int bodyLeft = width / 2 - bodyW / 2;
        int bodyTop = centerY - bodyH / 2;

        // Packaging body gradient (glass/bar paper effect)
        GradientPaint bodyPaint = new GradientPaint(
                bodyLeft, bodyTop, new Color(255, 255, 255, 235),
                bodyLeft + bodyW, bodyTop + bodyH, new Color(255, 255, 255, 165)
        );
        g2.setPaint(bodyPaint);
        g2.fillRoundRect(bodyLeft, bodyTop, bodyW, bodyH, 30, 30);
        g2.setColor(new Color(0, 0, 0, 45)); // soft outline (works on light bg)
        g2.setStroke(new BasicStroke(2.0f));
        g2.drawRoundRect(bodyLeft, bodyTop, bodyW, bodyH, 30, 30);

        // Accent label band across the body
        int bandH = (int) (bodyH * 0.34);
        int bandY = bodyTop + (int) (bodyH * 0.30);
        g2.setPaint(new GradientPaint(
                bodyLeft, bandY, accentSolid,
                bodyLeft, bandY + bandH, new Color(
                        accentSolid.getRed(), accentSolid.getGreen(), accentSolid.getBlue(), 200)
        ));
        g2.fillRoundRect(bodyLeft + 6, bandY, bodyW - 12, bandH, 20, 20);

        // White abstract emblem inside the band
        g2.setColor(new Color(255, 255, 255, 220));
        g2.setStroke(new BasicStroke(4.5f, BasicStroke.CAP_ROUND, BasicStroke.JOIN_ROUND));
        int emCX = width / 2;
        int emCY = bandY + bandH / 2;
        g2.drawOval(emCX - 18, emCY - 18, 36, 36);
        g2.drawLine(emCX, emCY + 3, emCX, emCY - 13);
        g2.drawLine(emCX - 8, emCY + 10, emCX + 8, emCY + 10);

        // Cap on top of the packaging
        int capH = (int) (bodyH * 0.10);
        g2.setColor(new Color(255, 255, 255, 210));
        g2.fillRoundRect(width / 2 - bodyW / 6, bodyTop - capH, bodyW / 3, capH + 4, 12, 12);

        // Soft product reflection under the body
        g2.setColor(new Color(0, 0, 0, 25));
        g2.fillOval(width / 2 - bodyW / 2, bodyTop + bodyH - 6, bodyW, 12);

        // Subtitle / Prompt badge watermark (contrast-aware for light backdrops)
        String brandTitle = request.getBrandName() != null ? request.getBrandName() : "CONTENTPILOT CREATIVE";
        g2.setFont(new Font("SansSerif", Font.BOLD, Math.max(14, width / 45)));
        FontMetrics fm = g2.getFontMetrics();
        int textW = fm.stringWidth(brandTitle);
        g2.setColor(lightBackdrop ? new Color(40, 38, 34, 170) : new Color(255, 255, 255, 160));
        g2.drawString(brandTitle, (width - textW) / 2, (int) (height * 0.88));

        g2.dispose();

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(image, "PNG", baos);

        return ImageGenerationResult.builder()
                .imageBytes(baos.toByteArray())
                .mimeType("image/png")
                .width(width)
                .height(height)
                .providerName(getProviderName())
                .modelName("studio-engine-v1")
                .build();
    }
}
