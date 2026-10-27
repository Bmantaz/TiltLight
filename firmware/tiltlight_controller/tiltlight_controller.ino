/*
  Tiltlight controller
  Board: Arduino Oplà IoT Kit (MKR WiFi 1010 + MKR IoT Carrier)
  Library: Arduino_MKRIoTCarrier (install from Library Manager)

  Sends to the game (115200 baud, one message per line):
    A,<ax>,<ay>         accelerometer X/Y in g, about 60 times per second
    B,<n>               touch button n (0-4) was pressed
    E,<n>               touch button n was released (level-up picks need a 2 s hold)

  Receives from the game:
    H                   player got hit           -> red flash + buzz
    U,c0,c1,c3,c4       level-up options (hex RRGGBB) for buttons 00,01,03,04
    C                   level-up choice made     -> option LEDs off
    S,<0-100>           super charge             -> LED 02 fills up, pulses when ready
    N                   super used               -> white flash + sweep sound
    D,hp,max,lvl,secs   stats for the round screen
    G                   game over
    R                   new run
    O,<0|1>             board held upright / upside down -> screen rotates to stay readable
*/

#include <Arduino_MKRIoTCarrier.h>

// Declared up here so the Arduino IDE's auto-generated function prototypes can see it.
struct Note { uint16_t f; uint16_t ms; };

MKRIoTCarrier carrier;

// Set to false if your Oplà is NOT inside its plastic case (changes touch sensitivity).
const bool USING_PLASTIC_CASE = true;

const unsigned long ACCEL_MS = 16;     // ~60 tilt readings per second
const uint8_t LED_BRIGHTNESS = 25;     // 0-255
const unsigned long HOLD_MS = 2000;    // level-up hold time; keep in sync with HOLD_MS in js/config/controls.js

const touchButtons PADS[5] = { TOUCH0, TOUCH1, TOUCH2, TOUCH3, TOUCH4 };

// ---------------------------------------------------------------- game state
int hp = 100, maxHp = 100, lvl = 1, secs = 0;
int superPct = 0;
bool pickMode = false;
bool gameOver = false;
bool inGame = false;
int heldPad = -1;                      // pad currently touched, -1 if none
unsigned long holdStart = 0;
uint8_t baseRotation = 0;              // display rotation the library starts with

// ---------------------------------------------------------------- LEDs
uint32_t baseColor[5] = { 0, 0, 0, 0, 0 };
uint32_t flashColor = 0;
unsigned long flashUntil = 0;

void setLed(int i, uint32_t rgb) {
  uint8_t r = (rgb >> 16) & 0xFF;
  uint8_t g = (rgb >> 8) & 0xFF;
  uint8_t b = rgb & 0xFF;
  // The carrier's LEDs take (index, green, red, blue).
  // If colours look swapped on your board, change this to (i, r, g, b).
  carrier.leds.setPixelColor(i, g, r, b);
}

uint32_t scaleColor(uint32_t c, float k) {
  if (k < 0) k = 0;
  if (k > 1) k = 1;
  uint8_t r = ((c >> 16) & 0xFF) * k;
  uint8_t g = ((c >> 8) & 0xFF) * k;
  uint8_t b = (c & 0xFF) * k;
  return ((uint32_t)r << 16) | ((uint32_t)g << 8) | b;
}

uint32_t superColor(unsigned long now) {
  if (superPct >= 100) {
    float k = 0.55 + 0.45 * sin(now / 110.0);
    return scaleColor(0xFFC830, k);
  }
  return scaleColor(0xFF8A10, superPct / 100.0 * 0.6);
}

void flash(uint32_t color, unsigned long ms) {
  flashColor = color;
  flashUntil = millis() + ms;
}

float holdProgress(unsigned long now) {
  float p = (now - holdStart) / (float)HOLD_MS;
  return p > 1 ? 1 : p;
}

void updateLeds() {
  unsigned long now = millis();
  bool holding = pickMode && heldPad >= 0 && heldPad != 2;
  for (int i = 0; i < 5; i++) {
    uint32_t c;
    if (now < flashUntil) c = flashColor;
    else if (i == 2 && inGame && !gameOver) c = superColor(now);
    // holding an option: its LED fills up over HOLD_MS, the others dim
    else if (holding) c = scaleColor(baseColor[i], i == heldPad ? 0.3 + 0.7 * holdProgress(now) : 0.15);
    else c = baseColor[i];
    setLed(i, c);
  }
  carrier.leds.show();
}

