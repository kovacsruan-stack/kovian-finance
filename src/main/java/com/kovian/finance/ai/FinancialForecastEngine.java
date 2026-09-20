package com.kovian.finance.ai;

import java.math.BigDecimal;
import java.util.List;

/** Deterministic, bounded forecast primitive. It never mutates financial source-of-truth data. */
public final class FinancialForecastEngine {
    public record Point(String period, BigDecimal value) {}
    public record Forecast(List<Point> points, double confidence) {}
    public Forecast forecast(List<Point> history, int horizon) {
        if (history == null || history.size() < 2 || horizon < 1 || horizon > 365) throw new IllegalArgumentException("Invalid forecast bounds");
        var previous = history.get(history.size() - 2).value();
        var last = history.get(history.size() - 1).value();
        var delta = last.subtract(previous);
        var points = new java.util.ArrayList<Point>();
        var value = last;
        for (int i = 1; i <= horizon; i++) { value = value.add(delta); points.add(new Point("t+" + i, value)); }
        double confidence = Math.max(0.10, Math.min(0.95, 1.0 / (1.0 + delta.abs().doubleValue() / (last.abs().doubleValue() + 1.0))));
        return new Forecast(List.copyOf(points), confidence);
    }
}
