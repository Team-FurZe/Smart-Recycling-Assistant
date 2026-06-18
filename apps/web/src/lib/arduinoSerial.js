const RIGHT_CLASSES = new Set(["plastic", "paper"]);
const LEFT_CLASSES = new Set(["glass", "metal"]);

let serialPort = null;
let serialWriter = null;

function normalizeLabel(label) {
  return String(label || "").trim().toLowerCase();
}

export function getArduinoCommandForLabel(label) {
  const normalized = normalizeLabel(label);

  if (RIGHT_CLASSES.has(normalized)) return "d";
  if (LEFT_CLASSES.has(normalized)) return "a";

  return null;
}

export function getArduinoDirectionForLabel(label) {
  const command = getArduinoCommandForLabel(label);

  if (command === "d") return "right";
  if (command === "a") return "left";

  return null;
}

export async function sendArduinoSortCommand(label) {
  const command = getArduinoCommandForLabel(label);

  if (!command) {
    throw new Error("Arduino sorting is only available for plastic, paper, glass, and metal.");
  }

  if (!("serial" in navigator)) {
    throw new Error("Web Serial is not supported in this browser. Use Chrome or Edge on localhost/HTTPS.");
  }

  if (!serialPort) {
    serialPort = await navigator.serial.requestPort();
  }

  if (!serialPort.readable && !serialPort.writable) {
    try {
      await serialPort.open({ baudRate: 9600 });
      await new Promise((resolve) => window.setTimeout(resolve, 1200));
    } catch {
      serialPort = null;
      throw new Error(
        "Could not open the Arduino serial port. Close Arduino IDE Serial Monitor/Serial Plotter, then try again."
      );
    }
  }

  if (!serialWriter) {
    serialWriter = serialPort.writable.getWriter();
  }

  const data = new TextEncoder().encode(command);
  await serialWriter.write(data);

  return command;
}

export async function disconnectArduino() {
  if (serialWriter) {
    serialWriter.releaseLock();
    serialWriter = null;
  }

  if (serialPort) {
    await serialPort.close();
    serialPort = null;
  }
}