// ---------------------------------------------------------------- buzzer (non-blocking)
const Note SND_HIT[]     = { {220, 40}, {150, 70} };
const Note SND_LEVELUP[] = { {523, 70}, {659, 70}, {784, 70}, {1047, 150} };
const Note SND_PICK[]    = { {880, 60} };
const Note SND_READY[]   = { {1200, 60}, {0, 40}, {1500, 80} };
const Note SND_NOVA[]    = { {300, 45}, {450, 45}, {700, 45}, {1000, 55}, {1400, 130} };
const Note SND_OVER[]    = { {392, 180}, {330, 180}, {262, 180}, {196, 420} };
const Note SND_START[]   = { {660, 60}, {0, 30}, {990, 100} };

#define PLAY(x) play(x, sizeof(x) / sizeof(x[0]))

const Note* seq = nullptr;
int seqLen = 0, seqIdx = 0;
unsigned long noteEnd = 0;

void startNote() {
  if (seq[seqIdx].f) carrier.Buzzer.sound(seq[seqIdx].f);
  else carrier.Buzzer.noSound();
  noteEnd = millis() + seq[seqIdx].ms;
}

void play(const Note* s, int len) {
  seq = s;
  seqLen = len;
  seqIdx = 0;
  startNote();
}

void updateBuzzer() {
  if (!seq) return;
  if (millis() >= noteEnd) {
    seqIdx++;
    if (seqIdx >= seqLen) {
      carrier.Buzzer.noSound();
      seq = nullptr;
      return;
    }
    startNote();
  }
}

// ---------------------------------------------------------------- round screen
bool screenDirty = true;
bool needFullClear = true;
unsigned long lastDraw = 0;

const uint16_t COL_BG    = 0x0000;
const uint16_t COL_AMBER = 0xFDA8;
const uint16_t COL_MUTED = 0x7BEF;
const uint16_t COL_HP    = 0xFA8E;
const uint16_t COL_FRAME = 0x31A6;

void centerText(const char* s, int y, int size, uint16_t col) {
  int w = strlen(s) * 6 * size;
  carrier.display.setTextSize(size);
  carrier.display.setTextColor(col, COL_BG);
  carrier.display.setCursor((240 - w) / 2, y);
  carrier.display.print(s);
}

void drawIdle() {
  carrier.display.fillScreen(COL_BG);
  centerText("TILTLIGHT", 90, 3, COL_AMBER);
  centerText("open the game", 135, 2, COL_MUTED);
  needFullClear = true;
}

void drawScreen() {
  if (!inGame) { drawIdle(); return; }
  if (needFullClear) {
    carrier.display.fillScreen(COL_BG);
    needFullClear = false;
  }
  char buf[20];

  carrier.display.fillRect(20, 40, 200, 20, COL_BG);
  if (gameOver)      centerText("GAME OVER", 42, 2, 0xF800);
  else if (pickMode) centerText("LEVEL UP!", 42, 2, COL_AMBER);
  else               centerText("LEVEL", 42, 2, COL_MUTED);

  carrier.display.fillRect(40, 68, 160, 45, COL_BG);
  snprintf(buf, sizeof buf, "%d", lvl);
  centerText(buf, 72, 5, 0xFFFF);

  int bw = 150, bx = 45, by = 132;
  carrier.display.drawRect(bx - 2, by - 2, bw + 4, 18, COL_FRAME);
  int fill = maxHp > 0 ? (long)bw * constrain(hp, 0, maxHp) / maxHp : 0;
  carrier.display.fillRect(bx, by, fill, 14, COL_HP);
  carrier.display.fillRect(bx + fill, by, bw - fill, 14, COL_BG);

  carrier.display.fillRect(30, 156, 180, 18, COL_BG);
  snprintf(buf, sizeof buf, "%d/%d", max(hp, 0), maxHp);
  centerText(buf, 158, 2, 0xFFFF);

  carrier.display.fillRect(50, 186, 140, 18, COL_BG);
  snprintf(buf, sizeof buf, "%02d:%02d", secs / 60, secs % 60);
  centerText(buf, 188, 2, COL_MUTED);
}

