// Game state
let gameState = {
    isAnimating: false,
    goals: 0,
    saves: 0
};

// Zone positions mapping (relative to goal area)
const zonePositions = {
    'top-left': { top: '65%', left: '12.5%' },
    'top-right': { top: '65%', left: '87.5%' },
    'bottom-left': { top: '98%', left: '12.5%' },
    'bottom-right': { top: '98%', left: '87.5%' }
};

// Initialize game
document.addEventListener('DOMContentLoaded', function() {
    const goalZones = document.querySelectorAll('.goal-zone');
    const ball = document.getElementById('ball');
    const keeper = document.getElementById('keeper');
    const resultOverlay = document.getElementById('resultOverlay');
    const resultText = document.getElementById('resultText');

    // Add click listeners to goal zones
    goalZones.forEach(zone => {
        zone.addEventListener('click', function() {
            if (gameState.isAnimating) return;
            
            const zoneType = this.getAttribute('data-zone');
            takeShot(zoneType);
        });
    });

    function takeShot(zoneType) {
        gameState.isAnimating = true;
        
        // Hide result overlay if visible
        resultOverlay.classList.remove('show');
        
        // Reset keeper and ball
        keeper.src = 'KEEPER NORMAL.png';
        keeper.className = 'keeper';
        ball.className = 'ball';
        
        // Calculate if keeper saves (60% chance of saving based on zone)
        const isSave = checkIfSave(zoneType);
        
        // Get position for ball animation
        const zonePos = zonePositions[zoneType];
        
        // Animate keeper and ball at the same time
        animateKeeper(zoneType, isSave);
        animateBall(zonePos, isSave);
        
        // Show result after animation (longer for saves due to bounce)
        const animationDelay = isSave ? 1400 : 1200;
        setTimeout(() => {
            showResult(isSave);
            if (isSave) {
                gameState.saves++;
            } else {
                gameState.goals++;
            }
            updateScore();
            resetGame(isSave);
        }, animationDelay);
    }

    function checkIfSave(zoneType) {
        // Keeper saves based on zone difficulty
        // Corners are harder to save
        const saveProbabilities = {
            'top-left': 0.4,
            'top-right': 0.4,
            'bottom-left': 0.3,
            'bottom-right': 0.3
        };
        
        return Math.random() < saveProbabilities[zoneType];
    }

    function animateKeeper(zoneType, isSave) {
        // Keeper always dives
        // If it's a save, dive to the correct corner
        // If it's a goal, dive to the wrong corner (opposite side)
        let diveClass = '';
        let keeperImage = 'KEEPER NORMAL.png';
        
        // Determine which corner to dive to
        let diveToZone = zoneType;
        if (!isSave) {
            // Dive to wrong corner for goals - opposite side
            if (zoneType === 'top-left') {
                diveToZone = 'top-right';
            } else if (zoneType === 'top-right') {
                diveToZone = 'top-left';
            } else if (zoneType === 'bottom-left') {
                diveToZone = 'bottom-right';
            } else if (zoneType === 'bottom-right') {
                diveToZone = 'bottom-left';
            }
        }
        
        // Set dive class and image based on where we're diving
        // Always use save images (high for top zones, low for bottom zones)
        if (diveToZone === 'top-left') {
            diveClass = 'diving-top-left';
            keeperImage = 'KEEPER save high.png';
        } else if (diveToZone === 'top-right') {
            diveClass = 'diving-top-right';
            keeperImage = 'KEEPER save high.png';
        } else if (diveToZone === 'bottom-left') {
            diveClass = 'diving-bottom-left';
            keeperImage = 'KEEPER Save Low.png';
        } else if (diveToZone === 'bottom-right') {
            diveClass = 'diving-bottom-right';
            keeperImage = 'KEEPER Save Low.png';
        }
        
        // Apply the dive animation and image
        keeper.src = keeperImage;
        keeper.className = 'keeper ' + diveClass;
    }

    function animateBall(zonePos, isSave) {
        const ball = document.getElementById('ball');
        const goalArea = document.querySelector('.goal-area');
        const goalRect = goalArea.getBoundingClientRect();
        const ballContainer = ball.parentElement;
        
        // Calculate final position relative to viewport
        const finalLeft = goalRect.left + (goalRect.width * parseFloat(zonePos.left) / 100);
        const finalTop = goalRect.top + (goalRect.height * parseFloat(zonePos.top) / 100);
        
        // Get ball's current position (center bottom)
        const ballRect = ballContainer.getBoundingClientRect();
        const startLeft = ballRect.left + ballRect.width / 2;
        const startTop = ballRect.top + ballRect.height / 2;
        
        // Calculate distance and angle
        const deltaX = finalLeft - startLeft;
        const deltaY = finalTop - startTop;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // Apply transform (keep the -50% translateX for center, then add the delta)
        const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
        
        // Calculate scale - ball gets smaller as it travels (from 1.0 to 0.3)
        const scaleEnd = 0.3;
        
        // Animate ball to target
        ballContainer.style.transition = 'transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        ballContainer.style.transform = `translate(calc(-50% + ${deltaX}px), ${deltaY}px) rotate(${angle}deg) scale(${scaleEnd})`;
        ball.classList.add('shooting');
        
        // If it's a save, bounce the ball away after it reaches the keeper
        if (isSave) {
            setTimeout(() => {
                // Calculate bounce direction (opposite direction, bounce off-screen)
                // Bounce much further to go off-screen
                const bounceX = -deltaX * 2.5; // Bounce back 250% of the distance to go off-screen
                const bounceY = -deltaY * 1.5 - 200; // Bounce up and way back to go off-screen
                const bounceAngle = angle + 180; // Reverse direction
                
                ballContainer.style.transition = 'transform 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
                ballContainer.style.transform = `translate(calc(-50% + ${deltaX + bounceX}px), ${deltaY + bounceY}px) rotate(${bounceAngle}deg) scale(${scaleEnd * 1.5})`;
            }, 800); // After ball reaches target (800ms)
        }
    }

    function playGoalAnimation() {
        const goalAnimation = document.getElementById('goalAnimation');
        const goalFrame = document.getElementById('goalFrame');
        
        // Configuration
        const frameCount = 200; // 000000 to 000199
        const frameDuration = 33; // ~30fps (1000ms / 30fps ≈ 33ms per frame)
        const framePath = 'GOAL IMG SEQ/';
        const framePrefix = 'frame-';
        
        goalAnimation.style.display = 'flex';
        
        let currentFrame = 0;
        
        const animate = () => {
            if (currentFrame < frameCount) {
                // Format frame number with leading zeros (e.g., 000000, 000001, ...)
                const frameNum = String(currentFrame).padStart(6, '0');
                goalFrame.src = `${framePath}${framePrefix}${frameNum}.png`;
                currentFrame++;
                setTimeout(animate, frameDuration);
            } else {
                // Animation complete, hide it
                goalAnimation.style.display = 'none';
            }
        };
        
        animate();
    }

    function showResult(isSave) {
        if (isSave) {
            // Show text for saves
            resultText.textContent = 'SAVE!';
            resultText.className = 'result-text save';
            resultOverlay.classList.add('show');
        } else {
            // Play goal animation sequence instead of text
            playGoalAnimation();
        }
    }

    function updateScore() {
        document.getElementById('goals').textContent = gameState.goals;
        document.getElementById('saves').textContent = gameState.saves;
    }

    function playWipeAnimation() {
        const wipeAnimation = document.getElementById('wipeAnimation');
        const wipeFrame = document.getElementById('wipeFrame');
        const goalAnimation = document.getElementById('goalAnimation');
        
        // Configuration
        const frameCount = 51; // 00000 to 00050
        const frameDuration = 33; // ~30fps (1000ms / 30fps ≈ 33ms per frame)
        const framePath = 'HANDBALL WIPE IMAGE SEQUENCE/';
        const framePrefix = 'handball wipe_';
        
        wipeAnimation.style.display = 'flex';
        
        // Hide goal animation 0.5 seconds after wipe starts
        setTimeout(() => {
            if (goalAnimation) {
                goalAnimation.style.display = 'none';
            }
        }, 500);
        
        let currentFrame = 0;
        
        const animate = () => {
            if (currentFrame <= frameCount) {
                // Format frame number with leading zeros (e.g., 00000, 00001, ...)
                const frameNum = String(currentFrame).padStart(5, '0');
                wipeFrame.src = `${framePath}${framePrefix}${frameNum}.png`;
                currentFrame++;
                setTimeout(animate, frameDuration);
            } else {
                // Animation complete, hide it
                wipeAnimation.style.display = 'none';
            }
        };
        
        animate();
    }

    function resetGame(isSave) {
        setTimeout(() => {
            const ballContainer = document.querySelector('.ball-container');
            const ball = document.getElementById('ball');
            
            // Reset ball position to center bottom and restore size
            ballContainer.style.transform = 'translateX(-50%) rotate(0deg) scale(1)';
            ball.classList.remove('shooting');
            
            // Reset keeper only when ball resets (keep dive position until now)
            keeper.src = 'KEEPER NORMAL.png';
            keeper.className = 'keeper';
            
            // Hide result - less time for saves, more for goals
            const resultDisplayTime = isSave ? 1000 : 2000; // 1s for saves, 2s for goals
            setTimeout(() => {
                resultOverlay.classList.remove('show');
                gameState.isAnimating = false;
            }, resultDisplayTime);
            
            // Play wipe animation - delay 2 seconds longer if it's a goal
            const wipeDelay = isSave ? 500 : 2500; // 0.5s for saves, 2.5s (2s longer) for goals
            setTimeout(() => {
                playWipeAnimation();
            }, wipeDelay);
        }, 1500);
    }
});