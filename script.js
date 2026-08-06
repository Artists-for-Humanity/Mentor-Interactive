const sectorRanges = {
    1: [0, 32],
    2: [32, 53],
    3: [54, 75],
    4: [75, 100]
};

const serialDeviceKeys = {
    'p': { baudRate: 115200, readFn: readPotentiometer, label: "Potentiometer" },
    'd': { baudRate: 9600,   readFn: readDistance,      label: "Distance" },
    's': { baudRate: 4800,   readFn: readSwitch,        label: "Switch" },
    'a': { baudRate: 38400,  readFn: readAccelerometer, label: "Accelerometer" },
    'b': { baudRate: 74880,  readFn: readButton,        label: "Button" }
};

const audioTracks = [
    { id: "bass", src: "assets/audio/1-Bass.mp3", player: null, fadeTimer: null },
    { id: "drums", src: "assets/audio/2-Drums.mp3", player: null, fadeTimer: null },
    { id: "guitar", src: "assets/audio/3-Guitar.mp3", player: null, fadeTimer: null },
    { id: "piano", src: "assets/audio/4-Piano.mp3", player: null, fadeTimer: null },
    { id: "synth", src: "assets/audio/5-Synth.mp3", player: null, fadeTimer: null },
    { id: "vocals", src: "assets/audio/6-Vocals.mp3", player: null, fadeTimer: null }
];

const sectorAudioMap = {
    1: ["bass", "drums"],
    2: ["guitar", "piano"],
    3: ["synth"],
    4: ["vocals"]
};

const AUDIO_SECTION_START = "1:45";
const AUDIO_SECTION_END = "2:45";
const AUDIO_FADE_MS = 120;

let audioStarted = false;
let audioLoopTimer = null;

const audioStartSeconds = timeToSeconds(AUDIO_SECTION_START);
const audioEndSeconds = timeToSeconds(AUDIO_SECTION_END);

const activeSectors = {
    1: false,
    2: false,
    3: false,
    4: false
};

const slices = new Map(
    [...document.querySelectorAll(".slice")].map((slice) => [slice.dataset.sector, slice])
);

function timeToSeconds(timeText) {
    const parts = timeText.split(":").map(Number);
    const minutes = parts[0];
    const seconds = parts[1];

    return minutes * 60 + seconds;
}

function startAudio() {
    if (audioStarted) {
        return;
    }

    audioStarted = true;

    audioTracks.forEach((track) => {
        track.player = new Audio(track.src);
        track.player.loop = false;
        track.player.volume = 0;
        track.player.preload = "auto";
    });

    audioTracks.forEach((track) => {
        track.player.currentTime = audioStartSeconds;
        track.player.play().catch((error) => {
            console.warn(`Could not play ${track.src}.`, error);
        });
    });

    keepAudioInSection();
}

function fadeVolume(track, targetVolume) {
    if (!track.player) {
        return;
    }

    clearInterval(track.fadeTimer);

    const startVolume = track.player.volume;
    const totalSteps = 8;
    let currentStep = 0;

    track.fadeTimer = setInterval(() => {
        currentStep += 1;

        const progress = currentStep / totalSteps;
        track.player.volume = startVolume + (targetVolume - startVolume) * progress;

        if (currentStep >= totalSteps) {
            clearInterval(track.fadeTimer);
            track.fadeTimer = null;
            track.player.volume = targetVolume;
        }
    }, AUDIO_FADE_MS / totalSteps);
}

function keepAudioInSection() {
    if (audioLoopTimer) {
        return;
    }

    audioLoopTimer = setInterval(() => {
        const firstTrack = audioTracks[0].player;

        if (!firstTrack) {
            return;
        }

        if (firstTrack.currentTime >= audioEndSeconds) {
            audioTracks.forEach((track) => {
                track.player.currentTime = audioStartSeconds;
            });
        }
    }, 100);
}

function updateAudioVolumes() {
    let tracksToPlay = [];

    Object.keys(activeSectors).forEach((sector) => {
        if (activeSectors[sector]) {
            tracksToPlay = tracksToPlay.concat(sectorAudioMap[sector]);
        }
    });

    audioTracks.forEach((track) => {
        const shouldPlay = tracksToPlay.includes(track.id);
        fadeVolume(track, shouldPlay ? 1 : 0);
    });
}

function clampPercent(value) {
    return Math.min(100, Math.max(0, value));
}

function setRange(key, start, end) {
    const slice = slices.get(key);

    if (!slice) {
        return;
    }

    const left = clampPercent(start);
    const right = Math.max(left, clampPercent(end));

    slice.style.setProperty("--start", `${left}%`);
    slice.style.setProperty("--end", `${right}%`);
}

function setPressed(key, isPressed) {
    const sectorKey = String(key);
    const slice = slices.get(sectorKey);

    if (!slice) {
        return;
    }

    slice.classList.toggle("is-active", isPressed);
    activeSectors[sectorKey] = isPressed;

    if (isPressed) {
        startAudio();
    }

    updateAudioVolumes();
}

function releaseAll() {
    slices.forEach((slice) => slice.classList.remove("is-active"));

    Object.keys(activeSectors).forEach((sector) => {
        activeSectors[sector] = false;
    });

    updateAudioVolumes();
}

Object.entries(sectorRanges).forEach(([key, [start, end]]) => {
    setRange(key, start, end);
});

// Keyboard listeners
window.addEventListener("keydown", (event) => {
    if (event.repeat) return;
    setPressed(event.key, true);
});

window.addEventListener("keyup", (event) => {    
    setPressed(event.key, false);
});

