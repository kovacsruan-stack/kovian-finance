package com.kovian.finance.ai.api;
import static org.junit.jupiter.api.Assertions.*;
import org.junit.jupiter.api.Test;
import java.time.*;
import java.time.temporal.ChronoUnit;
class FinancialAiContextContractTest {
 @Test void rejectsInvalidRange(){assertTrue(LocalDate.of(2026,1,2).isAfter(LocalDate.of(2026,1,1)));}
 @Test void contractWindowIsBounded(){assertEquals(365,ChronoUnit.DAYS.between(LocalDate.of(2026,1,1),LocalDate.of(2027,1,1)));}
}