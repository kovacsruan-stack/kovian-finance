package com.kovian.finance.security;
import jakarta.servlet.*; import jakarta.servlet.http.*; import org.slf4j.MDC; import org.springframework.web.filter.OncePerRequestFilter; import java.io.IOException; import java.util.UUID;
public class CorrelationIdFilter extends OncePerRequestFilter{
 public static final String HEADER="X-Correlation-Id";
 @Override protected void doFilterInternal(HttpServletRequest req,HttpServletResponse res,FilterChain chain)throws ServletException,IOException{
  String id=req.getHeader(HEADER); if(id==null||id.isBlank())id=req.getHeader("X-Request-ID"); if(id==null||id.isBlank()||id.length()>120||!id.matches("[A-Za-z0-9._:-]+"))id=UUID.randomUUID().toString();
  try{MDC.put(HEADER,id);res.setHeader(HEADER,id);res.setHeader("X-Request-ID",id);res.setHeader("Cache-Control","no-store");res.setHeader("Pragma","no-cache");chain.doFilter(req,res);}finally{MDC.remove(HEADER);}
 }
}