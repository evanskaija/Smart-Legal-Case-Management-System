package com.slcms.service;

import com.google.api.client.auth.oauth2.Credential;
import com.google.api.client.extensions.java6.auth.oauth2.AuthorizationCodeInstalledApp;
import com.google.api.client.extensions.jetty.auth.oauth2.LocalServerReceiver;
import com.google.api.client.googleapis.auth.oauth2.GoogleAuthorizationCodeFlow;
import com.google.api.client.googleapis.auth.oauth2.GoogleClientSecrets;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.client.util.store.FileDataStoreFactory;
import com.google.api.services.gmail.Gmail;
import com.google.api.services.gmail.GmailScopes;
import com.google.api.services.gmail.model.Message;
import com.google.api.services.gmail.model.Profile;
import jakarta.mail.Address;
import jakarta.mail.Session;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;

/**
 * Service for Google Gmail API OAuth2 Client Communication.
 * Strictly enforces slcmslegal@gmail.com as the single authorized sender.
 */
@Service
public class GmailApiService {

    private static final Logger log = LoggerFactory.getLogger(GmailApiService.class);
    private static final JsonFactory JSON_FACTORY = GsonFactory.getDefaultInstance();
    private static final List<String> SCOPES = Arrays.asList(
            GmailScopes.GMAIL_SEND,
            "https://www.googleapis.com/auth/userinfo.email"
    );

    @Value("${slcms.gmail.sender:slcmslegal@gmail.com}")
    private String officialSender;

    @Value("${slcms.gmail.credentials-path:secure/gmail-credentials.json}")
    private String credentialsPath;

    @Value("${slcms.gmail.tokens-directory:tokens}")
    private String tokensDirectory;

    public String getOfficialSender() {
        return officialSender;
    }

    public String getOfficialDisplayName() {
        return "SLCMS Law Firm";
    }

    /**
     * Checks if credentials file exists and whether valid OAuth tokens are stored.
     */
    public Map<String, Object> getStatus() {
        Map<String, Object> status = new LinkedHashMap<>();
        status.put("officialSender", officialSender);
        status.put("displayName", getOfficialDisplayName());

        File credsFile = resolveFile(credentialsPath);
        boolean credsExist = credsFile.exists() && credsFile.length() > 0;
        status.put("credentialsConfigured", credsExist);
        status.put("credentialsPath", credsFile.getAbsolutePath());

        File tokenDir = resolveFile(tokensDirectory);
        status.put("tokensDirectory", tokenDir.getAbsolutePath());

        boolean isAuthorized = false;
        String verifiedAccount = null;

        if (credsExist) {
            try {
                NetHttpTransport httpTransport = GoogleNetHttpTransport.newTrustedTransport();
                GoogleAuthorizationCodeFlow flow = buildFlow(httpTransport, credsFile, tokenDir);
                Credential credential = flow.loadCredential("user");
                if (credential != null && credential.getAccessToken() != null) {
                    Gmail service = new Gmail.Builder(httpTransport, JSON_FACTORY, credential)
                            .setApplicationName("SLCMS Law Firm")
                            .build();
                    try {
                        Profile profile = service.users().getProfile("me").execute();
                        verifiedAccount = profile.getEmailAddress();
                    } catch (Exception ignored) {}

                    if (verifiedAccount == null) {
                        try {
                            com.google.api.client.http.HttpRequestFactory requestFactory = httpTransport.createRequestFactory(credential);
                            com.google.api.client.http.GenericUrl url = new com.google.api.client.http.GenericUrl("https://www.googleapis.com/oauth2/v2/userinfo");
                            com.google.api.client.http.HttpRequest req = requestFactory.buildGetRequest(url);
                            com.google.api.client.http.HttpResponse resp = req.execute();
                            Map<?, ?> info = JSON_FACTORY.fromInputStream(resp.getContent(), Map.class);
                            if (info != null && info.get("email") != null) {
                                verifiedAccount = info.get("email").toString();
                            }
                        } catch (Exception ignored) {}
                    }

                    if (officialSender.equalsIgnoreCase(verifiedAccount)) {
                        isAuthorized = true;
                    }
                }
            } catch (Exception e) {
                log.debug("Error checking OAuth status: {}", e.getMessage());
            }
        }

        status.put("isAuthorized", isAuthorized);
        status.put("verifiedAccount", verifiedAccount);
        status.put("statusLabel", isAuthorized ? "Connected (" + officialSender + ")" : "Authorization Required");
        return status;
    }

