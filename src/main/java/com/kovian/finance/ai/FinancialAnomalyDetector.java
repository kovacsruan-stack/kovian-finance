package com.kovian.finance.ai;

import java.math.BigDecimal;
import java.util.List;

/** Flags large deviations without changing transactions. */
public final class FinancialAnomalyDetector {
    public record Result(boolean anomalous, BigDecimal deviation) {}
    public Result detect(List<BigDecimal> history, BigDecimal current, BigDecimal multiplier) {
        if (history == null || history.isEmpty() || current == null || multiplier == null || multiplier.signum() <= 0) throw new IllegalArgumentException("Invalid anomaly input");
        var avg = history.stream().reduce(BigDecimal.ZERO, BigDecimal::add).divide(BigDecimal.valueOf(history.size()), java.math.MathContext.DECIMAL64);
        var deviation = current.subtract(avg).abs();
        return new Result(current.abs().compareTo(avg.abs().multiply(multiplier)) > 0, deviation);
    }
}
