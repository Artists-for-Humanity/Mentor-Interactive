#include <WiFi.h>
#include <WebSocketsClient.h>
#include <mpu6050.h>
#include <Wire.h>

// ---------- Network Settings ----------
const char* WIFI_SSID = "JuliasiPhone";
const char* WIFI_PASS = "juliaissogenerous";

const char* WS_HOST = "172.20.10.5"; 
const uint16_t WS_PORT = 8080;

// MUST MATCH THE HTML DOM ID: "esp32-1" -> #disp-esp32-1
const char* DEVICE_ID = "esp32-1";

// ---------- MPU-6050 Settings ----------
#define MPU_ADDRESS 0x68

float gX, gY, gZ;
float aX, aY, aZ;
float temp;

WebSocketsClient webSocket;
bool isConnected = false;
int lastUprightState = -1; // -1 = uninitialized, 0 = false, 1 = true

// Returns true if upright, false if inverted/picked up
bool isUpright(float accelZ) {
    return accelZ < 20000;
}

void sendHello() {
  String json = "{\"type\":\"hello\",\"role\":\"esp32\",\"device_id\":\"" + String(DEVICE_ID) + "\"}";
  webSocket.sendTXT(json);
  Serial.println("[WS] Sent 'hello' handshake as esp32-1");
}

// Send motion state formatted specifically for display.html
void sendMotionEvent(bool isPickedUp) {
  // String state expected by display: "picked_up" or "resting"
  String stateStr = isPickedUp ? "picked_up" : "resting";
  
  String json = "{\"type\":\"motion\",\"device_id\":\"" + String(DEVICE_ID) + "\",\"state\":\"" + stateStr + "\"}";
  webSocket.sendTXT(json);
  
  Serial.print("[WS] Sent state to display: ");
  Serial.println(stateStr);
}

void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case WStype_DISCONNECTED:
      Serial.println("[WS] Disconnected from server");
      isConnected = false;
      break;

    case WStype_CONNECTED:
      Serial.println("[WS] Connected to server!");
      isConnected = true;
      sendHello();
      break;

    case WStype_TEXT:
      Serial.printf("[WS] Received: %s\n", payload);
      break;

    default:
      break;
  }
}

void setup() {
    Serial.begin(115200);

    // 1. Initialize MPU-6050
    Wire.begin(21, 22);
    wakeSensor(MPU_ADDRESS); 
    Wire.beginTransmission(MPU_ADDRESS);
    Wire.write(0x6B); // PWR_MGMT_1 register
    Wire.write(0x00); // Wake up MPU-6050
    Wire.endTransmission();

    // 2. Connect Wi-Fi
    Serial.printf("Connecting to Wi-Fi: %s", WIFI_SSID);
    WiFi.begin(WIFI_SSID, WIFI_PASS);
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    Serial.println("\nWiFi connected!");
    Serial.print("ESP32 IP: ");
    Serial.println(WiFi.localIP());

    // 3. Connect WebSocket
    webSocket.begin(WS_HOST, WS_PORT, "/");
    webSocket.onEvent(webSocketEvent);
    webSocket.setReconnectInterval(5000);
}

void loop() {
    webSocket.loop();

    // Read MPU-6050 sensors
    readGyroData(MPU_ADDRESS, gX, gY, gZ); 
    readAccelData(MPU_ADDRESS, aX, aY, aZ); 
    readTempData(MPU_ADDRESS, temp); 

    // Determine state
    bool uprightState = isUpright(aZ);

    // Picked up when inverted/tilted (not upright)
    bool isPickedUp = !uprightState;

    // Trigger ONLY on state change
    if ((int)isPickedUp != lastUprightState) {
        lastUprightState = (int)isPickedUp;

        if (isConnected) {
            sendMotionEvent(isPickedUp);
        }
    }

    delay(200); 
}