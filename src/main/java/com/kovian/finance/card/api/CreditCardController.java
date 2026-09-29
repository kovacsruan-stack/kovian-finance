package com.kovian.finance.card.api;

import com.kovian.finance.account.repository.FinancialAccountRepository;
import com.kovian.finance.card.domain.*;
import com.kovian.finance.card.repository.*;
import com.kovian.finance.security.CurrentUser;
import com.kovian.finance.transaction.domain.*;
import com.kovian.finance.transaction.repository.FinancialTransactionRepository;
import org.springframework.http.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.math.*;
import java.time.*;
import java.util.*;

@RestController
@RequestMapping("/api/v1/cards")
public class CreditCardController {
    private final CreditCardRepository cards; private final CreditCardInvoiceRepository invoices; private final CreditCardPurchaseRepository purchases;
    private final FinancialAccountRepository accounts; private final FinancialTransactionRepository transactions;
    public CreditCardController(CreditCardRepository c, CreditCardInvoiceRepository i, CreditCardPurchaseRepository p, FinancialAccountRepository a, FinancialTransactionRepository t) { cards=c; invoices=i; purchases=p; accounts=a; transactions=t; }
    record CardRequest(UUID ownerId,@NotBlank @Size(max=120) String name,@Size(max=60) String brand,@Pattern(regexp="\\d{4}") String lastFour,@NotNull @DecimalMin("0.00") BigDecimal creditLimit,@Min(1) @Max(31) int closingDay,@Min(1) @Max(31) int dueDay) {}
    record PurchaseRequest(UUID ownerId,@NotNull UUID cardId,@NotBlank @Size(max=240) String description,@NotNull @DecimalMin("0.01") BigDecimal totalAmount,@Min(1) @Max(60) int installments,LocalDate purchasedAt) {}

    @PostMapping @Transactional public CreditCard create(@Valid @RequestBody CardRequest r) {
        UUID ownerId = owner(); requireOwner(r.ownerId(), ownerId);
        return cards.save(new CreditCard(ownerId,r.name(),r.brand(),r.lastFour(),r.creditLimit(),r.closingDay(),r.dueDay()));
    }
    @GetMapping public List<CreditCard> list(@RequestParam(required=false) UUID ownerId) { UUID current=owner(); requireOwner(ownerId,current); return cards.findByOwnerIdOrderByName(current); }
    @PostMapping("/purchases") @Transactional public CreditCardPurchase purchase(@Valid @RequestBody PurchaseRequest r) {
        UUID ownerId=owner(); requireOwner(r.ownerId(),ownerId);
        var card=cards.findByIdAndOwnerId(r.cardId(),ownerId).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Card not found"));
        if(card.getStatus()!=CreditCardStatus.ACTIVE||r.totalAmount()==null||r.totalAmount().signum()<=0||r.installments()<1) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Invalid card purchase");
        var date=r.purchasedAt()==null?LocalDate.now():r.purchasedAt(); var base=r.totalAmount().divide(BigDecimal.valueOf(r.installments()),4,RoundingMode.HALF_UP); CreditCardPurchase first=null;
        for(int n=1;n<=r.installments();n++){var month=date.withDayOfMonth(1).plusMonths(n-1);var close=month.withDayOfMonth(Math.min(card.getClosingDay(),month.lengthOfMonth()));var dueMonth=month.plusMonths(1);var due=dueMonth.withDayOfMonth(Math.min(card.getDueDay(),dueMonth.lengthOfMonth()));var inv=invoices.findByCardIdAndReferenceMonth(card.getId(),month).orElseGet(()->invoices.save(new CreditCardInvoice(ownerId,card.getId(),month,close,due)));var amount=n==r.installments()?r.totalAmount().subtract(base.multiply(BigDecimal.valueOf(n-1))):base;inv.addAmount(amount);invoices.save(inv);var p=purchases.save(new CreditCardPurchase(ownerId,card.getId(),inv.getId(),r.description(),r.totalAmount(),amount,n,r.installments(),date));if(first==null)first=p;}
        return first;
    }
    @GetMapping("/invoices") public List<CreditCardInvoice> invoices(@RequestParam(required=false) UUID ownerId){UUID current=owner();requireOwner(ownerId,current);return invoices.findByOwnerIdOrderByDueDate(current);}
    @GetMapping("/invoices/{id}/purchases") public List<CreditCardPurchase> purchases(@PathVariable UUID id){UUID current=owner();invoices.findByIdAndOwnerId(id,current).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Invoice not found"));return purchases.findByInvoiceIdOrderById(id);}
    @PostMapping("/invoices/{id}/close") @Transactional public void close(@PathVariable UUID id,@RequestParam(required=false) UUID ownerId){UUID current=owner();requireOwner(ownerId,current);invoices.findByIdAndOwnerId(id,current).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Invoice not found")).close();}
    @PostMapping("/invoices/{id}/pay") @Transactional public void pay(@PathVariable UUID id,@RequestParam(required=false) UUID ownerId,@RequestParam UUID accountId){UUID current=owner();requireOwner(ownerId,current);var inv=invoices.findByIdAndOwnerId(id,current).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Invoice not found"));if(inv.getStatus()==InvoiceStatus.PAID)return;var account=accounts.findByIdAndOwnerId(accountId,current).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Account does not belong to owner"));var key="card-invoice:"+inv.getId();if(!transactions.existsByOwnerIdAndExternalId(current,key)){transactions.save(new FinancialTransaction(current,account,null,key,"Credit card invoice payment",inv.getTotalAmount(),TransactionType.CARD_PAYMENT,inv.getDueDate().atStartOfDay().atOffset(ZoneOffset.UTC)));account.applyExpense(inv.getTotalAmount());}inv.markPaid();}
    private UUID owner(){return CurrentUser.ownerId();}
    private static void requireOwner(UUID requested,UUID current){if(requested!=null&&!current.equals(requested))throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Owner scope violation");}
}
