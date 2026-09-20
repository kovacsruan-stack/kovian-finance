package com.kovian.finance.security;
import org.springframework.security.core.Authentication; import org.springframework.security.core.context.SecurityContextHolder; import java.util.UUID;
public final class CurrentUser{
 private CurrentUser(){}
 public static boolean isAuthenticated(){Authentication a=SecurityContextHolder.getContext().getAuthentication();return a!=null&&a.isAuthenticated()&&a.getName()!=null&&!a.getName().equals("anonymousUser");}
 public static UUID ownerId(){if(!isAuthenticated())throw new IllegalStateException("Authenticated user required");try{return UUID.fromString(SecurityContextHolder.getContext().getAuthentication().getName());}catch(IllegalArgumentException e){throw new IllegalStateException("Authenticated principal must be a UUID",e);}}
 public static UUID actorId(){return ownerId();}
}