package com.kovian.finance.security;

import io.micrometer.core.instrument.MeterRegistry;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

public class KoviInternalAuthenticationFilter extends OncePerRequestFilter {
 private final String apiKey;
 private final MeterRegistry metrics;
 public KoviInternalAuthenticationFilter(@Value("${kovian.kovi.internal-api-key:}") String apiKey, MeterRegistry metrics){this.apiKey=apiKey;this.metrics=metrics;}
 @Override protected boolean shouldNotFilter(HttpServletRequest request){return !request.getRequestURI().startsWith("/api/v1/internal/kovi/");}
 @Override protected void doFilterInternal(HttpServletRequest request,HttpServletResponse response,FilterChain chain)throws ServletException,IOException{
  String provided=request.getHeader("X-KOVI-INTERNAL-KEY");
  response.setHeader("Cache-Control","no-store");
  boolean valid=apiKey!=null&&apiKey.length()>=32&&provided!=null&&MessageDigest.isEqual(apiKey.getBytes(StandardCharsets.UTF_8),provided.getBytes(StandardCharsets.UTF_8));
  if(!valid){metrics.counter("kovian_kovi_internal_auth_failures_total").increment();response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);response.setContentType("application/json");response.getWriter().write("{\"error\":\"INVALID_KOVI_INTERNAL_CREDENTIAL\"}");return;}
  metrics.counter("kovian_kovi_internal_requests_total").increment();
  chain.doFilter(request,response);
 }
}
