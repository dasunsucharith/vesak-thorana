document.addEventListener('DOMContentLoaded', () => {
    const audio = document.getElementById('background-audio');
    
    // Create container for audio controls
    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'audio-controls';
    
    // Create play button
    const playButton = document.createElement('button');
    playButton.className = 'control-button play';
    playButton.innerHTML = '▶️';
    
    // Create pause button
    const pauseButton = document.createElement('button');
    pauseButton.className = 'control-button pause';
    pauseButton.innerHTML = '⏸️';
    
    // Add click handlers
    playButton.onclick = () => {
        audio.play();
        playButton.style.display = 'none';
        pauseButton.style.display = 'flex';
    };
    
    pauseButton.onclick = () => {
        audio.pause();
        pauseButton.style.display = 'none';
        playButton.style.display = 'flex';
    };
    
    // Initially hide pause button
    pauseButton.style.display = 'none';
    
    // Add buttons to container
    controlsContainer.appendChild(playButton);
    controlsContainer.appendChild(pauseButton);
    document.body.appendChild(controlsContainer);
    
    // Try to play audio on page load
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
        playPromise.catch(error => {
            // Auto-play was prevented
            playButton.style.display = 'flex';
            pauseButton.style.display = 'none';
        });
    }

    setupLotusAnimation();
});

function setupLotusAnimation() {
    const lotusContainer = document.getElementById('lotus-container');
    const frames = 4;
    let currentFrame = 0;
    let isAnimating = true;
    let animationInterval;

    // Create image elements for each frame
    for (let i = 1; i <= frames; i++) {
        const img = document.createElement('img');
        img.src = `lotus-animation/lotus_${i}.png`;
        img.className = `lotus-frame ${i === 1 ? 'active' : ''}`;
        lotusContainer.appendChild(img);
    }

    function animateFrame() {
        if (!isAnimating) return;

        const frameElements = lotusContainer.getElementsByClassName('lotus-frame');
        // Hide current frame
        frameElements[currentFrame].classList.remove('active');
        // Move to next frame
        currentFrame = (currentFrame + 1) % frames;
        // Show new frame
        frameElements[currentFrame].classList.add('active');
    }

    // Use requestAnimationFrame for smoother animation
    let lastFrameTime = 0;
    const frameInterval = 300; // 300ms between frames

    function animate(currentTime) {
        if (!lastFrameTime) lastFrameTime = currentTime;

        if (currentTime - lastFrameTime >= frameInterval) {
            animateFrame();
            lastFrameTime = currentTime;
        }

        if (isAnimating) {
            requestAnimationFrame(animate);
        }
    }

    // Start animation
    requestAnimationFrame(animate);

    // Optional: Toggle animation function
    function toggleAnimation() {
        isAnimating = !isAnimating;
        if (isAnimating) {
            requestAnimationFrame(animate);
        }
    }
}

const rows = 120,
	cols = 120,
	total = rows * cols;
const ringCount = 12; // Increased number of rings for larger display
const ringThickness = 1.5; // Slightly thinner rings for smaller LEDs
const circle = document.getElementById("circle");
const LEDs = [];

// Color palette with specified colors: blue, yellow, red, orange, white
const ringPalette = [
	"#0066ff", // blue
	"#ffff00", // yellow
	"#ff0000", // red
	"#ff6600", // orange
	"#ffffff", // white
];
const OFF = getComputedStyle(document.documentElement).getPropertyValue(
	"--off"
);

// Create all LED elements
for (let i = 0; i < total; i++) {
	const d = document.createElement("div");
	d.className = "led";
	circle.appendChild(d);
	LEDs.push(d);
}

const centre = { r: (rows - 1) / 2, c: (cols - 1) / 2 };
const dist = (r, c) => Math.hypot(r - centre.r, c - centre.c);
const angle = (r, c) => Math.atan2(r - centre.r, c - centre.c);

// Calculate maximum radius for the grid
const maxRadius = dist(0, centre.c);

// Create a hollow center by setting a minimum radius
const minRadius = maxRadius * 0.25; // 25% of max radius for hollow center

