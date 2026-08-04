#include <mpu6050.h>
#include <Wire.h>

#define MPU_ADDRESS 0x68 

float gX, gY, gZ; 
float aX, aY, aZ; 
float temp; 

// Returns true if upright (less than 90 deg tilt), false if inverted/tilted past 90 deg
bool isUpright(float accelZ) {
    return accelZ < 20000;
}

void setup(){
    Wire.begin(21, 22);
    Serial.begin(38400); 
    
    wakeSensor(MPU_ADDRESS); 
    Wire.beginTransmission(MPU_ADDRESS);
    Wire.write(0x6B); // PWR_MGMT_1 register
    Wire.write(0x00); // Wake up MPU-6050
    Wire.endTransmission();
}

void loop(){
    readGyroData(MPU_ADDRESS, gX, gY, gZ); 
    readAccelData(MPU_ADDRESS, aX, aY, aZ); 
    readTempData(MPU_ADDRESS, temp); 

    // Determine orientation state
    bool uprightState = isUpright(aZ);

    // Print values
    // Serial.print("aX:"); Serial.print(aX);
    // Serial.print(" | aY:"); Serial.print(aY);
    // Serial.print(" | aZ:"); Serial.print(aZ);
    
    // Serial.print(" -> State: ");
    if (uprightState) {
        Serial.println("T");
    } else {
        Serial.println("F");
    }

    delay(250); 
}