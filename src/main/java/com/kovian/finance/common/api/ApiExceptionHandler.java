package com.kovian.finance.common.api;

import com.kovian.finance.ledger.application.IdempotencyConflictException;
import org.springframework.http.*;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.time.OffsetDateTime;

@RestControllerAdvice
public class ApiExceptionHandler {
 @ExceptionHandler(IdempotencyConflictException.class)
 ResponseEntity<ApiError> idempotency(IdempotencyConflictException e){return error(HttpStatus.CONFLICT,"IDEMPOTENCY_CONFLICT",e.getMessage());}
 @ExceptionHandler(ResponseStatusException.class)
 ResponseEntity<ApiError> status(ResponseStatusException e){return error(HttpStatusCode.valueOf(e.getStatusCode().value()),"REQUEST_REJECTED",e.getReason());}
 @ExceptionHandler(ObjectOptimisticLockingFailureException.class)
 ResponseEntity<ApiError> optimistic(ObjectOptimisticLockingFailureException e){return error(HttpStatus.CONFLICT,"CONCURRENT_UPDATE","Resource changed concurrently; retry the operation");}
 @ExceptionHandler(IllegalArgumentException.class)
 ResponseEntity<ApiError> illegal(IllegalArgumentException e){return error(HttpStatus.BAD_REQUEST,"INVALID_REQUEST",e.getMessage());}
 @ExceptionHandler(Exception.class)
 ResponseEntity<ApiError> unexpected(Exception e){return error(HttpStatus.INTERNAL_SERVER_ERROR,"INTERNAL_ERROR","Unexpected server error");}
 private ResponseEntity<ApiError> error(HttpStatusCode status,String code,String message){
   return ResponseEntity.status(status).body(new ApiError(code,message,OffsetDateTime.now()));
 }
 public record ApiError(String code,String message,OffsetDateTime timestamp){}
}
