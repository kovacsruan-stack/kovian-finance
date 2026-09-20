package com.kovian.finance.card.api;
import com.kovian.finance.card.domain.*; import com.kovian.finance.card.repository.*; import org.springframework.transaction.annotation.Transactional; import org.springframework.web.bind.annotation.*; import java.math.BigDecimal; import java.time.*; import java.util.*;
@RestController @RequestMapping("/api/v1/cards")
public class CreditCardController {
 final CreditCardRepository cards; final CreditCardInvoiceRepository invoices; final CreditCardPurchaseRepository purchases;
 public CreditCardController(CreditCardRepository c,CreditCardInvoiceRepository i,CreditCardPurchaseRepository p){cards=c;invoices=i;purchases=p;}
 record CardRequest(UUID ownerId,String name,String brand,String lastFour,BigDecimal creditLimit,int closingDay,int dueDay){}
 record PurchaseRequest(UUID ownerId,UUID cardId,String description,BigDecimal totalAmount,int installments,LocalDate purchasedAt){}
 @PostMapping @Transactional public CreditCard create(@RequestBody CardRequest r){return cards.save(new CreditCard(r.ownerId(),r.name(),r.brand(),r.lastFour(),r.creditLimit(),r.closingDay(),r.dueDay()));}
 @GetMapping public List<CreditCard> list(@RequestParam UUID ownerId){return cards.findByOwnerIdOrderByName(ownerId);}
 @PostMapping("/purchases") @Transactional public CreditCardPurchase purchase(@RequestBody PurchaseRequest r){
   var card=cards.findByIdAndOwnerId(r.cardId(),r.ownerId()).orElseThrow(()->new IllegalArgumentException("Card does not belong to owner"));
   if(card.getStatus()!=CreditCardStatus.ACTIVE)throw new IllegalArgumentException("Card is not active");
   if(r.totalAmount()==null||r.totalAmount().signum()<=0||r.installments()<1)throw new IllegalArgumentException("Invalid purchase");
   var date=r.purchasedAt()==null?LocalDate.now():r.purchasedAt(); var month=date.withDayOfMonth(1);
   var invoice=invoices.findByCardIdAndReferenceMonth(card.getId(),month).orElseGet(()->invoices.save(new CreditCardInvoice(r.ownerId(),card.getId(),month,date.withDayOfMonth(Math.min(card.getClosingDay(),date.lengthOfMonth())),date.plusMonths(1).withDayOfMonth(Math.min(card.getDueDay(),date.plusMonths(1).lengthOfMonth())))));
   var installment=r.totalAmount().divide(BigDecimal.valueOf(r.installments()),4,java.math.RoundingMode.HALF_UP);
   var p=new CreditCardPurchase(r.ownerId(),card.getId(),invoice.getId(),r.description(),r.totalAmount(),installment,1,r.installments(),date); invoice.addAmount(installment); invoices.save(invoice); return purchases.save(p);
 }
 @GetMapping("/invoices") public List<CreditCardInvoice> invoices(@RequestParam UUID ownerId){return invoices.findByOwnerIdOrderByDueDate(ownerId);}
 @GetMapping("/invoices/{id}/purchases") public List<CreditCardPurchase> purchases(@PathVariable UUID id){return purchases.findByInvoiceIdOrderByInstallmentNumber(id);}
 @PostMapping("/invoices/{id}/close") @Transactional public void close(@PathVariable UUID id,@RequestParam UUID ownerId){invoices.findByIdAndOwnerId(id,ownerId).orElseThrow().close();}
 @PostMapping("/invoices/{id}/pay") @Transactional public void pay(@PathVariable UUID id,@RequestParam UUID ownerId){invoices.findByIdAndOwnerId(id,ownerId).orElseThrow().markPaid();}
}