// Calculate spacing between rings
const availableSpace = maxRadius - minRadius;
const ringSpacing = availableSpace / ringCount;

// Arrays to hold LEDs for each ring with additional metadata
const rings = Array(ringCount)
	.fill()
	.map(() => []);

// Store LED angles for rotation effects
const ledAngles = new Array(total);

// Assign LEDs to rings based on their distance from center
LEDs.forEach((_, idx) => {
	const r = Math.floor(idx / cols);
	const c = idx % cols;
	const d = dist(r, c);
	const a = angle(r, c);

	// Store angle for each LED for rotation effects
	ledAngles[idx] = a;

	// Skip LEDs beyond max radius or within min radius (hollow center)
	if (d > maxRadius || d < minRadius) return;

	// Determine which ring this LED belongs to
	for (let ringIdx = 0; ringIdx < ringCount; ringIdx++) {
		const ringInnerRadius = minRadius + ringIdx * ringSpacing;
		const ringOuterRadius = ringInnerRadius + ringThickness;

		// Only include LEDs that fall within the current ring's boundaries
		if (d >= ringInnerRadius && d < ringOuterRadius) {
			rings[ringIdx].push({ idx, angle: a, distance: d });
			break;
		}
	}
});

let frame = 0;
let mode = 0;
let rotation = 0;

const rotationSpeed = 16; // Much faster rotation for ultra-smooth animation
const pulseSpeed = 16; // Much faster pulse for ultra-smooth animation
const rotationIncrement = 0.01; // Slightly slower rotation for smoother appearance

function clearAll() {
	LEDs.forEach((l) => (l.style.background = OFF));
}

// Helper function to get color with brightness based on position - with smoother transitions
function getColorWithBrightness(baseColor, brightness) {
	// Parse the hex color
	let r, g, b;

	if (baseColor.startsWith("#")) {
		r = parseInt(baseColor.slice(1, 3), 16);
		g = parseInt(baseColor.slice(3, 5), 16);
		b = parseInt(baseColor.slice(5, 7), 16);
	} else if (baseColor.startsWith("rgb")) {
		const match = baseColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
		if (match) {
			r = parseInt(match[1]);
			g = parseInt(match[2]);
			b = parseInt(match[3]);
		}
	}

	// Adjust brightness (0-1)
	const adjustedR = Math.floor(r * brightness);
	const adjustedG = Math.floor(g * brightness);
	const adjustedB = Math.floor(b * brightness);

	// Convert back to hex
	return `rgb(${adjustedR}, ${adjustedG}, ${adjustedB})`;
}

function rotateRings() {
	const time = performance.now() * 0.002; // Faster animation speed

	rings.forEach((ringLEDs, ringIdx) => {
		// Each ring gets its own color and rotates at its own speed
		const colorIdx = Math.floor(
			(time * 0.3 + ringIdx * 0.2) % ringPalette.length
		);
		const baseColor = ringPalette[colorIdx];
		const ringRotation = time * (0.3 + ringIdx * 0.05); // Different rotation speeds

		// Apply color to all LEDs in this ring with rotation effect
		ringLEDs.forEach((led) => {
			// Apply rotation to the angle
			const adjustedAngle = led.angle + ringRotation;
			// Create pulse effect with sine wave - smoother transition
			const brightness = 0.6 + 0.4 * Math.sin(adjustedAngle * 3 + time * 1.5);
			const color = getColorWithBrightness(baseColor, brightness);
			LEDs[led.idx].style.background = color;
		});
	});
}

// Wave effect animation with rotating waves
function waveEffect() {
	const time = performance.now() * 0.002; // Faster animation
	const waveWidth = 0.7; // Wider wave pulse for smoother effect

	rings.forEach((ringLEDs, ringIdx) => {
		const baseColor = ringPalette[ringIdx % ringPalette.length];

		ringLEDs.forEach((led) => {
			// Create rotating wave pattern with faster speed
			const adjustedAngle = led.angle + time * 0.5;
			const wave = Math.sin(adjustedAngle * 4 + time * 0.8);

			// Smoother transition for wave effect
			const waveStrength = Math.max(
				0,
				(Math.abs(wave) - (1 - waveWidth)) / waveWidth
			);
			if (waveStrength > 0) {
				const brightness = 0.4 + 0.6 * waveStrength;
				LEDs[led.idx].style.background = getColorWithBrightness(
					baseColor,
					brightness
				);
			} else {
				LEDs[led.idx].style.background = OFF;
			}
		});
	});
}

