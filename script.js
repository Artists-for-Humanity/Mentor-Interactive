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

window.addEventListener("keydown", (event) => {
    if (event.repeat) {
        return;
    }

    setPressed(event.key, true);
});

window.addEventListener("keyup", (event) => {
    setPressed(event.key, false);
});

window.addEventListener("blur", releaseAll);
document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
        releaseAll();
    }
});
