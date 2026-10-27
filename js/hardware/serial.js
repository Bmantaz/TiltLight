// Line-based Web Serial connection. Knows nothing about the game; see board.js for the protocol.

const BAUD = 115200;
const MAX_LINE = 512;

let port = null, reader = null, writer = null, pipes = [];

export const serialSupported = () => 'serial' in navigator;
export const isConnected = () => writer !== null;

export function send(line){
  writer?.write(line + '\n').catch(() => {});
}

/**
 * Ask the user for a port and open it. Resolves once connected; rejects if they cancel
 * or the port can't be opened. onLine(text) gets each received line, onClose() fires once
 * when the connection ends.
 */
export async function connect({ onLine, onClose }){
  port = await navigator.serial.requestPort();
  await port.open({ baudRate: BAUD });
  try { await port.setSignals({ dataTerminalReady: true, requestToSend: true }); } catch {}

  const enc = new TextEncoderStream(), dec = new TextDecoderStream();
  pipes = [enc.readable.pipeTo(port.writable), port.readable.pipeTo(dec.writable)];
  pipes.forEach(p => p.catch(() => {}));
  writer = enc.writable.getWriter();
  reader = dec.readable.getReader();

  readLines(onLine).then(close).then(onClose);
}

async function readLines(onLine){
  let buf = '';
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += value;
      let i;
      while ((i = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, i).trim();
        buf = buf.slice(i + 1);
        if (line) {
          try { onLine(line); } catch (e) { console.error(e); }
        }
      }
      if (buf.length > MAX_LINE) buf = '';   // garbage with no newline; drop it
    }
  } catch {}
}

/** Release the streams and close the port so the same board can be connected again. */
async function close(){
  const w = writer;
  writer = null;
  try { await reader.cancel(); } catch {}
  try { await w.close(); } catch {}
  await Promise.race([Promise.allSettled(pipes), new Promise(r => setTimeout(r, 500))]);
  try { await port.close(); } catch {}
  port = reader = null;
  pipes = [];
}
