import com.sun.net.httpserver.*;
import java.io.*;
import java.net.*;
import java.nio.file.*;
import java.util.concurrent.*;

public class Server {
    public static void main(String[] args) throws Exception {
        int port = args.length > 0 ? Integer.parseInt(args[0]) : 8080;
        File rootDir = new File(System.getProperty("user.dir"));
        File publicDir = new File(rootDir, "public");

        HttpServer server = HttpServer.create(new InetSocketAddress("0.0.0.0", port), 0);
        server.setExecutor(Executors.newCachedThreadPool());

        server.createContext("/", exchange -> {
            try {
                String path = exchange.getRequestURI().getPath();
                if (path.startsWith("/")) path = path.substring(1);

                // Handle global CORS preflight OPTIONS
                if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                    Headers headers = exchange.getResponseHeaders();
                    headers.add("Access-Control-Allow-Origin", "*");
                    headers.add("Access-Control-Allow-Methods", "GET, POST, HEAD, OPTIONS");
                    headers.add("Access-Control-Allow-Headers", "*");
                    exchange.sendResponseHeaders(204, -1);
                    return;
                }

                // Endpoint: Client Error Feedback Loop
                if ("POST".equalsIgnoreCase(exchange.getRequestMethod()) && (path.equals("api/client-error") || path.equals("api/client-error/"))) {
                    ByteArrayOutputStream baos = new ByteArrayOutputStream();
                    try (InputStream is = exchange.getRequestBody()) {
                        byte[] buf = new byte[4096];
                        int r;
                        while ((r = is.read(buf)) != -1) baos.write(buf, 0, r);
                    }
                    String errorPayload = new String(baos.toByteArray(), java.nio.charset.StandardCharsets.UTF_8);
                    String timestamp = java.time.LocalDateTime.now().toString();
                    String formattedLog = "[" + timestamp + "] [BROWSER-ERROR] " + errorPayload;
                    
                    System.err.println("\n-------------------------------------------------------");
                    System.err.println("🚨 " + formattedLog);
                    System.err.println("-------------------------------------------------------\n");

                    try {
                        File logFile = new File(rootDir, "client_errors.log");
                        Files.writeString(logFile.toPath(), formattedLog + System.lineSeparator(),
                            StandardOpenOption.CREATE, StandardOpenOption.APPEND);
                    } catch (Exception ignored) {}

                    byte[] ok = "{\"status\":\"logged\"}".getBytes(java.nio.charset.StandardCharsets.UTF_8);
                    Headers headers = exchange.getResponseHeaders();
                    headers.add("Content-Type", "application/json");
                    headers.add("Access-Control-Allow-Origin", "*");
                    exchange.sendResponseHeaders(200, ok.length);
                    try (OutputStream os = exchange.getResponseBody()) { os.write(ok); }
                    return;
                }

                // Endpoint: Query recent client errors
                if ("GET".equalsIgnoreCase(exchange.getRequestMethod()) && (path.equals("api/client-errors") || path.equals("api/client-errors/"))) {
                    File logFile = new File(rootDir, "client_errors.log");
                    byte[] resp = logFile.exists() ? Files.readAllBytes(logFile.toPath()) : "No client errors logged yet.\n".getBytes(java.nio.charset.StandardCharsets.UTF_8);
                    Headers headers = exchange.getResponseHeaders();
                    headers.add("Content-Type", "text/plain; charset=utf-8");
                    headers.add("Access-Control-Allow-Origin", "*");
                    exchange.sendResponseHeaders(200, resp.length);
                    try (OutputStream os = exchange.getResponseBody()) { os.write(resp); }
                    return;
                }

                // Endpoint: Clear client errors
                if ("POST".equalsIgnoreCase(exchange.getRequestMethod()) && (path.equals("api/clear-client-errors") || path.equals("api/clear-client-errors/"))) {
                    File logFile = new File(rootDir, "client_errors.log");
                    if (logFile.exists()) logFile.delete();
                    byte[] ok = "{\"status\":\"cleared\"}".getBytes(java.nio.charset.StandardCharsets.UTF_8);
                    Headers headers = exchange.getResponseHeaders();
                    headers.add("Content-Type", "application/json");
                    headers.add("Access-Control-Allow-Origin", "*");
                    exchange.sendResponseHeaders(200, ok.length);
                    try (OutputStream os = exchange.getResponseBody()) { os.write(ok); }
                    return;
                }

                if ("POST".equalsIgnoreCase(exchange.getRequestMethod()) && (path.equals("api/save-sync") || path.equals("api/save-sync/"))) {
                    ByteArrayOutputStream baos = new ByteArrayOutputStream();
                    try (InputStream is = exchange.getRequestBody()) {
                        byte[] buf = new byte[8192];
                        int r;
                        while ((r = is.read(buf)) != -1) baos.write(buf, 0, r);
                    }
                    File outFile = new File(rootDir, "src/targetSyncData.json");
                    Files.write(outFile.toPath(), baos.toByteArray());
                    byte[] ok = ("{\"status\":\"ok\",\"bytes\":" + baos.size() + "}").getBytes();
                    exchange.getResponseHeaders().add("Content-Type", "application/json");
                    exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
                    exchange.sendResponseHeaders(200, ok.length);
                    try (OutputStream os = exchange.getResponseBody()) { os.write(ok); }
                    System.out.println(">>> Target sync data saved: " + baos.size() + " bytes to src/targetSyncData.json");
                    return;
                }

                // Favicon clean handling
                if (path.equals("favicon.ico")) {
                    File favFile = new File(rootDir, "favicon.ico");
                    if (!favFile.exists()) favFile = new File(publicDir, "favicon.ico");
                    if (favFile.exists()) {
                        Headers headers = exchange.getResponseHeaders();
                        headers.add("Content-Type", "image/x-icon");
                        headers.add("Access-Control-Allow-Origin", "*");
                        exchange.sendResponseHeaders(200, favFile.length());
                        try (OutputStream os = exchange.getResponseBody(); InputStream is = new FileInputStream(favFile)) {
                            byte[] buf = new byte[4096];
                            int r;
                            while ((r = is.read(buf)) != -1) os.write(buf, 0, r);
                        }
                    } else {
                        Headers headers = exchange.getResponseHeaders();
                        headers.add("Access-Control-Allow-Origin", "*");
                        exchange.sendResponseHeaders(204, -1);
                    }
                    return;
                }

                if (path.isEmpty()) path = "index.html";

                File file = new File(rootDir, path);
                if (!file.exists() || file.isDirectory()) {
                    file = new File(publicDir, path);
                }

                if (file.exists() && file.isFile()) {
                    String mime = getMime(file.getName());
                    Headers headers = exchange.getResponseHeaders();
                    headers.add("Content-Type", mime);
                    headers.add("Accept-Ranges", "bytes");
                    headers.add("Access-Control-Allow-Origin", "*");
                    headers.add("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
                    headers.add("Access-Control-Allow-Headers", "*");

                    if (file.getName().endsWith(".apk")) {
                        headers.add("Content-Disposition", "attachment; filename=\"Leelio.apk\"");
                    }
                    long len = file.length();
                    exchange.sendResponseHeaders(200, len);
                    if (!"HEAD".equalsIgnoreCase(exchange.getRequestMethod())) {
                        try (OutputStream os = exchange.getResponseBody(); InputStream is = new FileInputStream(file)) {
                            byte[] buf = new byte[32768];
                            int r;
                            while ((r = is.read(buf)) != -1) os.write(buf, 0, r);
                        }
                    } else {
                        exchange.getResponseBody().close();
                    }
                } else {
                    byte[] notFound = ("404 Not Found: " + path).getBytes();
                    exchange.sendResponseHeaders(404, notFound.length);
                    try (OutputStream os = exchange.getResponseBody()) { os.write(notFound); }
                }
            } catch (Exception e) {
                try {
                    exchange.sendResponseHeaders(500, 0);
                    exchange.getResponseBody().close();
                } catch (Exception ignored) {}
            }
        });

        server.start();
        System.out.println("=======================================================");
        System.out.println("  ✨ Leelio Universal Server Running! ✨");
        System.out.println("  Laptop Browser: http://localhost:" + port + "/");
        System.out.println("  Phone / Wi-Fi:  http://192.168.2.184:" + port + "/");
        System.out.println("  Download APK:   http://192.168.2.184:" + port + "/Leelio.apk");
        System.out.println("=======================================================");
        Thread.currentThread().join();
    }

    static String getMime(String name) {
        String lower = name.toLowerCase();
        if (lower.endsWith(".html")) return "text/html; charset=utf-8";
        if (lower.endsWith(".js")) return "application/javascript; charset=utf-8";
        if (lower.endsWith(".css")) return "text/css; charset=utf-8";
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".ico")) return "image/x-icon";
        if (lower.endsWith(".svg")) return "image/svg+xml";
        if (lower.endsWith(".glb")) return "model/gltf-binary";
        if (lower.endsWith(".gltf")) return "model/gltf+json";
        if (lower.endsWith(".json")) return "application/json";
        if (lower.endsWith(".wasm")) return "application/wasm";
        if (lower.endsWith(".mp4")) return "video/mp4";
        if (lower.endsWith(".apk")) return "application/vnd.android.package-archive";
        return "application/octet-stream";
    }
}
