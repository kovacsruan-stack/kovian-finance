package com.kovian.finance.common.api;
import org.springframework.http.*; import org.springframework.web.bind.annotation.*; import java.time.OffsetDateTime;
@RestControllerAdvice
public class ApiExceptionHandler {
 @ExceptionHandler(IllegalArgumentException.class)
 ResponseEntity<ApiError> illegal(IllegalArgumentException e){return ResponseEntity.badRequest().body(new ApiError("INVALID_REQUEST",e.getMessage(),OffsetDateTime.now()));}
 @ExceptionHandler(Exception.class)
 ResponseEntity<ApiError> unexpected(Exception e){return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ApiError("INTERNAL_ERROR","Unexpected server error",OffsetDateTime.now()));}
 public record ApiError(String code,String message,OffsetDateTime timestamp){}
}
