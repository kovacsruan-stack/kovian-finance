package com.kovian.finance.transaction.repository;

import java.math.BigDecimal;
import java.time.LocalDate;

public interface DailyCashFlowProjection {
    LocalDate getDate();
    BigDecimal getNet();
}