// ---------------------------------------------------------------- commands from the game
void clearOptionLeds() {
  baseColor[0] = baseColor[1] = baseColor[3] = baseColor[4] = 0;
}

void handleCommand(char* s) {
  switch (s[0]) {
    case 'H':
      flash(0xFF0000, 140);
      PLAY(SND_HIT);
      break;

    case 'U': {
      unsigned long c[4];
      if (sscanf(s, "U,%lx,%lx,%lx,%lx", &c[0], &c[1], &c[2], &c[3]) == 4) {
        baseColor[0] = c[0];
        baseColor[1] = c[1];
        baseColor[3] = c[2];
        baseColor[4] = c[3];
      }
      pickMode = true;
      screenDirty = true;
      PLAY(SND_LEVELUP);
      break;
    }

    case 'C':
      clearOptionLeds();
      pickMode = false;
      heldPad = -1;
      screenDirty = true;
      PLAY(SND_PICK);
      break;

    case 'S': {
      int prev = superPct;
      superPct = constrain(atoi(s + 2), 0, 100);
      if (superPct >= 100 && prev < 100) PLAY(SND_READY);
      break;
    }

    case 'N':
      superPct = 0;
      flash(0xFFFFFF, 300);
      PLAY(SND_NOVA);
      break;

    case 'D': {
      int a, b, c, d;
      if (sscanf(s, "D,%d,%d,%d,%d", &a, &b, &c, &d) == 4) {
        hp = a; maxHp = b; lvl = c; secs = d;
        screenDirty = true;
      }
      break;
    }

    case 'G':
      gameOver = true;
      pickMode = false;
      for (int i = 0; i < 5; i++) baseColor[i] = 0x400000;
      screenDirty = true;
      PLAY(SND_OVER);
      break;

    case 'R':
      inGame = true;
      gameOver = false;
      pickMode = false;
      superPct = 0;
      for (int i = 0; i < 5; i++) baseColor[i] = 0;
      hp = 100; maxHp = 100; lvl = 1; secs = 0;
      needFullClear = true;
      screenDirty = true;
      PLAY(SND_START);
      break;

    case 'O':
      carrier.display.setRotation((baseRotation + (s[2] == '1' ? 2 : 0)) % 4);
      needFullClear = true;
      screenDirty = true;
      break;
  }
}

char line[64];
uint8_t lineLen = 0;

void readSerial() {
  while (Serial.available()) {
    char c = Serial.read();
    if (c == '\n' || c == '\r') {
      if (lineLen) {
        line[lineLen] = 0;
        handleCommand(line);
        lineLen = 0;
      }
    } else if (lineLen < sizeof(line) - 1) {
      line[lineLen++] = c;
    }
  }
}

// ---------------------------------------------------------------- main
unsigned long lastAccel = 0, lastLed = 0;

void setup() {
  Serial.begin(115200);
  if (USING_PLASTIC_CASE) carrier.withCase();
  carrier.begin();
  baseRotation = carrier.display.getRotation();
  carrier.leds.setBrightness(LED_BRIGHTNESS);
  carrier.leds.clear();
  carrier.leds.show();
  drawIdle();
}

void loop() {
  unsigned long now = millis();

  readSerial();

  carrier.Buttons.update();
  for (int i = 0; i < 5; i++) {
    if (carrier.Buttons.onTouchDown(PADS[i])) {
      heldPad = i;
      holdStart = now;
      if (Serial) { Serial.print("B,"); Serial.println(i); }
    }
    if (carrier.Buttons.onTouchUp(PADS[i])) {
      if (heldPad == i) heldPad = -1;
      if (Serial) { Serial.print("E,"); Serial.println(i); }
    }
  }

  if (now - lastAccel >= ACCEL_MS) {
    lastAccel = now;
    float x, y, z;
    carrier.IMUmodule.readAcceleration(x, y, z);
    if (Serial) {
      Serial.print("A,");
      Serial.print(x, 3);
      Serial.print(',');
      Serial.println(y, 3);
    }
  }

  updateBuzzer();

  if (now - lastLed >= 20) {
    lastLed = now;
    updateLeds();
  }

  if (screenDirty && now - lastDraw >= 250) {
    screenDirty = false;
    lastDraw = now;
    drawScreen();
  }
}
