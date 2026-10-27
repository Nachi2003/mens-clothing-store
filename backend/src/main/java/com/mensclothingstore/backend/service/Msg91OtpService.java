package com.mensclothingstore.backend.service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class Msg91OtpService {
    private final String authKey;
    private final String templateId;
    private final HttpClient client = HttpClient.newHttpClient();
    private final ObjectMapper mapper = new ObjectMapper();

    public Msg91OtpService(@Value("${MSG91_AUTHKEY:}") String authKey,
                           @Value("${MSG91_TEMPLATE_ID:}") String templateId) {
        this.authKey = authKey;
        this.templateId = templateId;
    }

    public void send(String indianPhone) {
        ensureConfigured();
        String mobile = "91" + indianPhone;
        String url = "https://control.msg91.com/api/v5/otp?mobile=" + enc(mobile)
                + "&template_id=" + enc(templateId) + "&otp_length=6&otp_expiry=5&realTimeResponse=1";
        try {
            HttpRequest request = HttpRequest.newBuilder(URI.create(url))
                    .header("authkey", authKey).header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString("{}")) .build();
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            JsonNode body = mapper.readTree(response.body());
            if (response.statusCode() < 200 || response.statusCode() >= 300
                    || !"success".equalsIgnoreCase(body.path("type").asText())) {
                throw new IllegalStateException("SMS provider could not send OTP. Check MSG91 credentials, template, and account setup.");
            }
        } catch (IllegalStateException ex) { throw ex; }
        catch (Exception ex) { throw new IllegalStateException("Could not contact SMS provider. Please try again later."); }
    }

    public boolean verify(String indianPhone, String otp) {
        ensureConfigured();
        String url = "https://control.msg91.com/api/v5/otp/verify?mobile=" + enc("91" + indianPhone)
                + "&otp=" + enc(otp);
        try {
            HttpRequest request = HttpRequest.newBuilder(URI.create(url)).header("authkey", authKey)
                    .GET().build();
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            JsonNode body = mapper.readTree(response.body());
            return response.statusCode() >= 200 && response.statusCode() < 300
                    && ("OTP verified success".equalsIgnoreCase(body.path("message").asText())
                    || "success".equalsIgnoreCase(body.path("type").asText()));
        } catch (Exception ex) {
            throw new IllegalStateException("Could not verify OTP with SMS provider. Please try again.");
        }
    }

    private void ensureConfigured() {
        if (authKey.isBlank() || templateId.isBlank()) {
            throw new IllegalStateException("SMS OTP is not configured. Set MSG91_AUTHKEY and MSG91_TEMPLATE_ID in the backend environment.");
        }
    }
    private String enc(String value) { return URLEncoder.encode(value, StandardCharsets.UTF_8); }
}
