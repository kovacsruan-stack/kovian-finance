package com.kovian.finance.importer.domain;
import jakarta.persistence.*; import java.time.OffsetDateTime; import java.util.UUID;
@Entity @Table(name="import_batches")
public class ImportBatch{
 @Id private UUID id; @Column(name="owner_id",nullable=false) private UUID ownerId; @Column(name="account_id",nullable=false) private UUID accountId;
 @Column(nullable=false,length=255) private String filename; @Column(nullable=false,length=20) private String format; @Column(nullable=false,length=20) private String status;
 @Column(name="total_rows",nullable=false) private int totalRows; @Column(name="imported_rows",nullable=false) private int importedRows; @Column(name="duplicate_rows",nullable=false) private int duplicateRows; @Column(name="failed_rows",nullable=false) private int failedRows;
 @Column(name="created_at",nullable=false) private OffsetDateTime createdAt; @Column(name="completed_at") private OffsetDateTime completedAt; @Column(name="last_error",length=1000) private String lastError;
 protected ImportBatch(){}
 public ImportBatch(UUID ownerId,UUID accountId,String filename){this.id=UUID.randomUUID();this.ownerId=ownerId;this.accountId=accountId;this.filename=filename;this.format="CSV";this.status="PROCESSING";this.createdAt=OffsetDateTime.now();}
 public UUID getId(){return id;} public UUID getOwnerId(){return ownerId;} public UUID getAccountId(){return accountId;} public String getFilename(){return filename;} public String getStatus(){return status;} public int getTotalRows(){return totalRows;} public int getImportedRows(){return importedRows;} public int getDuplicateRows(){return duplicateRows;} public int getFailedRows(){return failedRows;}
 public void complete(int total,int imported,int duplicates,int failed){totalRows=total;importedRows=imported;duplicateRows=duplicates;failedRows=failed;status=failed>0?"PARTIAL":"COMPLETED";completedAt=OffsetDateTime.now();}
 public void fail(String error){status="FAILED";lastError=error;completedAt=OffsetDateTime.now();}
}