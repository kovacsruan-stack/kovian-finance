package com.kovian.finance.outbox.application;
import com.kovian.finance.outbox.domain.OutboxEvent;
public interface OutboxEventPublisher { void publish(OutboxEvent event); }