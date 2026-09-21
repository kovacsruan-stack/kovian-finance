package com.kovian.finance.ledger.application;

import com.kovian.finance.account.domain.AccountStatus;
import com.kovian.finance.account.domain.FinancialAccount;
import com.kovian.finance.account.repository.FinancialAccountRepository;
import com.kovian.finance.audit.application.AuditService;
import com.kovian.finance.ledger.domain.*;
import com.kovian.finance.ledger.repository.LedgerEntryRepository;
import com.kovian.finance.ledger.repository.LedgerTransferRepository;
import com.kovian.finance.security.CurrentUser;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.UUID;

@Service
public class TransferService {
    private static final String OPERATION = "ACCOUNT_TRANSFER";
    private final FinancialAccountRepository accounts;
    private final LedgerTransferRepository transfers;
    private final LedgerEntryRepository entries;
    private final JdbcTemplate jdbc;
    private final AuditService audit;

    public TransferService(FinancialAccountRepository accounts, LedgerTransferRepository transfers,
                           LedgerEntryRepository entries, JdbcTemplate jdbc, AuditService audit) {
        this.accounts=accounts; this.transfers=transfers; this.entries=entries; this.jdbc=jdbc; this.audit=audit;
    }

    @Transactional
    public TransferResult transfer(UUID fromAccountId, UUID toAccountId, BigDecimal amount,
                                   String description, String idempotencyKey) {
        UUID ownerId=CurrentUser.ownerId();
        validate(fromAccountId,toAccountId,amount,description,idempotencyKey);
        BigDecimal normalized=amount.setScale(4,java.math.RoundingMode.HALF_UP);
        String requestHash=hash(fromAccountId+"|"+toAccountId+"|"+normalized.toPlainString()+"|"+description.trim());
        UUID proposedTransferId=UUID.randomUUID();

        int inserted=jdbc.update("""
            INSERT INTO idempotency_records
              (id,owner_id,operation,idempotency_key,request_hash,resource_id)
            VALUES (?,?,?,?,?,?)
            ON CONFLICT (owner_id,operation,idempotency_key) DO NOTHING
            """,UUID.randomUUID(),ownerId,OPERATION,idempotencyKey,requestHash,proposedTransferId);

        var record=jdbc.queryForMap("""
            SELECT request_hash,resource_id FROM idempotency_records
            WHERE owner_id=? AND operation=? AND idempotency_key=? FOR UPDATE
            """,ownerId,OPERATION,idempotencyKey);

        if(!requestHash.equals(String.valueOf(record.get("request_hash")))) throw new IdempotencyConflictException();

        Object resource=record.get("resource_id");
        UUID existingTransferId=resource==null?null:UUID.fromString(resource.toString());
        if(inserted==0 && existingTransferId!=null){
            LedgerTransfer existing=transfers.findByIdAndOwnerId(existingTransferId,ownerId)
                .orElseThrow(()->new IllegalStateException("Idempotency record has no transfer"));
            return new TransferResult(existing,true);
        }

        UUID firstId=fromAccountId.toString().compareTo(toAccountId.toString())<0?fromAccountId:toAccountId;
        UUID secondId=firstId.equals(fromAccountId)?toAccountId:fromAccountId;
        FinancialAccount first=accounts.findByIdAndOwnerIdForUpdate(firstId,ownerId)
            .orElseThrow(()->new IllegalArgumentException("Account not found"));
        FinancialAccount second=accounts.findByIdAndOwnerIdForUpdate(secondId,ownerId)
            .orElseThrow(()->new IllegalArgumentException("Account not found"));
        FinancialAccount from=first.getId().equals(fromAccountId)?first:second;
        FinancialAccount to=first.getId().equals(toAccountId)?first:second;

        if(!from.getCurrency().equalsIgnoreCase(to.getCurrency())) throw new IllegalArgumentException("Transfers require the same currency");
        if(from.getStatus()!=AccountStatus.ACTIVE || to.getStatus()!=AccountStatus.ACTIVE) throw new IllegalArgumentException("Both accounts must be active");
        if(from.getCurrentBalance().compareTo(normalized)<0) throw new IllegalArgumentException("Insufficient account balance");

        LedgerTransfer transfer=new LedgerTransfer(proposedTransferId,ownerId,fromAccountId,toAccountId,normalized,description);
        from.applyExpense(normalized); to.applyIncome(normalized);
        transfers.save(transfer);
        entries.save(new LedgerEntry(transfer.getId(),fromAccountId,normalized.negate()));
        entries.save(new LedgerEntry(transfer.getId(),toAccountId,normalized));

        jdbc.update("""
            UPDATE idempotency_records SET resource_id=?
            WHERE owner_id=? AND operation=? AND idempotency_key=?
            """,
            transfer.getId(),ownerId,OPERATION,idempotencyKey);

        audit.record("LEDGER_TRANSFER_POSTED","LedgerTransfer",transfer.getId(),
            "amount="+normalized+",from="+fromAccountId+",to="+toAccountId);
        return new TransferResult(transfer,false);
    }

    private void validate(UUID from,UUID to,BigDecimal amount,String description,String key){
        if(from==null||to==null||from.equals(to)) throw new IllegalArgumentException("Source and destination accounts must be different");
        if(amount==null||amount.signum()<=0) throw new IllegalArgumentException("Amount must be positive");
        if(description==null||description.isBlank()||description.length()>240) throw new IllegalArgumentException("Description is required");
        if(key==null||key.isBlank()||key.length()>200) throw new IllegalArgumentException("Idempotency-Key is required");
    }
    private String hash(String value){
        try{return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));}
        catch(Exception ex){throw new IllegalStateException("Unable to hash idempotency request",ex);}
    }
    public record TransferResult(LedgerTransfer transfer,boolean replayed){}
}
