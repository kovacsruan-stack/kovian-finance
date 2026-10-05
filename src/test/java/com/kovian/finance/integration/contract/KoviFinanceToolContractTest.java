package com.kovian.finance.integration.contract;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.assertThat;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class KoviFinanceToolContractTest {
    @Test void rejectsUnknownContractVersion() {
        assertThatThrownBy(() -> new KoviFinanceToolContract("finance-domain-tool.v0","r",UUID.randomUUID(),UUID.randomUUID(),"get_forecast",Map.of(),Instant.now()))
            .isInstanceOf(IllegalArgumentException.class);
    }
    @Test void exposesControlledReadSurface() {
        var c = new KoviFinanceToolContract(KoviFinanceToolContract.CURRENT_VERSION,"r",UUID.randomUUID(),UUID.randomUUID(),"get_forecast",Map.of(),Instant.now());
        assertThat(c.supportedReadOperations()).contains("get_forecast").doesNotContain("delete_account");
    }
}