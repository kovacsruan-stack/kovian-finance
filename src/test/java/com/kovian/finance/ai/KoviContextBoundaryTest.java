package com.kovian.finance.ai;
import static org.junit.jupiter.api.Assertions.*;import java.util.Map;import org.junit.jupiter.api.Test;
class KoviContextBoundaryTest{@Test void boundsValues(){var out=KoviContextBoundary.sanitize(Map.of("x","a".repeat(5000)));assertEquals(4000,out.get("x").length());}}
