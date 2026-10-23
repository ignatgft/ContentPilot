package com.contentpilot.creative;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.geom.RoundRectangle2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;

@Slf4j
@Component
public class CreativeOverlayRenderer {

    public byte[] applyOverlay(byte[] baseImageBytes,
                               String brandName,
                               String price,
                               String badgeText,
                               String ctaText,
                               String position) throws Exception {

        BufferedImage image = ImageIO.read(new ByteArrayInputStream(baseImageBytes));
        if (image == null) {
            return baseImageBytes;
        }

        int width = image.getWidth();
        int height = image.getHeight();

        Graphics2D g2 = image.createGraphics();
        g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g2.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);
        g2.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);

        // Position coordinates
        int pad = Math.max(28, (int) (width * 0.04));
        int badgeX = pad;
        int badgeY = pad;

        // 1. Promo Badge (Top Left / Top Right)
        if (badgeText != null && !badgeText.isBlank()) {
            Font badgeFont = new Font("SansSerif", Font.BOLD, Math.max(16, width / 36));
            g2.setFont(badgeFont);
            FontMetrics bfm = g2.getFontMetrics();
            int bw = bfm.stringWidth(badgeText) + 36;
            int bh = bfm.getHeight() + 16;

            int bX = pad;
            int bY = pad;
            if ("TOP_RIGHT".equalsIgnoreCase(position) || "BOTTOM_RIGHT".equalsIgnoreCase(position)) {
                bX = width - bw - pad;
            }

            // Glow & Shadow
            g2.setColor(new Color(0, 0, 0, 100));
            g2.fillRoundRect(bX + 3, bY + 4, bw, bh, 20, 20);

            // Badge pill background (vibrant amber / brand accent)
            GradientPaint badgeGrad = new GradientPaint(
                    bX, bY, new Color(245, 158, 11),
                    bX + bw, bY + bh, new Color(217, 119, 6)
            );
            g2.setPaint(badgeGrad);
            g2.fillRoundRect(bX, bY, bw, bh, 20, 20);

            // Border
            g2.setColor(new Color(255, 255, 255, 160));
            g2.setStroke(new BasicStroke(1.5f));
            g2.drawRoundRect(bX, bY, bw, bh, 20, 20);

            // Text
            g2.setColor(Color.WHITE);
            int textY = bY + ((bh - bfm.getHeight()) / 2) + bfm.getAscent();
            g2.drawString(badgeText, bX + 18, textY);
        }

        // 2. Bottom Offer Card: Brand Name + Confirmed Price + CTA Button
        boolean hasPrice = price != null && !price.isBlank();
        boolean hasBrand = brandName != null && !brandName.isBlank();
        boolean hasCta = ctaText != null && !ctaText.isBlank();

        if (hasPrice || hasBrand || hasCta) {
            int cardW = Math.min((int) (width * 0.88), 760);
            int cardH = Math.max(90, (int) (height * 0.12));
            int cardX = (width - cardW) / 2;
            int cardY = height - cardH - pad;

            if ("BOTTOM_LEFT".equalsIgnoreCase(position)) {
                cardX = pad;
            } else if ("BOTTOM_RIGHT".equalsIgnoreCase(position)) {
                cardX = width - cardW - pad;
            }

            // Glassmorphism card backdrop with shadow
            g2.setColor(new Color(0, 0, 0, 140));
            g2.fillRoundRect(cardX + 4, cardY + 6, cardW, cardH, 28, 28);

            // Semi-transparent dark blur card surface
            GradientPaint cardPaint = new GradientPaint(
                    cardX, cardY, new Color(18, 18, 24, 215),
                    cardX, cardY + cardH, new Color(10, 10, 14, 235)
            );
            g2.setPaint(cardPaint);
            g2.fillRoundRect(cardX, cardY, cardW, cardH, 28, 28);

            // Sleek border
            g2.setColor(new Color(255, 255, 255, 50));
            g2.setStroke(new BasicStroke(1.5f));
            g2.drawRoundRect(cardX, cardY, cardW, cardH, 28, 28);

            // Content inside card
            int innerLeft = cardX + 24;

            // Brand title
            if (hasBrand) {
                Font brandFont = new Font("SansSerif", Font.BOLD, Math.max(16, width / 44));
                g2.setFont(brandFont);
                FontMetrics bfm = g2.getFontMetrics();
                g2.setColor(new Color(255, 255, 255, 200));
                g2.drawString(brandName.toUpperCase(), innerLeft, cardY + 34);
            }

            // Confirmed Price (Huge, crisp, non-hallucinated!)
            if (hasPrice) {
                Font priceFont = new Font("SansSerif", Font.BOLD, Math.max(26, width / 26));
                g2.setFont(priceFont);
                FontMetrics pfm = g2.getFontMetrics();
                g2.setColor(new Color(245, 158, 11)); // Amber gold
                int pY = hasBrand ? cardY + cardH - 24 : cardY + (cardH + pfm.getAscent()) / 2 - 4;
                g2.drawString(price, innerLeft, pY);
            }

            // CTA Button Pill on the right side of card
            if (hasCta) {
                Font ctaFont = new Font("SansSerif", Font.BOLD, Math.max(15, width / 42));
                g2.setFont(ctaFont);
                FontMetrics cfm = g2.getFontMetrics();
                int ctaW = cfm.stringWidth(ctaText) + 36;
                int ctaH = Math.max(44, (int) (cardH * 0.55));
                int ctaX = cardX + cardW - ctaW - 20;
                int ctaY = cardY + (cardH - ctaH) / 2;

                // CTA Button fill
                GradientPaint btnPaint = new GradientPaint(
                        ctaX, ctaY, new Color(255, 255, 255),
                        ctaX + ctaW, ctaY + ctaH, new Color(240, 240, 245)
                );
                g2.setPaint(btnPaint);
                g2.fillRoundRect(ctaX, ctaY, ctaW, ctaH, 18, 18);

                // CTA text in dark contrast
                g2.setColor(new Color(15, 23, 42));
                int cTextY = ctaY + ((ctaH - cfm.getHeight()) / 2) + cfm.getAscent();
                g2.drawString(ctaText, ctaX + 18, cTextY);
            }
        }

        g2.dispose();

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(image, "PNG", baos);
        return baos.toByteArray();
    }
}
