package com.garage.dto.response;

public class JwtResponse {
    private String token;
    private String type;
    private Long id;
    private String username;
    private String email;
    private String fullName;
    private String role;
    private java.util.Set<String> roles;

    public JwtResponse() {}

    public JwtResponse(String token, Long id, String username, String email, String fullName, java.util.Set<String> roles) {
        this.token = token;
        this.type = "Bearer";
        this.id = id;
        this.username = username;
        this.email = email;
        this.fullName = fullName;
        this.roles = roles;
        if (roles != null && !roles.isEmpty()) {
            this.role = roles.iterator().next();
        }
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public java.util.Set<String> getRoles() { return roles; }
    public void setRoles(java.util.Set<String> roles) { this.roles = roles; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
}
