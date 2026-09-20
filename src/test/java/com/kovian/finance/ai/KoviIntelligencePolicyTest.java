package com.kovian.finance.ai;

import static org.junit.jupiter.api.Assertions.*;
import org.junit.jupiter.api.Test;

class KoviIntelligencePolicyTest {
 @Test void tenantAndPermissionAreRequired(){assertTrue(KoviIntelligencePolicy.allowsRead("finance.read","t1","t1"));assertFalse(KoviIntelligencePolicy.allowsRead("finance.read","t1","t2"));}
 @Test void mutationsRemainDisabled(){assertFalse(KoviIntelligencePolicy.allowsMutation("finance.mutation"));}
}
