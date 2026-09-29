package com.kovian.finance.common.api;

import com.kovian.finance.ledger.application.IdempotencyConflictException;
import org.springframework.http.*;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import jakarta.validation.ConstraintViolationException;
import org.springframework.web.server.ResponseStatusException;
import java.time.OffsetDateTime;
import org.slf4j.MDC;

import static com.kovian.finance.security.CorrelationIdFilter.HEADER;

@RestControllerAdvice
public class ApiExceptionHandler {
 @ExceptionHandler(IdempotencyConflictException.class)
 ResponseEntity<ApiError> idempotency(IdempotencyConflictException e){return error(HttpStatus.CONFLICT,"IDEMPOTENCY_CONFLICT",e.getMessage());}
 @ExceptionHandler(ResponseStatusException.class)
 ResponseEntity<ApiError> status(ResponseStatusException e){return error(HttpStatusCode.valueOf(e.getStatusCode().value()),"REQUEST_REJECTED",e.getReason());}
 @ExceptionHandler(ObjectOptimisticLockingFailureException.class)
 ResponseEntity<ApiError> optimistic(ObjectOptimisticLockingFailureException e){return error(HttpStatus.CONFLICT,"CONCURRENT_UPDATE","Resource changed concurrently; retry the operation");}
 @ExceptionHandler(MethodArgumentNotValidException.class)
 ResponseEntity<ApiError> validation(MethodArgumentNotValidException e){
   String message=e.getBindingResult().getFieldErrors().stream()
       .findFirst()
       .map(error -> error.getField()+": "+error.getDefaultMessage())
       .orElse("Request validation failed");
   return error(HttpStatus.BAD_REQUEST,"VALIDATION_ERROR",message);
 }
 @ExceptionHandler(ConstraintViolationException.class)
 ResponseEntity<ApiError> constraint(ConstraintViolationException e){
   String message=e.getConstraintViolations().stream().findFirst().map(v -> v.getPropertyPath()+": "+v.getMessage()).orElse("Request validation failed");
   return error(HttpStatus.BAD_REQUEST,"VALIDATION_ERROR",message);
 }
 @ExceptionHandler(HttpMessageNotReadableException.class)
 ResponseEntity<ApiError> malformed(HttpMessageNotReadableException e){
   return error(HttpStatus.BAD_REQUEST,"MALFORMED_REQUEST","Request body is invalid or unreadable");
 }
 @ExceptionHandler(IllegalArgumentException.class)
 ResponseEntity<ApiError> illegal(IllegalArgumentException e){return error(HttpStatus.BAD_REQUEST,"INVALID_REQUEST",e.getMessage());}
 @ExceptionHandler(Exception.class)
 ResponseEntity<ApiError> unexpected(Exception e){return error(HttpStatus.INTERNAL_SERVER_ERROR,"INTERNAL_ERROR","Unexpected server error");}
 private ResponseEntity<ApiError> error(HttpStatusCode status,String code,String message){
   String correlationId = MDC.get(HEADER);
   ResponseEntity.BodyBuilder response = ResponseEntity.status(status);
   if (correlationId != null && !correlationId.isBlank()) response.header(HEADER, correlationId);
   return response.body(new ApiError(code,message,OffsetDateTime.now()));
 }
 public record ApiError(String code,String message,OffsetDateTime timestamp){}
}
