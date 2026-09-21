package com.kovian.finance.security;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

public class OwnerIsolationFilter extends OncePerRequestFilter {
    private final ObjectMapper objectMapper;
    public OwnerIsolationFilter(ObjectMapper objectMapper){ this.objectMapper=objectMapper; }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        if (SecurityContextHolder.getContext().getAuthentication() == null) {
            chain.doFilter(request, response);
            return;
        }
        UUID owner;
        try { owner = CurrentUser.ownerId(); } catch (IllegalStateException ex) { response.sendError(HttpServletResponse.SC_FORBIDDEN, "Owner context is required"); return; }
        String queryOwner = request.getParameter("ownerId");
        if (queryOwner != null && !owner.equals(parse(queryOwner))) {
            response.sendError(HttpServletResponse.SC_FORBIDDEN, "Owner scope violation");
            return;
        }
        if (request.getContentType() != null && request.getContentType().toLowerCase().contains("application/json")
                && request.getContentLengthLong() > 0 && request.getContentLengthLong() <= 1_000_000) {
            CachedBodyRequest wrapped = new CachedBodyRequest(request);
            String bodyOwner = wrapped.ownerId();
            if (bodyOwner != null && !owner.equals(parse(bodyOwner))) {
                response.sendError(HttpServletResponse.SC_FORBIDDEN, "Owner scope violation");
                return;
            }
            chain.doFilter(wrapped, response);
            return;
        }
        chain.doFilter(request, response);
    }

    private UUID parse(String value) {
        try { return UUID.fromString(value); }
        catch (IllegalArgumentException ex) { return null; }
    }

    private class CachedBodyRequest extends jakarta.servlet.http.HttpServletRequestWrapper {
        private final byte[] body;
        CachedBodyRequest(HttpServletRequest request) throws IOException {
            super(request);
            body=request.getInputStream().readAllBytes();
        }
        String ownerId() {
            try {
                JsonNode node=objectMapper.readTree(body);
                JsonNode value=node==null?null:node.get("ownerId");
                return value==null||value.isNull()?null:value.asText();
            } catch(Exception ex) { return null; }
        }
        @Override public jakarta.servlet.ServletInputStream getInputStream() {
            return new jakarta.servlet.ServletInputStream() {
                private final java.io.ByteArrayInputStream input=new java.io.ByteArrayInputStream(body);
                public int read(){return input.read();}
                public boolean isFinished(){return input.available()==0;}
                public boolean isReady(){return true;}
                public void setReadListener(jakarta.servlet.ReadListener listener){}
            };
        }
    }
}