window.addEventListener("blur", releaseAll);
document.addEventListener("visibilitychange", () => {
    if (document.hidden) releaseAll();
});


// SPEED SLIDER
const speedSlider = document.getElementById('speed');
const label = document.getElementById('value-label');

const speeds = [0.75, 1, 1.2];

function setPlaybackRate(rate) {
    audioTracks.forEach((track) => {
        if (track.player) {
            track.player.playbackRate = rate;
        }
    });
}

speedSlider.addEventListener('input', () => {
const rate = speeds[Number(speedSlider.value)];
label.textContent = `Speed · ${rate}x`;
    setPlaybackRate(rate);
});

// set the initial rate to match the slider's starting value on load
setPlaybackRate(speeds[Number(speedSlider.value)]);

const activate = () => speedSlider.classList.add('is-active');
const deactivate = () => speedSlider.classList.remove('is-active');
async function readPotentiometer(port) {
    // TextDecoderStream helps convert binary data into string characters
    const textDecoder = new TextDecoderStream();
    const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
    const reader = textDecoder.readable.getReader();

    // Loop to keep reading data continuously
    while (true) {
        const { value, done } = await reader.read();
        if (done) {
            break;
        }
        if (value) {
            const data = value.trim();
            console.log("Potentiometer:", data);
            if (data === '0.00') {
                setPlaybackRate(speeds[0]);
            } else if (data === '1.00') {
                setPlaybackRate(speeds[1]);
            } else if (data === '2.00') {
                setPlaybackRate(speeds[2]);
            }
        }
    }
}

async function readDistance(port) {
    // Prints "NEAR" or "FAR"
    const textDecoder = new TextDecoderStream();
    const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
    const reader = textDecoder.readable.getReader();

    while (true) {
        const { value, done } = await reader.read();
        if (done) {
            break;
        }
        if (value) {
            const data = value.trim();
            console.log("Distance:", data);
            // TODO: handle "NEAR" / "FAR"
            if(data === 'C'){
                setPressed(3, true);
            }
            else if(data === 'X'){
                setPressed(3, false);
            }
            else{
                // setPressed(1, false);
            }
        }
    }
}

async function readSwitch(port) {
    // Prints "ON" or "OFF"
    const textDecoder = new TextDecoderStream();
    const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
    const reader = textDecoder.readable.getReader();

    while (true) {
        const { value, done } = await reader.read();
        if (done) {
            break;
        }
        if (value) {
            const data = value.trim();
            console.log("Switch:", data);
            // TODO: handle "ON" / "OFF"
            if(data == 'Y'){
                setPressed(1, true);
            }
            else if(data === 'N'){
                setPressed(1, false);
            }
            else{
                // setPressed(1, false);
            }
        }
    }
}

async function readAccelerometer(port) {
    // Prints "T" or "F"
    const textDecoder = new TextDecoderStream();
    const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
    const reader = textDecoder.readable.getReader();

    while (true) {
        const { value, done } = await reader.read();
        if (done) {
            break;
        }
        if (value) {
            const data = value.trim();
            console.log("Accelerometer:", data);
            // TODO: handle "T" / "F"
            if(data == 'T'){
                setPressed(2, true);
            }
            else if(data === 'F'){
                setPressed(2, false);
            }
            else{
                // setPressed(1, false);
            }
        }
    }
}

async function readButton(port) {
    // Prints "P" (pressed) or "NP" (not pressed)
    const textDecoder = new TextDecoderStream();
    const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
    const reader = textDecoder.readable.getReader();

    while (true) {
        const { value, done } = await reader.read();
        if (done) {
            break;
        }
        if (value) {
            const data = value.trim();
            console.log("Button:", data);
            if(data == 'P'){
                setPressed(4, true);
            }
            else if(data === 'W'){
                setPressed(4, false);
            }
            else{
                // setPressed(1, false);
            }
        }
    }
}

async function connectSerialDevice(baudRate, readFn, label) {
    try {
        const port = await navigator.serial.requestPort();
        await port.open({ baudRate });
        // Run this device's read loop without blocking the other connections
        readFn(port).catch((err) => {
            console.error(`${label} read error:`, err);
        });
    } catch (err) {
        console.error(`${label} connection error:`, err);
    }
}

async function startSerialReading() {
    if (!("serial" in navigator)) {
        console.warn("Web Serial is not supported in this browser.");
        return;
    }

    // Each device shows its own picker dialog (one per requestPort call).
    // Once opened, all five ports are listened to concurrently.
    await connectSerialDevice(115200, readPotentiometer, "Potentiometer");
    await connectSerialDevice(9600, readDistance, "Distance");
    await connectSerialDevice(4800, readSwitch, "Switch");
    await connectSerialDevice(38400, readAccelerometer, "Accelerometer");
    await connectSerialDevice(74880, readButton, "Button");
}

// speedSlider.addEventListener('mousedown', activate);
// speedSlider.addEventListener('touchstart', activate);
window.addEventListener('mouseup', deactivate);
window.addEventListener('touchend', deactivate);



const connectedDevices = new Set();

window.addEventListener('keydown', (event) => {
    if (event.repeat) return;

    const key = event.key.toLowerCase();
    const device = serialDeviceKeys[key];

    if (!device) return;
    if (connectedDevices.has(key)) {
        console.log(`${device.label} already connected.`);
        return;
    }

    connectedDevices.add(key);
    connectSerialDevice(device.baudRate, device.readFn, device.label).catch(() => {
        // allow retry if connection failed
        connectedDevices.delete(key);
    });
});