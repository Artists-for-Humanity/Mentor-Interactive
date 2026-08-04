int buttonState = 0;

void setup()
{
// Initialize serial 
  Serial.begin(74880);
 // Set pin 2 to listen for input from the button
  pinMode(4, INPUT_PULLUP); 

}
//Loop runs infinitely until the board is turned off. It is constantly listening for input and giving output that we tell it to, running thousands of times per second depending on the complexity of the function. 
void loop()
{
  // Read the state of the pushbutton
  buttonState = digitalRead(4);
  
  // If the button is pressed
  if (buttonState == LOW) {
    Serial.println("P");
  } else {
    Serial.println("NP");
  }
  delay(500); 
}
