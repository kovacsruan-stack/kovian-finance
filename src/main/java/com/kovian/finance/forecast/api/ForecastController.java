package com.kovian.finance.forecast.api;

import com.kovian.finance.account.repository.FinancialAccountRepository;
import com.kovian.finance.card.domain.InvoiceStatus;
import com.kovian.finance.card.repository.CreditCardInvoiceRepository;
import com.kovian.finance.forecast.domain.CashFlowForecast;
import com.kovian.finance.recurring.domain.RecurringFrequency;
import com.kovian.finance.recurring.repository.RecurringTransactionRepository;
import com.kovian.finance.security.CurrentUser;
import com.kovian.finance.transaction.domain.TransactionStatus;
import com.kovian.finance.transaction.domain.TransactionType;
import com.kovian.finance.transaction.repository.FinancialTransactionRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.*;

@RestController
@RequestMapping("/api/v1/forecast")
public class ForecastController {
    private static final int HISTORY_DAYS = 90;
    private final FinancialTransactionRepository transactions;
    private final FinancialAccountRepository accounts;
    private final RecurringTransactionRepository recurring;
    private final CreditCardInvoiceRepository invoices;

    public ForecastController(FinancialTransactionRepository transactions,
                              FinancialAccountRepository accounts,
                              RecurringTransactionRepository recurring,
                              CreditCardInvoiceRepository invoices) {
        this.transactions = transactions;
        this.accounts = accounts;
        this.recurring = recurring;
        this.invoices = invoices;
    }

    @GetMapping("/cash-flow")
    public List<CashFlowForecast> cashFlow(@RequestParam(required = false) UUID ownerId,
                                           @RequestParam LocalDate from,
                                           @RequestParam int days) {
        UUID authenticatedOwner = CurrentUser.ownerId();
        if (ownerId != null && !authenticatedOwner.equals(ownerId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Owner scope violation");
        }
        if (from == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Forecast start date is required");
        if (days < 1 || days > 365) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Forecast horizon must be between 1 and 365 days");
        }

        LocalDate historyStart = from.minusDays(HISTORY_DAYS);
        OffsetDateTime start = historyStart.atStartOfDay().atOffset(ZoneOffset.UTC);
        OffsetDateTime end = from.atStartOfDay().atOffset(ZoneOffset.UTC);
        BigDecimal historicalIncome = BigDecimal.ZERO;
        BigDecimal historicalExpense = BigDecimal.ZERO;

        for (var tx : transactions.findByOwnerIdAndOccurredAtBetweenOrderByOccurredAtDesc(authenticatedOwner, start, end)) {
            if (tx.getStatus() == TransactionStatus.CANCELLED) continue;
            if (tx.getTransactionType() == TransactionType.INCOME) historicalIncome = historicalIncome.add(tx.getAmount());
            else if (tx.getTransactionType() == TransactionType.EXPENSE) historicalExpense = historicalExpense.add(tx.getAmount());
        }

        BigDecimal dailyIncome = historicalIncome.divide(BigDecimal.valueOf(HISTORY_DAYS), 4, RoundingMode.HALF_UP);
        BigDecimal dailyExpense = historicalExpense.divide(BigDecimal.valueOf(HISTORY_DAYS), 4, RoundingMode.HALF_UP);
        BigDecimal balance = accounts.findByOwnerIdOrderByName(authenticatedOwner).stream()
                .map(account -> account.getCurrentBalance()).reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<LocalDate, BigDecimal> scheduledIncome = new HashMap<>();
        Map<LocalDate, BigDecimal> scheduledExpense = new HashMap<>();
        for (var item : recurring.findByOwnerIdOrderByNextOccurrence(authenticatedOwner)) {
            if (!item.isActive() || item.getTransactionType() == TransactionType.TRANSFER) continue;
            LocalDate occurrence = item.getNextOccurrence();
            int guard = 0;
            while (!occurrence.isAfter(from.plusDays(days - 1)) && guard++ < 500) {
                if (!occurrence.isBefore(from) && (item.getEndDate() == null || !occurrence.isAfter(item.getEndDate()))) {
                    Map<LocalDate, BigDecimal> target = item.getTransactionType() == TransactionType.INCOME ? scheduledIncome : scheduledExpense;
                    target.merge(occurrence, item.getAmount(), BigDecimal::add);
                }
                occurrence = switch (item.getFrequency()) {
                    case WEEKLY -> occurrence.plusWeeks(1);
                    case MONTHLY -> occurrence.plusMonths(1);
                    case YEARLY -> occurrence.plusYears(1);
                };
            }
        }

        for (var invoice : invoices.findDueBetweenForOwner(authenticatedOwner, from, from.plusDays(days - 1))) {
            if (invoice.getStatus() != InvoiceStatus.PAID && !invoice.getDueDate().isBefore(from)) {
                scheduledExpense.merge(invoice.getDueDate(), invoice.getTotalAmount().subtract(invoice.getPaidAmount()), BigDecimal::add);
            }
        }

        List<CashFlowForecast> result = new ArrayList<>(days);
        for (int i = 0; i < days; i++) {
            LocalDate date = from.plusDays(i);
            BigDecimal income = dailyIncome.add(scheduledIncome.getOrDefault(date, BigDecimal.ZERO));
            BigDecimal expense = dailyExpense.add(scheduledExpense.getOrDefault(date, BigDecimal.ZERO));
            BigDecimal net = income.subtract(expense);
            balance = balance.add(net);
            result.add(new CashFlowForecast(date, income, expense, net, balance));
        }
        return result;
    }
}