package com.garage.security;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.security.SecurityException;
import io.jsonwebtoken.UnsupportedJwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private final JwtUtils jwtUtils;
    private final CustomUserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String jwt = parseJwt(request);
        
        // No token — continue chain for anonymous access (handled by Spring Security)
        if (jwt == null) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            if (jwtUtils.validateJwtToken(jwt)) {
                String username = jwtUtils.getUserNameFromJwtToken(jwt);
                UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities());
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
            filterChain.doFilter(request, response);
        } catch (ExpiredJwtException e) {
            logger.error("JWT token expired: " + e.getMessage());
            response.setContentType("application/json;charset=UTF-8");
            response.setStatus(401);
            response.getWriter().write("{\"message\":\"Token expired\"}");
        } catch (MalformedJwtException | SecurityException | UnsupportedJwtException e) {
            logger.error("Invalid JWT token: " + e.getMessage());
            response.setContentType("application/json;charset=UTF-8");
            response.setStatus(401);
            response.getWriter().write("{\"message\":\"Invalid token\"}");
        } catch (Exception e) {
            logger.error("Cannot set user authentication: " + e.getMessage());
            response.setContentType("application/json;charset=UTF-8");
            response.setStatus(401);
            response.getWriter().write("{\"message\":\"Authentication failed\"}");
        }
    }

    private String parseJwt(HttpServletRequest request) {
        String headerAuth = request.getHeader("Authorization");
        if (StringUtils.hasText(headerAuth) && headerAuth.startsWith("Bearer ")) {
            return headerAuth.substring(7);
        }
        return null;
    }
}
