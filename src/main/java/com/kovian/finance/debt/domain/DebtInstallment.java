package com.kovian.finance.debt.domain;
import jakarta.persistence.*; import java.math.BigDecimal; import java.time.*; import java.util.UUID;
@Entity @Table(name="debt_installments")
public class DebtInstallment {
 @Id @GeneratedValue(strategy=GenerationType.UUID) UUID id; @Column(name="owner_id",nullable=false) UUID ownerId; @Column(name="debt_id",nullable=false) UUID debtId; @Column(name="installment_number",nullable=false) int installmentNumber; @Column(name="due_date",nullable=false) LocalDate dueDate; @Column(name="principal_amount",nullable=false,precision=19,scale=4) BigDecimal principalAmount; @Column(name="interest_amount",nullable=false,precision=19,scale=4) BigDecimal interestAmount; @Column(nullable=false,precision=19,scale=4) BigDecimal amount; @Enumerated(EnumType.STRING) @Column(nullable=false) InstallmentStatus status=InstallmentStatus.PENDING; @Column(name="paid_at") OffsetDateTime paidAt; @Column(name="payment_transaction_id") UUID paymentTransactionId;
 protected DebtInstallment(){} public DebtInstallment(UUID o,UUID d,int n,LocalDate due,BigDecimal principal,BigDecimal interest){ownerId=o;debtId=d;installmentNumber=n;dueDate=due;principalAmount=principal;interestAmount=interest;amount=principal.add(interest);}
 public UUID getId(){return id;} public UUID getDebtId(){return debtId;} public BigDecimal getAmount(){return amount;} public InstallmentStatus getStatus(){return status;} public void pay(UUID tx){status=InstallmentStatus.PAID;paidAt=OffsetDateTime.now();paymentTransactionId=tx;}
}
enum InstallmentStatus { PENDING, PAID, OVERDUE }
