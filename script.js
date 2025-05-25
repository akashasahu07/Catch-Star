// Game state variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let gameState = {
    score: 0,
    timeLeft: 60,
    isRunning: false,
    basket: { x: 350, y: 550, width: 100, height: 30 },
    stars: [],
    starSpeed: 2,
    lastSpeedIncrease: 0
};

let keys = {};
let gameLoop;
let timerInterval;

// Load high score from memory (no localStorage in artifacts)
let highScore = 0;

// Event listeners for keyboard input
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Touch controls for mobile
let touchLeft = false;
let touchRight = false;

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const canvasWidth = rect.width;

    if (x < canvasWidth / 2) {
        touchLeft = true;
    } else {
        touchRight = true;
    }
});

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    touchLeft = false;
    touchRight = false;
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
});

// Star creation and management
function createStar() {
    return {
        x: Math.random() * (canvas.width - 20),
        y: -20,
        size: 15,
        speed: gameState.starSpeed + Math.random() * 2
    };
}

function spawnStars() {
    // Spawn new star with random probability
    if (Math.random() < 0.02 + (60 - gameState.timeLeft) * 0.001) {
        gameState.stars.push(createStar());
    }
}

function updateStars() {
    // Move stars downward and remove off-screen ones
    for (let i = gameState.stars.length - 1; i >= 0; i--) {
        gameState.stars[i].y += gameState.stars[i].speed;

        // Remove stars that fell off screen
        if (gameState.stars[i].y > canvas.height) {
            gameState.stars.splice(i, 1);
        }
    }
}

// Collision detection between basket and stars
function checkCollisions() {
    const basket = gameState.basket;

    for (let i = gameState.stars.length - 1; i >= 0; i--) {
        const star = gameState.stars[i];

        // Simple rectangle collision detection
        if (star.x < basket.x + basket.width &&
            star.x + star.size > basket.x &&
            star.y < basket.y + basket.height &&
            star.y + star.size > basket.y) {

            // Star caught - increase score and remove star
            gameState.score++;
            gameState.stars.splice(i, 1);
            updateScore();
        }
    }
}

// Player input handling
function handleInput() {
    const moveSpeed = 5;

    if ((keys['ArrowLeft'] || touchLeft) && gameState.basket.x > 0) {
        gameState.basket.x -= moveSpeed;
    }
    if ((keys['ArrowRight'] || touchRight) && gameState.basket.x < canvas.width - gameState.basket.width) {
        gameState.basket.x += moveSpeed;
    }
}

// Increase difficulty over time
function updateDifficulty() {
    const elapsed = 60 - gameState.timeLeft;

    // Increase speed every 15 seconds
    if (elapsed > 0 && elapsed % 15 === 0 && elapsed !== gameState.lastSpeedIncrease) {
        gameState.starSpeed += 0.5;
        gameState.lastSpeedIncrease = elapsed;
    }
}

// Drawing functions
function drawStar(x, y, size) {
    const spikes = 5;
    const outerRadius = size;
    const innerRadius = size * 0.4;

    ctx.save();
    ctx.translate(x + size, y + size);
    ctx.fillStyle = '#FFD700';
    ctx.strokeStyle = '#FFA500';
    ctx.lineWidth = 1;

    ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (i * Math.PI) / spikes;
        const px = Math.cos(angle) * radius;
        const py = Math.sin(angle) * radius;

        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
}

