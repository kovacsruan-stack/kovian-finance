package com.kovian.finance.security;
import jakarta.servlet.*; import jakarta.servlet.http.*; import org.springframework.data.redis.core.StringRedisTemplate; import org.springframework.http.HttpStatus; import org.springframework.web.filter.OncePerRequestFilter; import java.io.IOException; import java.time.Duration; import java.util.UUID;
public class RateLimitFilter extends OncePerRequestFilter{
 private final StringRedisTemplate redis; private final int limit; private final Duration window;
 public RateLimitFilter(StringRedisTemplate redis,int limit,Duration window){this.redis=redis;this.limit=limit;this.window=window;}
 @Override protected void doFilterInternal(HttpServletRequest req,HttpServletResponse res,FilterChain chain)throws ServletException,IOException{
  if(CurrentUser.isAuthenticated()){
   UUID owner=CurrentUser.ownerId(); String key="kovian:rate:"+owner+":"+System.currentTimeMillis()/window.toMillis();
   try {
    Long count=redis.opsForValue().increment(key);
    if(count!=null&&count==1)redis.expire(key,window);
    if(count!=null&&count>limit){res.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());res.setHeader("Retry-After",String.valueOf(Math.max(1,window.toSeconds())));res.setContentType("application/json");res.getWriter().write("{\"code\":\"RATE_LIMITED\",\"message\":\"Too many requests\"}");return;}
   } catch (RuntimeException ex) {
    res.setStatus(HttpStatus.SERVICE_UNAVAILABLE.value());
    res.setHeader("Retry-After","5");
    res.setContentType("application/json");
    res.getWriter().write("{\"code\":\"RATE_LIMIT_BACKEND_UNAVAILABLE\",\"message\":\"Rate-limit service temporarily unavailable\"}");
    return;
   }
  }
  chain.doFilter(req,res);
 }
}