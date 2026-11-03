package com.contentpilot.canteen.service;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
public class UnitConversionService {

    /**
     * Converts a quantity from fromUnit to toUnit.
     * Compatible pairs:
     * - kg <-> g (1 kg = 1000 g)
     * - l <-> ml (1 l = 1000 ml)
     * - pcs <-> pcs (1:1)
     */
    private String normalize(String unit) {
        if (unit == null) return "";
        String u = unit.trim().toLowerCase();
        return switch (u) {
            case "г", "g", "gram", "grams" -> "g";
            case "кг", "kg", "kilogram", "kilograms" -> "kg";
            case "мл", "ml", "milliliter" -> "ml";
            case "л", "l", "liter", "liters" -> "l";
            case "шт", "pcs", "piece", "pieces" -> "pcs";
            default -> u;
        };
    }

    public BigDecimal convert(BigDecimal quantity, String fromUnit, String toUnit) {
        if (quantity == null) return BigDecimal.ZERO;
        if (fromUnit == null || toUnit == null || fromUnit.equalsIgnoreCase(toUnit)) {
            return quantity;
        }

        String f = normalize(fromUnit);
        String t = normalize(toUnit);

        if (f.equals(t)) {
            return quantity;
        }

        // Weight
        if (f.equals("g") && t.equals("kg")) {
            return quantity.divide(BigDecimal.valueOf(1000), 4, RoundingMode.HALF_UP);
        }
        if (f.equals("kg") && t.equals("g")) {
            return quantity.multiply(BigDecimal.valueOf(1000)).setScale(4, RoundingMode.HALF_UP);
        }

        // Volume
        if (f.equals("ml") && t.equals("l")) {
            return quantity.divide(BigDecimal.valueOf(1000), 4, RoundingMode.HALF_UP);
        }
        if (f.equals("l") && t.equals("ml")) {
            return quantity.multiply(BigDecimal.valueOf(1000)).setScale(4, RoundingMode.HALF_UP);
        }

        // Pieces / Portions
        if (f.equals("pcs") && t.equals("pcs")) {
            return quantity;
        }

        throw new IllegalArgumentException("Несовместимые единицы измерения: невозможно перевести '" + fromUnit + "' в '" + toUnit + "'");
    }

    public boolean areCompatible(String unitA, String unitB) {
        if (unitA == null || unitB == null) return false;
        String a = normalize(unitA);
        String b = normalize(unitB);
        if (a.equals(b)) return true;

        boolean isWeightA = a.equals("kg") || a.equals("g");
        boolean isWeightB = b.equals("kg") || b.equals("g");
        if (isWeightA && isWeightB) return true;

        boolean isVolA = a.equals("l") || a.equals("ml");
        boolean isVolB = b.equals("l") || b.equals("ml");
        if (isVolA && isVolB) return true;

        return a.equals("pcs") && b.equals("pcs");
    }
}
