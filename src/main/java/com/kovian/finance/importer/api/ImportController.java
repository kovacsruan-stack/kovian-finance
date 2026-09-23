package com.kovian.finance.importer.api;
import com.kovian.finance.importer.application.CsvImportService; import com.kovian.finance.importer.repository.*; import com.kovian.finance.security.CurrentUser; import org.springframework.http.*; import org.springframework.web.bind.annotation.*; import org.springframework.web.multipart.MultipartFile; import java.io.IOException; import java.util.*;
@RestController @RequestMapping("/api/v1/imports") public class ImportController{
 private final CsvImportService service; private final ImportBatchRepository batches; private final ImportRowErrorRepository errors;
 public ImportController(CsvImportService s,ImportBatchRepository b,ImportRowErrorRepository e){service=s;batches=b;errors=e;}
 @PostMapping(value="/csv",consumes=MediaType.MULTIPART_FORM_DATA_VALUE) public ImportResponse csv(@RequestParam UUID accountId,@RequestPart("file") MultipartFile file)throws IOException{
  var b=service.importCsv(accountId,file.getOriginalFilename(),file.getBytes());return to(b);
 }
 @GetMapping public List<ImportResponse> list(){return batches.findTop50ByOwnerIdOrderByCreatedAtDesc(CurrentUser.ownerId()).stream().map(this::to).toList();}
 @GetMapping("/{id}/errors") public List<ImportErrorResponse> errors(@PathVariable UUID id){var b=batches.findByIdAndOwnerId(id,CurrentUser.ownerId()).orElseThrow(()->new org.springframework.web.server.ResponseStatusException(HttpStatus.NOT_FOUND));return this.errors.findByBatchIdOrderByRowNumber(b.getId()).stream().map(e->new ImportErrorResponse(e.getRowNumber(),e.getErrorCode(),e.getErrorMessage())).toList();}
 private ImportResponse to(com.kovian.finance.importer.domain.ImportBatch b){return new ImportResponse(b.getId(),b.getAccountId(),b.getFilename(),b.getStatus(),b.getTotalRows(),b.getImportedRows(),b.getDuplicateRows(),b.getFailedRows());}
 record ImportResponse(UUID id,UUID accountId,String filename,String status,int totalRows,int importedRows,int duplicateRows,int failedRows){} record ImportErrorResponse(int rowNumber,String errorCode,String message){}
}