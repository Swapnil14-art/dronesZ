package com.dronestore.system.dto;

public class LoginResponse {

    private String token;
    private String tokenType = "Bearer";
    private long expiresIn;
    private AdminDto admin;

    public LoginResponse() {
    }

    public LoginResponse(String token, long expiresIn, AdminDto admin) {
        this.token = token;
        this.expiresIn = expiresIn;
        this.admin = admin;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getTokenType() {
        return tokenType;
    }

    public void setTokenType(String tokenType) {
        this.tokenType = tokenType;
    }

    public long getExpiresIn() {
        return expiresIn;
    }

    public void setExpiresIn(long expiresIn) {
        this.expiresIn = expiresIn;
    }

    public AdminDto getAdmin() {
        return admin;
    }

    public void setAdmin(AdminDto admin) {
        this.admin = admin;
    }
}
