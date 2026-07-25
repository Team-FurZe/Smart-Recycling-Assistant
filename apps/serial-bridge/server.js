import http from "node:http";
import { SerialPort } from "serialport";

const HOST = process.env.SMART_BIN_BRIDGE_HOST || "0.0.0.0";
const PORT = Number(process.env.SMART_BIN_BRIDGE_PORT || 8090);
const SERIAL_PORT = process.env.SMART_BIN_SERIAL_PORT || "COM5";
const BAUD_RATE = Number(process.env.SMART_BIN_BAUD_RATE || 9600);
const ALLOWED_COMMANDS = new Set(["a", "d", "s"]);

let serialPort = null;

function sendJson(res, status, payload) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1024) {
        req.destroy();
        reject(new Error("Request body is too large."));
      }
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getSerialPort() {
  if (serialPort?.isOpen) {
    return serialPort;
  }

  serialPort = new SerialPort({
    path: SERIAL_PORT,
    baudRate: BAUD_RATE,
    autoOpen: false,
  });

  await new Promise((resolve, reject) => {
    serialPort.open((err) => {
      if (err) {
        reject(err);
        return;
      }

      resolve();
    });
  });

  await wait(1200);
  return serialPort;
}

async function writeCommand(command) {
  const port = await getSerialPort();

  await new Promise((resolve, reject) => {
    port.write(command, "ascii", (writeError) => {
      if (writeError) {
        reject(writeError);
        return;
      }

      port.drain((drainError) => {
        if (drainError) {
          reject(drainError);
          return;
        }

        resolve();
      });
    });
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/health") {
    sendJson(res, 200, { status: "ok", serialPort: SERIAL_PORT });
    return;
  }

  if (req.method !== "POST" || req.url !== "/sort") {
    sendJson(res, 404, { message: "Not found." });
    return;
  }

  try {
    const body = await readBody(req);
    const payload = body ? JSON.parse(body) : {};
    const command = String(payload.command || "").trim().toLowerCase();

    if (!ALLOWED_COMMANDS.has(command)) {
      sendJson(res, 400, { message: "Command must be one of: a, d, s." });
      return;
    }

    await writeCommand(command);
    sendJson(res, 200, { message: "Detection is sent to Smart Recycling Bin." });
  } catch (err) {
    serialPort = null;
    const message = String(err?.message || "");
    if (message.toLowerCase().includes("access denied")) {
      sendJson(res, 500, {
        message:
          `${SERIAL_PORT} is already in use. Close Arduino IDE Serial Monitor/Serial Plotter and any browser tab that used Web Serial, then try again.`,
      });
      return;
    }

    sendJson(res, 500, {
      message:
        message ||
        "Could not send command to Arduino. Close Arduino IDE Serial Monitor/Serial Plotter, then try again.",
    });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Smart bin serial bridge listening on http://${HOST}:${PORT}`);
  console.log(`Arduino serial port: ${SERIAL_PORT} @ ${BAUD_RATE}`);
});
