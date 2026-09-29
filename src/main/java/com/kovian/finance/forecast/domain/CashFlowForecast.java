package com.kovian.finance.forecast.domain;

import java.math.BigDecimal;
import java.time.LocalDate;

/** API contract consumed by the Finance forecast UI. */
public record CashFlowForecast(
        LocalDate date,
        BigDecimal income,
        BigDecimal expense,
        BigDecimal netCashFlow,
        BigDecimal projectedBalance) {}
