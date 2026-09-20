package com.kovian.finance.ai;

import java.math.BigDecimal;

/** Side-effect-free financial scenario calculator. */
public final class FinancialScenarioService {
    public record Scenario(BigDecimal revenue, BigDecimal expenses, BigDecimal growthRate) {}
    public record Result(BigDecimal projectedRevenue, BigDecimal projectedExpenses, BigDecimal projectedBalance) {}
    public Result simulate(Scenario s) {
        if (s == null || s.revenue() == null || s.expenses() == null || s.growthRate() == null) throw new IllegalArgumentException("Scenario is required");
        if (s.growthRate().compareTo(BigDecimal.valueOf(-1)) <= 0 || s.growthRate().compareTo(BigDecimal.TEN) > 0) throw new IllegalArgumentException("Growth rate is out of bounds");
        var factor = BigDecimal.ONE.add(s.growthRate());
        var revenue = s.revenue().multiply(factor);
        var expenses = s.expenses().multiply(factor);
        return new Result(revenue, expenses, revenue.subtract(expenses));
    }
}
