const int buttonPin = 18;
const int button2 = 22;
const int button3 = 23;
const int ledPin = 2;
const int led2 = 4;
const int led3 = 5;
int button1State = 0;
int button2State = 0;
int button3State = 0;

void setup() {
  Serial.begin(4800);
  pinMode(buttonPin, INPUT_PULLUP);
  pinMode(button2, INPUT_PULLUP);
  pinMode(button3, INPUT_PULLUP);
  pinMode(ledPin, OUTPUT);
  pinMode(led2, OUTPUT);
  pinMode(led3, OUTPUT);
}

void loop() {
  button1State = digitalRead(buttonPin);
  button2State = digitalRead(button2);
  button3State = digitalRead(button3);

  if (button1State == LOW) {
    digitalWrite(ledPin, HIGH);
    
  } else {
    digitalWrite(ledPin, LOW);
  }
  if (button2State == LOW) {
    digitalWrite(led2, HIGH);
    
  } else {
    digitalWrite(led2, LOW);
  }
  if (button3State == LOW) {
    digitalWrite(led3, HIGH);
    
  } else {
    digitalWrite(led3, LOW);
  }
  if(button1State == LOW && button2State == LOW && button3State == LOW){
    Serial.write("Y");
  }
  else{
    Serial.write("N");
  }


  delay(500);
}
