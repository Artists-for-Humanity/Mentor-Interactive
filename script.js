const sectorRanges = {
    1: [0, 32],
    2: [32, 53],
    3: [54, 75],
    4: [75, 100]
};

const slices = new Map(
    [...document.querySelectorAll(".slice")].map((slice) => [slice.dataset.sector, slice])
);

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
    slices.get(key)?.classList.toggle("is-active", isPressed);
}

function releaseAll() {
    slices.forEach((slice) => slice.classList.remove("is-active"));
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
    console.log(event.key);
});

window.addEventListener("blur", releaseAll);
document.addEventListener("visibilitychange", () => {
    if (document.hidden) releaseAll();
});

// Serial reading for character 1 
let serialReleaseTimer = null;

async function startSerialReading() {
    try {
        // Request a port and open at 115200 baud
        const port = await navigator.serial.requestPort();
        await port.open({ baudRate: 115200 });

       
                //1 TextDecoderStream helps convert binary data into string characters
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
                    // Parse line of extra chars 
                    const data = value.trim(); 

                    if (data === 'T') {
                    console.log("Received T");
                    setPressed("1", true);
                    } else if (data === 'F') {
                    console.log("Received F");
                    setPressed("1", false);
                    
                    }
                }
                }
      
    } catch (err) {
        console.error("Serial Connection Error:", err);
    }
}

// Need screen click to initiate serial request 
document.addEventListener("click", () => {
    startSerialReading();
}, { once: true });