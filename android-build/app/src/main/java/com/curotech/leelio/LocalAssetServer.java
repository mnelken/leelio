package com.curotech.leelio;

import android.content.res.AssetManager;
import android.util.Log;

import java.io.*;
import java.net.InetAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Micro Embedded HTTP Server for Android Assets
 * Serves web app files locally on 127.0.0.1:8080 to ensure full ES6 module & WebGL support
 * with 0 CORS restrictions and complete offline execution.
 */
public class LocalAssetServer {
    private static final String TAG = "LeelioAssetServer";
    private final AssetManager assetManager;
    private final int port;
    private ServerSocket serverSocket;
    private volatile boolean isRunning = false;
    private final ExecutorService threadPool = Executors.newCachedThreadPool();

    public LocalAssetServer(AssetManager assetManager, int preferredPort) {
        this.assetManager = assetManager;
        this.port = preferredPort;
    }

    public synchronized int start() throws IOException {
        int boundPort = port;
        try {
            serverSocket = new ServerSocket(boundPort, 50, InetAddress.getByName("127.0.0.1"));
        } catch (IOException e) {
            // Fallback to any available local port
            serverSocket = new ServerSocket(0, 50, InetAddress.getByName("127.0.0.1"));
            boundPort = serverSocket.getLocalPort();
        }

        isRunning = true;
        Log.i(TAG, "Local asset server running at http://127.0.0.1:" + boundPort + "/");

        new Thread(this::listenLoop, "AssetServer-Listener").start();
        return boundPort;
    }

    private void listenLoop() {
        while (isRunning && serverSocket != null && !serverSocket.isClosed()) {
            try {
                Socket client = serverSocket.accept();
                threadPool.execute(() -> handleClient(client));
            } catch (IOException e) {
                if (isRunning) {
                    Log.w(TAG, "Socket accept error: " + e.getMessage());
                }
            }
        }
    }

    private void handleClient(Socket client) {
        try (Socket s = client;
             InputStream in = s.getInputStream();
             OutputStream out = s.getOutputStream()) {

            BufferedReader reader = new BufferedReader(new InputStreamReader(in));
            String requestLine = reader.readLine();
            if (requestLine == null || requestLine.isEmpty()) return;

            String[] parts = requestLine.split(" ");
            if (parts.length < 2) return;

            String path = parts[1];
            int queryIdx = path.indexOf('?');
            if (queryIdx != -1) {
                path = path.substring(0, queryIdx);
            }
            if (path.startsWith("/")) {
                path = path.substring(1);
            }
            if (path.isEmpty()) {
                path = "index.html";
            }

            // Read asset
            InputStream assetStream = null;
            byte[] fileBytes = null;
            try {
                try {
                    assetStream = assetManager.open(path);
                } catch (IOException e1) {
                    try {
                        assetStream = assetManager.open(path.replace('/', '\\'));
                    } catch (IOException e2) {
                        assetStream = assetManager.open(path.replace('\\', '/'));
                    }
                }
                ByteArrayOutputStream byteBuf = new ByteArrayOutputStream();
                byte[] buffer = new byte[8192];
                int read;
                while ((read = assetStream.read(buffer)) != -1) {
                    byteBuf.write(buffer, 0, read);
                }
                fileBytes = byteBuf.toByteArray();
            } catch (IOException e) {
                Log.w(TAG, "Asset not found: " + path);
            } finally {
                if (assetStream != null) {
                    try { assetStream.close(); } catch (IOException ignored) {}
                }
            }

            if (fileBytes != null) {
                String mimeType = getMimeType(path);
                String headers = "HTTP/1.1 200 OK\r\n" +
                        "Content-Type: " + mimeType + "\r\n" +
                        "Content-Length: " + fileBytes.length + "\r\n" +
                        "Access-Control-Allow-Origin: *\r\n" +
                        "Connection: close\r\n\r\n";
                out.write(headers.getBytes("UTF-8"));
                out.write(fileBytes);
                out.flush();
            } else {
                String notFound = "HTTP/1.1 404 Not Found\r\nContent-Type: text/plain\r\nConnection: close\r\n\r\n404 File Not Found: " + path;
                out.write(notFound.getBytes("UTF-8"));
                out.flush();
            }
        } catch (Exception e) {
            Log.w(TAG, "Request handling error: " + e.getMessage());
        }
    }

    private String getMimeType(String path) {
        String lower = path.toLowerCase();
        if (lower.endsWith(".html")) return "text/html; charset=utf-8";
        if (lower.endsWith(".js")) return "application/javascript; charset=utf-8";
        if (lower.endsWith(".css")) return "text/css; charset=utf-8";
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".svg")) return "image/svg+xml";
        if (lower.endsWith(".glb")) return "model/gltf-binary";
        if (lower.endsWith(".gltf")) return "model/gltf+json";
        if (lower.endsWith(".json")) return "application/json";
        if (lower.endsWith(".wasm")) return "application/wasm";
        if (lower.endsWith(".mp4")) return "video/mp4";
        return "application/octet-stream";
    }

    public synchronized void stop() {
        isRunning = false;
        if (serverSocket != null) {
            try {
                serverSocket.close();
            } catch (IOException ignored) {}
        }
        threadPool.shutdownNow();
    }
}
