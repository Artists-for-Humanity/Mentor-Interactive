#include <Wire.h>
const int trigPin = 21;
const int echoPin = 22;
long duration;
int distance;

void setup() {
  Wire.begin(21,22);
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
  Serial.begin(9600);
}

void loop() {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  
  duration = pulseIn(echoPin, HIGH);
  distance = duration * 0.034 / 2;
  if (distance > 5){
    Serial.println("FAR");
  }
  else if (distance <= 5){
    Serial.println("NEAR");
  }
  else{
     Serial.println("NEAR");
  }
  
  delay(500);
}

