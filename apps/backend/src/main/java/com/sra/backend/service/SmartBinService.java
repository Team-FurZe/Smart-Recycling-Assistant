package com.sra.backend.service;

import com.fazecast.jSerialComm.SerialPort;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Locale;
import java.util.Optional;

@Service
public class SmartBinService {

    @Value("${smart-bin.serial.port:}")
    private String configuredPort;

    @Value("${smart-bin.serial.baud-rate:9600}")
    private int baudRate;

    @Value("${smart-bin.bridge.url:}")
    private String bridgeUrl;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(3))
            .build();

    public synchronized void sort(String label) {
        String command = commandForLabel(label)
                .orElseThrow(() -> new RuntimeException("Smart bin sorting is only available for plastic, paper, glass, and metal."));

        if (bridgeUrl != null && !bridgeUrl.isBlank()) {
            sendViaBridge(command);
            return;
        }

        SerialPort port = findPort()
                .orElseThrow(() -> new RuntimeException("Arduino serial port was not found. Check the USB connection."));

        port.setComPortParameters(baudRate, 8, SerialPort.ONE_STOP_BIT, SerialPort.NO_PARITY);
        port.setComPortTimeouts(SerialPort.TIMEOUT_WRITE_BLOCKING, 0, 2000);

        try {
            if (!port.openPort(2000)) {
                throw new RuntimeException("Could not open the Arduino serial port. Close Arduino IDE Serial Monitor/Serial Plotter, then try again.");
            }

            sleepAfterOpen();

            byte[] payload = command.getBytes(StandardCharsets.US_ASCII);
            int written = port.writeBytes(payload, payload.length);
            if (written != payload.length) {
                throw new RuntimeException("Arduino command could not be sent.");
            }
        } finally {
            if (port.isOpen()) {
                port.closePort();
            }
        }
    }

    private Optional<String> commandForLabel(String label) {
        String normalized = label == null ? "" : label.trim().toUpperCase(Locale.ROOT);

        return switch (normalized) {
            case "PLASTIC", "PAPER" -> Optional.of("d");
            case "GLASS", "METAL" -> Optional.of("a");
            default -> Optional.empty();
        };
    }

    private void sendViaBridge(String command) {
        String endpoint = bridgeUrl.trim().replaceAll("/+$", "") + "/sort";
        String body = "{\"command\":\"" + command + "\"}";
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(endpoint))
                .timeout(Duration.ofSeconds(6))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(body, StandardCharsets.UTF_8))
                .build();

        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new RuntimeException(response.body());
            }
        } catch (IOException e) {
            throw new RuntimeException("Smart bin bridge is not reachable. Start the serial bridge on the computer that has Arduino connected.");
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Smart bin bridge request was interrupted.");
        }
    }

    private Optional<SerialPort> findPort() {
        SerialPort[] ports = SerialPort.getCommPorts();

        if (configuredPort != null && !configuredPort.isBlank()) {
            String wanted = configuredPort.trim();
            for (SerialPort port : ports) {
                if (port.getSystemPortName().equalsIgnoreCase(wanted)
                        || port.getDescriptivePortName().equalsIgnoreCase(wanted)) {
                    return Optional.of(port);
                }
            }
        }

        for (SerialPort port : ports) {
            String description = (port.getDescriptivePortName() + " " + port.getPortDescription()).toLowerCase(Locale.ROOT);
            if (description.contains("arduino")
                    || description.contains("ch340")
                    || description.contains("usb serial")
                    || description.contains("usb-serial")) {
                return Optional.of(port);
            }
        }

        return ports.length > 0 ? Optional.of(ports[0]) : Optional.empty();
    }

    private void sleepAfterOpen() {
        try {
            Thread.sleep(1200);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Arduino connection was interrupted.");
        }
    }
}
