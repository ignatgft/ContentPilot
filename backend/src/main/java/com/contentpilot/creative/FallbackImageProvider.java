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

        // Determine color palette based on style/tone
        Color bgTop = new Color(24, 20, 24);
        Color bgBottom = new Color(10, 8, 12);
        Color accentGlow = new Color(245, 158, 11, 40); // amber
        Color lightGlow = new Color(255, 237, 213, 80);

        String style = request.getStyle() != null ? request.getStyle().toUpperCase() : "COFFEE_AESTHETIC";
        if (style.contains("COFFEE") || style.contains("WARM")) {
            bgTop = new Color(44, 26, 18);
            bgBottom = new Color(18, 10, 7);
            accentGlow = new Color(217, 119, 6, 70);
            lightGlow = new Color(254, 243, 199, 90);
        } else if (style.contains("DARK") || style.contains("LUXURY")) {
            bgTop = new Color(15, 23, 42);
            bgBottom = new Color(2, 6, 23);
            accentGlow = new Color(99, 102, 241, 60);
            lightGlow = new Color(224, 231, 255, 80);
        } else if (style.contains("POP") || style.contains("VIBRANT")) {
            bgTop = new Color(49, 10, 56);
            bgBottom = new Color(15, 5, 20);
            accentGlow = new Color(236, 72, 153, 70);
            lightGlow = new Color(253, 224, 71, 90);
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

        // 4. Stylized centerpiece (cup / product visual container)
        int cupCenterY = (int) (height * 0.46);
        int cupRadius = (int) (Math.min(width, height) * 0.22);
        
        // Aura around item
        RadialGradientPaint cupAura = new RadialGradientPaint(
                new Point2D.Float(width * 0.5f, cupCenterY),
                cupRadius * 1.5f,
                new float[]{0.0f, 0.8f, 1.0f},
                new Color[]{new Color(255, 255, 255, 70), new Color(245, 158, 11, 30), new Color(0, 0, 0, 0)}
        );
        g2.setPaint(cupAura);
        g2.fillOval(width / 2 - (int)(cupRadius * 1.5), cupCenterY - (int)(cupRadius * 1.5), (int)(cupRadius * 3), (int)(cupRadius * 3));

        // Render sleek glass/ceramic cup shape
        int cupW = (int) (cupRadius * 1.5);
        int cupH = (int) (cupRadius * 1.8);
        int cupLeft = width / 2 - cupW / 2;
        int cupTop = cupCenterY - cupH / 2;

        GradientPaint glassPaint = new GradientPaint(
                cupLeft, cupTop, new Color(255, 255, 255, 75),
                cupLeft + cupW, cupTop + cupH, new Color(255, 255, 255, 20)
        );
        g2.setPaint(glassPaint);
        g2.fillRoundRect(cupLeft, cupTop, cupW, cupH, 36, 36);
        g2.setColor(new Color(255, 255, 255, 110));
        g2.setStroke(new BasicStroke(2.0f));
        g2.drawRoundRect(cupLeft, cupTop, cupW, cupH, 36, 36);

        // Coffee / drink layer inside
        int drinkMargin = 12;
        int drinkW = cupW - drinkMargin * 2;
        int drinkH = cupH - drinkMargin * 2 - 20;
        int drinkLeft = cupLeft + drinkMargin;
        int drinkTop = cupTop + drinkMargin + 20;

        Color drinkTopCol = new Color(217, 119, 6, 220); // crema
        Color drinkBottomCol = new Color(69, 26, 3, 240); // espresso
        GradientPaint drinkPaint = new GradientPaint(drinkLeft, drinkTop, drinkTopCol, drinkLeft, drinkTop + drinkH, drinkBottomCol);
        g2.setPaint(drinkPaint);
        g2.fillRoundRect(drinkLeft, drinkTop, drinkW, drinkH, 24, 24);

        // Latte art heart / spiral pattern
        g2.setColor(new Color(255, 250, 240, 210));
        g2.setStroke(new BasicStroke(4.0f, BasicStroke.CAP_ROUND, BasicStroke.JOIN_ROUND));
        int artCX = width / 2;
        int artCY = drinkTop + drinkH / 3;
        g2.drawArc(artCX - 24, artCY - 20, 24, 30, 0, 180);
        g2.drawArc(artCX, artCY - 20, 24, 30, 0, 180);
        g2.drawLine(artCX - 24, artCY - 5, artCX, artCY + 22);
        g2.drawLine(artCX + 24, artCY - 5, artCX, artCY + 22);

        // Subtle rising steam curves
        g2.setColor(new Color(255, 255, 255, 60));
        g2.setStroke(new BasicStroke(3.0f, BasicStroke.CAP_ROUND, BasicStroke.JOIN_ROUND));
        g2.drawArc(width / 2 - 16, cupTop - 50, 32, 45, -45, 120);
        g2.drawArc(width / 2 + 8, cupTop - 80, 28, 40, -45, 120);

        // Subtitle / Prompt badge watermark
        String brandTitle = request.getBrandName() != null ? request.getBrandName() : "CONTENTPILOT CREATIVE";
        g2.setFont(new Font("SansSerif", Font.BOLD, Math.max(14, width / 45)));
        FontMetrics fm = g2.getFontMetrics();
        int textW = fm.stringWidth(brandTitle);
        g2.setColor(new Color(255, 255, 255, 160));
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
