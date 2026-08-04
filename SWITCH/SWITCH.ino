const int buttonPin = 18; 
int buttonState = 0; 

void setup() {
  Serial.begin(4800);
  pinMode(buttonPin, INPUT_PULLUP);
}

void loop() {
  buttonState = digitalRead(buttonPin);
  
  if (buttonState == LOW) {
    Serial.println("Y");
  } else {
    Serial.println("N");
  }
  
  delay(1000);
}
