package com.kovian.finance.ai;

import static org.junit.jupiter.api.Assertions.*;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.Test;

class FinancialIntelligencePrimitivesTest {
 @Test void forecastIsBounded(){var r=new FinancialForecastEngine().forecast(List.of(new FinancialForecastEngine.Point("1",BigDecimal.TEN),new FinancialForecastEngine.Point("2",BigDecimal.valueOf(12))),3);assertEquals(3,r.points().size());}
 @Test void scenarioIsSideEffectFree(){var r=new FinancialScenarioService().simulate(new FinancialScenarioService.Scenario(BigDecimal.valueOf(100),BigDecimal.valueOf(40),BigDecimal.valueOf(.1)));assertEquals(BigDecimal.valueOf(66.0),r.projectedBalance());}
 @Test void anomalyFlagsLargeDeviation(){assertTrue(new FinancialAnomalyDetector().detect(List.of(BigDecimal.TEN,BigDecimal.TEN),BigDecimal.valueOf(30),BigDecimal.valueOf(2)).anomalous());}
}