// Color spiral pattern with new color palette
function colorSpiral() {
	const time = performance.now() * 0.002; // Faster animation

	rings.forEach((ringLEDs, ringIdx) => {
		ringLEDs.forEach((led) => {
			// Create a spiral pattern based on angle and distance - smoother motion
			const spiralPosition = led.angle + led.distance / 6 + time * 0.3;

			// Blend between colors for smoother transitions
			const position = spiralPosition * 2;
			const baseIdx = Math.floor(position % ringPalette.length);
			const nextIdx = (baseIdx + 1) % ringPalette.length;
			const blendFactor = position % 1;

			// Get the two colors to blend
			const baseColor = ringPalette[baseIdx];
			const nextColor = ringPalette[nextIdx];

			// Blend the colors
			const r1 = parseInt(baseColor.slice(1, 3), 16);
			const g1 = parseInt(baseColor.slice(3, 5), 16);
			const b1 = parseInt(baseColor.slice(5, 7), 16);

			const r2 = parseInt(nextColor.slice(1, 3), 16);
			const g2 = parseInt(nextColor.slice(3, 5), 16);
			const b2 = parseInt(nextColor.slice(5, 7), 16);

			const r = Math.floor(r1 * (1 - blendFactor) + r2 * blendFactor);
			const g = Math.floor(g1 * (1 - blendFactor) + g2 * blendFactor);
			const b = Math.floor(b1 * (1 - blendFactor) + b2 * blendFactor);

			LEDs[led.idx].style.background = `rgb(${r}, ${g}, ${b})`;
		});
	});
}

function render() {
	switch (mode) {
		case 0:
			rotateRings();
			break;
		case 1:
			waveEffect();
			break;
		case 2:
			colorSpiral();
			break;
	}

	// Increment frame counter (only used for mode switching now)
	frame++;
}

// Use animation frames instead of setInterval for smoother performance
let lastFrameTime = 0;
let frameDuration = 0;

function animationLoop(timestamp) {
	// Always render on each animation frame for maximum smoothness
	render();
	requestAnimationFrame(animationLoop);
}

// Cycle through modes every 30 seconds with smoother, faster transition
setInterval(() => {
	// Fade out more quickly
	let opacity = 1.0;
	const fadeOut = setInterval(() => {
		opacity -= 0.1; // Faster fade
		if (opacity <= 0) {
			clearInterval(fadeOut);
			// Once faded out, change mode and reset
			mode = (mode + 1) % 3;
			frame = 0;

			// Quick fade in for new mode
			let fadeInOpacity = 0;
			const fadeIn = setInterval(() => {
				fadeInOpacity += 0.1;
				if (fadeInOpacity >= 1) {
					clearInterval(fadeIn);
				}

				// Apply smooth fade-in effect
				rings.forEach((ringLEDs, ringIdx) => {
					const baseColor = ringPalette[ringIdx % ringPalette.length];
					ringLEDs.forEach((led) => {
						const adjustedColor = getColorWithBrightness(
							baseColor,
							fadeInOpacity
						);
						LEDs[led.idx].style.background = adjustedColor;
					});
				});
			}, 30); // 30ms intervals for quick fade in
		}

		// Apply fading to all active LEDs
		LEDs.forEach((led) => {
			const currentColor = led.style.background;
			if (currentColor !== OFF && !currentColor.includes("rgba")) {
				// Extract RGB values
				const match = currentColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
				if (match) {
					const r = match[1],
						g = match[2],
						b = match[3];
					led.style.background = `rgba(${r}, ${g}, ${b}, ${opacity})`;
				}
			}
		});
	}, 25); // 25ms intervals for faster fade out
}, 30000);

// Start animation loop
requestAnimationFrame(animationLoop);
