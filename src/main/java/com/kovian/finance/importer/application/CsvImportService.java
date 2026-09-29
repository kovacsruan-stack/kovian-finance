package com.kovian.finance.importer.application;
import com.kovian.finance.account.repository.FinancialAccountRepository; import com.kovian.finance.category.repository.TransactionCategoryRepository; import com.kovian.finance.integration.KovianEventType; import com.kovian.finance.importer.domain.*; import com.kovian.finance.importer.repository.*; import com.kovian.finance.outbox.application.OutboxEventService; import com.kovian.finance.security.CurrentUser; import com.kovian.finance.transaction.domain.*; import com.kovian.finance.transaction.repository.FinancialTransactionRepository; import org.springframework.stereotype.Service; import org.springframework.transaction.annotation.Transactional;
import java.io.*; import java.math.*; import java.nio.charset.StandardCharsets; import java.time.*; import java.time.format.DateTimeFormatter; import java.util.*;
@Service public class CsvImportService{
 private final ImportBatchRepository batches; private final ImportRowErrorRepository errors; private final FinancialAccountRepository accounts; private final TransactionCategoryRepository categories; private final FinancialTransactionRepository transactions; private final OutboxEventService outbox;
 public CsvImportService(ImportBatchRepository b,ImportRowErrorRepository e,FinancialAccountRepository a,TransactionCategoryRepository c,FinancialTransactionRepository t,OutboxEventService o){batches=b;errors=e;accounts=a;categories=c;transactions=t;outbox=o;}
 @Transactional public ImportBatch importCsv(UUID accountId,String filename,byte[] bytes){
  UUID owner=CurrentUser.ownerId(); accounts.findByIdAndOwnerId(accountId,owner).orElseThrow(()->new IllegalArgumentException("Account not found"));
  if(bytes==null||bytes.length==0)throw new IllegalArgumentException("CSV file is empty"); if(bytes.length>5_000_000)throw new IllegalArgumentException("CSV file exceeds 5 MB");
  ImportBatch batch=batches.save(new ImportBatch(owner,accountId,filename==null?"import.csv":filename));
  int total=0,imported=0,duplicates=0,failed=0;
  try(BufferedReader br=new BufferedReader(new InputStreamReader(new ByteArrayInputStream(bytes),StandardCharsets.UTF_8))){
   String header=br.readLine(); if(header==null)throw new IllegalArgumentException("CSV header is required");
   List<String> h=parse(header.replace("\\uFEFF", "")); Map<String,Integer> idx=new HashMap<>(); for(int i=0;i<h.size();i++)idx.put(h.get(i).trim().toLowerCase(Locale.ROOT),i);
   require(idx,"date"); require(idx,"description"); require(idx,"amount"); require(idx,"type");
   String line; int row=1;
   while((line=br.readLine())!=null){row++; if(line.isBlank())continue; total++;
    try{
     List<String> c=parse(line); String date=val(c,idx,"date"),description=val(c,idx,"description"),type=val(c,idx,"type").toUpperCase(Locale.ROOT); BigDecimal amount=new BigDecimal(val(c,idx,"amount").replace(",",".")); String sourceTransactionId=optionalVal(c,idx,"source_transaction_id"); String external=idx.containsKey("external_id")?val(c,idx,"external_id"):(!sourceTransactionId.isBlank()?"kovian-export:"+sourceTransactionId:"csv:"+batch.getId()+":"+row);
     TransactionType tt=TransactionType.valueOf(type); if(tt==TransactionType.TRANSFER||amount.signum()<=0)throw new IllegalArgumentException("Invalid type or amount");
     OffsetDateTime occurred=LocalDate.parse(date,DateTimeFormatter.ISO_LOCAL_DATE).atStartOfDay().atOffset(ZoneOffset.UTC);
     boolean duplicate=transactions.existsByOwnerIdAndExternalId(owner,external);
     if(!duplicate&&!sourceTransactionId.isBlank()){
      try{duplicate=transactions.findByIdAndOwnerId(UUID.fromString(sourceTransactionId),owner).isPresent();}
      catch(IllegalArgumentException ex){throw new IllegalArgumentException("Invalid source_transaction_id");}
     }
     if(duplicate){duplicates++;continue;}
     String categoryValue=optionalVal(c,idx,"category_id");
     var categoryId=categoryValue.isBlank()?null:UUID.fromString(categoryValue);
     var category=categoryId==null?null:categories.findByIdAndOwnerId(categoryId,owner).orElseThrow(()->new IllegalArgumentException("Category not found"));
     var account=accounts.findByIdAndOwnerId(accountId,owner).orElseThrow();
     var tx=new FinancialTransaction(owner,account,category,external,description,amount,tt,occurred);
     if(tt==TransactionType.INCOME)account.applyIncome(amount);else account.applyExpense(amount);
     var saved=transactions.save(tx); outbox.record("FinancialTransaction",saved.getId(),KovianEventType.TRANSACTION_CREATED,Map.of("transactionId",saved.getId(),"importBatchId",batch.getId(),"amount",amount,"type",type)); imported++;
    }catch(Exception ex){failed++;errors.save(new ImportRowError(batch.getId(),row,line,"INVALID_ROW",safe(ex.getMessage())));}
   }
   batch.complete(total,imported,duplicates,failed); return batches.save(batch);
  }catch(Exception ex){batch.fail(safe(ex.getMessage()));return batches.save(batch);}
 }
 private static void require(Map<String,Integer> m,String k){if(!m.containsKey(k))throw new IllegalArgumentException("Missing CSV column: "+k);}
 private static String val(List<String> c,Map<String,Integer> i,String k){int p=i.get(k);if(p>=c.size()||c.get(p).isBlank())throw new IllegalArgumentException("Missing value: "+k);return c.get(p).trim();}
 private static String optionalVal(List<String> c,Map<String,Integer> i,String k){Integer p=i.get(k);return p==null||p>=c.size()?"":c.get(p).trim();}
 private static String safe(String s){return s==null?"Unknown import error":s.substring(0,Math.min(1000,s.length()));}
 private static List<String> parse(String s){List<String> out=new ArrayList<>();StringBuilder b=new StringBuilder();boolean q=false;for(int i=0;i<s.length();i++){char ch=s.charAt(i);if(ch=='"'){if(q&&i+1<s.length()&&s.charAt(i+1)=='"'){b.append('"');i++;}else q=!q;}else if(ch==','&&!q){out.add(b.toString());b.setLength(0);}else b.append(ch);}if(q)throw new IllegalArgumentException("Unclosed CSV quote");out.add(b.toString());return out;}
}