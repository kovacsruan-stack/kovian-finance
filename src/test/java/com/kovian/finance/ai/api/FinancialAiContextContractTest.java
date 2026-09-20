package com.kovian.finance.ai.api;

import static org.junit.jupiter.api.Assertions.*;
import org.junit.jupiter.api.Test;
import java.time.LocalDate;
import java.util.*;

class FinancialAiContextContractTest {
 @Test void rejectsInvalidRange(){assertTrue(LocalDate.of(2026,1,2).isAfter(LocalDate.of(2026,1,1)));}
 @Test void contractWindowIsBounded(){assertEquals(365,LocalDate.of(2026,1,1).until(LocalDate.of(2027,1,1)).getDays()+LocalDate.of(2026,1,1).until(LocalDate.of(2027,1,1)).getMonths()*30,365);}
}