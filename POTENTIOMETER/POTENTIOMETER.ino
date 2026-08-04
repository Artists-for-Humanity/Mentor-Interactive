const int potPin = 34; 
int potValue = 0;
float speedValue = 1.0;
void setup() {
  Serial.begin(115200); // Start serial monitor
  delay(1000);
}

void loop() {
  potValue = analogRead(potPin); 
  // Normalize
  // Read 12-bit value (0 - 4095)
  potValue = potValue / 200;
  speedValue = potValue / 10;
  // Serial.println("speed:" + potValue);   
  Serial.println(speedValue);   // Print value to serial monitor
  delay(500);                    // Wait half a second
}
