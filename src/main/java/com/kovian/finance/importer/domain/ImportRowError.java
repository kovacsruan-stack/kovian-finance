package com.kovian.finance.importer.domain;
import jakarta.persistence.*; import java.time.OffsetDateTime; import java.util.UUID;
@Entity @Table(name="import_row_errors")
public class ImportRowError{
 @Id private UUID id; @Column(name="batch_id",nullable=false) private UUID batchId; @Column(name="row_number",nullable=false) private int rowNumber;
 @Column(name="raw_data",columnDefinition="TEXT") private String rawData; @Column(name="error_code",nullable=false,length=80) private String errorCode; @Column(name="error_message",nullable=false,length=1000) private String errorMessage; @Column(name="created_at",nullable=false) private OffsetDateTime createdAt;
 protected ImportRowError(){}
 public ImportRowError(UUID batchId,int rowNumber,String raw,String code,String message){id=UUID.randomUUID();this.batchId=batchId;this.rowNumber=rowNumber;rawData=raw;errorCode=code;errorMessage=message;createdAt=OffsetDateTime.now();} public int getRowNumber(){return rowNumber;} public String getErrorCode(){return errorCode;} public String getErrorMessage(){return errorMessage;}
}