function drawBasket() {
    const basket = gameState.basket;
    const centerX = basket.x + basket.width / 2;
    const centerY = basket.y + basket.height / 2;

    // Create magical glow effect
    const glowGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, basket.width);
    glowGradient.addColorStop(0, 'rgba(255, 215, 0, 0.3)');
    glowGradient.addColorStop(0.7, 'rgba(255, 165, 0, 0.1)');
    glowGradient.addColorStop(1, 'rgba(255, 215, 0, 0)');

    ctx.fillStyle = glowGradient;
    ctx.fillRect(basket.x - 20, basket.y - 10, basket.width + 40, basket.height + 20);

    // Draw mystical crystal basket base
    const baseGradient = ctx.createLinearGradient(basket.x, basket.y, basket.x, basket.y + basket.height);
    baseGradient.addColorStop(0, '#1E3A8A');
    baseGradient.addColorStop(0.3, '#3B82F6');
    baseGradient.addColorStop(0.6, '#60A5FA');
    baseGradient.addColorStop(1, '#1E40AF');

    // Main basket body with crystal shape
    ctx.fillStyle = baseGradient;
    ctx.beginPath();
    ctx.moveTo(basket.x + 10, basket.y);
    ctx.lineTo(basket.x + basket.width - 10, basket.y);
    ctx.lineTo(basket.x + basket.width + 5, basket.y + basket.height);
    ctx.lineTo(basket.x - 5, basket.y + basket.height);
    ctx.closePath();
    ctx.fill();

    // Add crystal facets and reflections
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.moveTo(basket.x + 15, basket.y + 3);
    ctx.lineTo(basket.x + 35, basket.y + 3);
    ctx.lineTo(basket.x + 30, basket.y + 15);
    ctx.lineTo(basket.x + 10, basket.y + 15);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.beginPath();
    ctx.moveTo(basket.x + basket.width - 35, basket.y + 3);
    ctx.lineTo(basket.x + basket.width - 15, basket.y + 3);
    ctx.lineTo(basket.x + basket.width - 10, basket.y + 15);
    ctx.lineTo(basket.x + basket.width - 30, basket.y + 15);
    ctx.closePath();
    ctx.fill();

    // Magical energy rim
    const rimGradient = ctx.createLinearGradient(basket.x, basket.y, basket.x + basket.width, basket.y);
    rimGradient.addColorStop(0, '#FFD700');
    rimGradient.addColorStop(0.25, '#FFA500');
    rimGradient.addColorStop(0.5, '#FF6B6B');
    rimGradient.addColorStop(0.75, '#9D4EDD');
    rimGradient.addColorStop(1, '#FFD700');

    ctx.strokeStyle = rimGradient;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(basket.x + 10, basket.y);
    ctx.lineTo(basket.x + basket.width - 10, basket.y);
    ctx.stroke();

    // Add floating magical particles around basket
    const time = Date.now() * 0.003;
    for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI * 2) / 6 + time;
        const radius = 35 + Math.sin(time * 2 + i) * 5;
        const particleX = centerX + Math.cos(angle) * radius;
        const particleY = centerY + Math.sin(angle) * radius * 0.3;

        const particleGradient = ctx.createRadialGradient(particleX, particleY, 0, particleX, particleY, 4);
        particleGradient.addColorStop(0, '#FFD700');
        particleGradient.addColorStop(0.5, '#FFA500');
        particleGradient.addColorStop(1, 'rgba(255, 215, 0, 0)');

        ctx.fillStyle = particleGradient;
        ctx.beginPath();
        ctx.arc(particleX, particleY, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    // Enchanted handles with crystal design
    const handleHeight = 25;
    const handleWidth = 12;

    // Left mystical handle
    const leftHandleGradient = ctx.createLinearGradient(
        basket.x - 15, basket.y,
        basket.x - 15, basket.y + handleHeight
    );
    leftHandleGradient.addColorStop(0, '#8B5CF6');
    leftHandleGradient.addColorStop(0.5, '#A78BFA');
    leftHandleGradient.addColorStop(1, '#6D28D9');

    ctx.fillStyle = leftHandleGradient;
    ctx.beginPath();
    ctx.moveTo(basket.x - 8, basket.y + 5);
    ctx.lineTo(basket.x - 18, basket.y + 8);
    ctx.lineTo(basket.x - 18, basket.y + handleHeight);
    ctx.lineTo(basket.x - 5, basket.y + handleHeight);
    ctx.closePath();
    ctx.fill();

    // Right mystical handle
    const rightHandleGradient = ctx.createLinearGradient(
        basket.x + basket.width + 15, basket.y,
        basket.x + basket.width + 15, basket.y + handleHeight
    );
    rightHandleGradient.addColorStop(0, '#8B5CF6');
    rightHandleGradient.addColorStop(0.5, '#A78BFA');
    rightHandleGradient.addColorStop(1, '#6D28D9');

    ctx.fillStyle = rightHandleGradient;
    ctx.beginPath();
    ctx.moveTo(basket.x + basket.width + 8, basket.y + 5);
    ctx.lineTo(basket.x + basket.width + 18, basket.y + 8);
    ctx.lineTo(basket.x + basket.width + 18, basket.y + handleHeight);
    ctx.lineTo(basket.x + basket.width + 5, basket.y + handleHeight);
    ctx.closePath();
    ctx.fill();

    // Add sparkle effects on handles
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.arc(basket.x - 12, basket.y + 12, 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(basket.x + basket.width + 12, basket.y + 12, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Central energy core
    const coreGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 15);
    coreGradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
    coreGradient.addColorStop(0.5, 'rgba(0, 191, 255, 0.3)');
    coreGradient.addColorStop(1, 'rgba(0, 191, 255, 0)');

    ctx.fillStyle = coreGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 12, 0, Math.PI * 2);
    ctx.fill();
}

function drawGame() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all stars
    gameState.stars.forEach(star => {
        drawStar(star.x, star.y, star.size);
    });

    // Draw basket
    drawBasket();
}

// UI update functions
function updateScore() {
    document.getElementById('score').textContent = gameState.score;
}

function updateTimer() {
    document.getElementById('timer').textContent = gameState.timeLeft;
}

function updateHighScore() {
    if (gameState.score > highScore) {
        highScore = gameState.score;
        document.getElementById('highScore').textContent = highScore;
    }
}

// Game loop - main update cycle
function update() {
    if (!gameState.isRunning) return;

    handleInput();
    spawnStars();
    updateStars();
    checkCollisions();
    updateDifficulty();
    drawGame();

    // Continue game loop
    gameLoop = requestAnimationFrame(update);
}

// Timer countdown
function countdown() {
    gameState.timeLeft--;
    updateTimer();

    if (gameState.timeLeft <= 0) {
        endGame();
    }
}

// Game state management
function startGame() {
    // Reset game state
    gameState = {
        score: 0,
        timeLeft: 60,
        isRunning: true,
        basket: { x: 350, y: 550, width: 100, height: 30 },
        stars: [],
        starSpeed: 2,
        lastSpeedIncrease: 0
    };

    // Update UI
    updateScore();
    updateTimer();
    document.getElementById('gameOver').style.display = 'none';

    // Start game loops
    gameLoop = requestAnimationFrame(update);
    timerInterval = setInterval(countdown, 1000);
}

function endGame() {
    // Stop game
    gameState.isRunning = false;
    clearInterval(timerInterval);
    cancelAnimationFrame(gameLoop);

    // Update high score and show game over screen
    updateHighScore();
    document.getElementById('finalScore').textContent = gameState.score;
    document.getElementById('gameOver').style.display = 'block';
}

// Initialize game
document.getElementById('highScore').textContent = highScore;
startGame();