    /**
     * Obtains or refreshes authorized Gmail service instance.
     * Enforces that the authorized Google account is strictly slcmslegal@gmail.com.
     */
    private synchronized Gmail getGmailService() throws Exception {
        File credsFile = resolveFile(credentialsPath);
        if (!credsFile.exists() || credsFile.length() == 0) {
            throw new FileNotFoundException("Gmail credentials file not found at: " + credsFile.getAbsolutePath());
        }

        File tokenDir = resolveFile(tokensDirectory);
        if (!tokenDir.exists()) {
            tokenDir.mkdirs();
        }

        NetHttpTransport httpTransport = GoogleNetHttpTransport.newTrustedTransport();
        GoogleAuthorizationCodeFlow flow = buildFlow(httpTransport, credsFile, tokenDir);

        Credential credential = flow.loadCredential("user");
        if (credential == null || credential.getAccessToken() == null) {
            log.info("Starting local OAuth2 authorization flow for {}", officialSender);
            // Open local receiver to capture OAuth authorization
            LocalServerReceiver receiver = new LocalServerReceiver.Builder()
                    .setPort(8888)
                    .setCallbackPath("/Callback")
                    .build();
            credential = new AuthorizationCodeInstalledApp(flow, receiver).authorize("user");
        }

        Gmail service = new Gmail.Builder(httpTransport, JSON_FACTORY, credential)
                .setApplicationName("SLCMS Law Firm")
                .build();

        // Account Verification Rule:
        // Reject sending if the authorized Google account is not slcmslegal@gmail.com
        String authorizedEmail = null;
        try {
            Profile profile = service.users().getProfile("me").execute();
            authorizedEmail = profile.getEmailAddress();
        } catch (Exception e) {
            log.debug("users.getProfile error: {}, checking oauth2 userinfo", e.getMessage());
        }

        if (authorizedEmail == null) {
            try {
                com.google.api.client.http.HttpRequestFactory requestFactory = httpTransport.createRequestFactory(credential);
                com.google.api.client.http.GenericUrl url = new com.google.api.client.http.GenericUrl("https://www.googleapis.com/oauth2/v2/userinfo");
                com.google.api.client.http.HttpRequest req = requestFactory.buildGetRequest(url);
                com.google.api.client.http.HttpResponse resp = req.execute();
                Map<?, ?> info = JSON_FACTORY.fromInputStream(resp.getContent(), Map.class);
                if (info != null && info.get("email") != null) {
                    authorizedEmail = info.get("email").toString();
                }
            } catch (Exception ex) {
                log.warn("Could not retrieve oauth2 userinfo: {}", ex.getMessage());
            }
        }

        log.info("Authorized Google account verified: {}", authorizedEmail);

        if (authorizedEmail == null || !authorizedEmail.equalsIgnoreCase(officialSender)) {
            // Reject unauthorized user and delete invalid token
            try {
                flow.getCredentialDataStore().delete("user");
            } catch (Exception ignored) {}

            throw new SecurityException("Unauthorized Google account: " + (authorizedEmail != null ? authorizedEmail : "Unknown") +
                    ". Only the official firm address " + officialSender + " is authorized for SLCMS client messaging. Please sign in specifically as " + officialSender + ".");
        }

        return service;
    }

    /**
     * Sends an email through the Gmail API using slcmslegal@gmail.com.
     * Returns the Gmail Message ID on success.
     */
    public synchronized String sendEmail(String recipientEmail, String subject, String bodyText) throws Exception {
        if (recipientEmail == null || recipientEmail.trim().isEmpty() || !recipientEmail.contains("@")) {
            throw new IllegalArgumentException("Recipient email address is required.");
        }

        Gmail service = getGmailService();

        // Construct RFC 2822 MIME Message
        Properties props = new Properties();
        Session session = Session.getDefaultInstance(props, null);
        MimeMessage email = new MimeMessage(session);

        // Required Sender format: SLCMS Law Firm <slcmslegal@gmail.com>
        email.setFrom(new InternetAddress(officialSender, getOfficialDisplayName(), "UTF-8"));
        email.setReplyTo(new Address[]{ new InternetAddress(officialSender) });
        email.addRecipient(jakarta.mail.Message.RecipientType.TO, new InternetAddress(recipientEmail.trim()));
        email.setSubject(subject != null ? subject : "Communication from SLCMS Law Firm", "UTF-8");
        email.setText(bodyText != null ? bodyText : "", "UTF-8");

        ByteArrayOutputStream buffer = new ByteArrayOutputStream();
        email.writeTo(buffer);
        byte[] rawBytes = buffer.toByteArray();
        String encodedEmail = Base64.getUrlEncoder().withoutPadding().encodeToString(rawBytes);

        Message message = new Message();
        message.setRaw(encodedEmail);

        log.info("Dispatching email via Gmail API to {} with sender {}", recipientEmail, officialSender);
        Message sentMessage = service.users().messages().send("me", message).execute();

        String messageId = sentMessage.getId();
        if (messageId == null || messageId.trim().isEmpty()) {
            throw new IllegalStateException("Gmail API did not return a valid message ID.");
        }

        log.info("Email successfully sent via Gmail API. Gmail Message ID: {}", messageId);
        return messageId;
    }

    /**
     * Explicit trigger to initiate or verify authorization.
     */
    public Map<String, Object> authorize() throws Exception {
        getGmailService();
        return getStatus();
    }

    private GoogleAuthorizationCodeFlow buildFlow(NetHttpTransport httpTransport, File credsFile, File tokenDir) throws IOException {
        try (InputStream in = new FileInputStream(credsFile)) {
            GoogleClientSecrets clientSecrets = GoogleClientSecrets.load(JSON_FACTORY, new InputStreamReader(in, StandardCharsets.UTF_8));
            return new GoogleAuthorizationCodeFlow.Builder(
                    httpTransport, JSON_FACTORY, clientSecrets, SCOPES)
                    .setDataStoreFactory(new FileDataStoreFactory(tokenDir))
                    .setAccessType("offline")
                    .build();
        }
    }

    private File resolveFile(String path) {
        File file = new File(path);
        if (file.isAbsolute()) {
            return file;
        }
        // If current directory is project root (contains backend/), resolve inside backend/
        File backendDir = new File("backend");
        if (backendDir.isDirectory() && new File(backendDir, "pom.xml").exists()) {
            return new File(backendDir, path);
        }
        return file;
    }
}
