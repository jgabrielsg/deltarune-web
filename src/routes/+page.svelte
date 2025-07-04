<script>
    import { onMount, onDestroy } from 'svelte';
    import { goto } from '$app/navigation';

    // --- Obstacle Class Definition ---
    class Obstacle {
        constructor(x, y, width, height, sprite = null) {
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
            this.sprite = sprite;
            this.bounds = { x, y, width, height };
            this.zIndex = 0;
        }
    }

    // --- InteractionBox Class Definition ---
    class InteractionBox {
        constructor(x, y, width, height, gif) {
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
            this.bounds = { x, y, width, height };
            this.gif = gif; // Absolute path to the GIF
        }
    }

    // --- Game State and Properties ---
    let characterX = 0;
    let characterY = 0;
    let characterSusie_X = 0;
    let characterSusie_Y = 0;
    let characterRalsei_X = 0;
    let characterRalsei_Y = 0;

    let krisZIndex = 0;
    let susieZIndex = 0;
    let ralseiZIndex = 0;

    const characterSize = 30;
    const speed = 3;
    const runSpeed = 6;

    let pressedKeys = {
        ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false, Shift: false, Z: false,
    };

    let obstacles = [];
    let interactionBoxes = [];
    let windowWidth = 0;
    let windowHeight = 0;
    let animationFrameId;

    // --- Animation ---
    let direction = 'd';
    let susieDirection = 'd';
    let ralseiDirection = 'd';

    let animationFrame = 0;
    let isMoving = false;
    let animationTimer = 0;
    const animationSpeed = 16;

    // Player positions history for followers
    let playerPositionHistory = [];
    const maxHistorySize = 80;

    // --- GIF Interaction State ---
    let showInteractionGif = false;
    let currentInteractionGif = '';
    let playerInInteractionZone = false;  // Tracks if player is currently in any interaction zone
    let currentInteractionBox = null;     // Stores the specific box the player is in
    let gamePaused = false;               // Controls if player movement is enabled

    onMount(() => {
        if (typeof window !== 'undefined') {
            windowWidth = window.innerWidth;
            windowHeight = window.innerHeight;

            obstacles = [
                new Obstacle(0, 0, windowWidth, 80),
                new Obstacle(0, 80, 80, windowHeight),
                new Obstacle(windowWidth - 80, 80, 80, windowHeight),

                new Obstacle(80, windowHeight - 80, windowWidth / 2 - 240, 80),
                new Obstacle(windowWidth / 2 + 160, windowHeight - 80, windowWidth / 2 - 240, 80),

                // Make sure your paths are absolute for all assets, not relative
                new Obstacle(windowWidth / 2 - 40, windowHeight / 2 - 20, 120, 80, '/images/spr_classdesk(0).png'), // table
            ];

            interactionBoxes = [
                // Make sure your paths are absolute for all assets, not relative
                new InteractionBox(windowWidth / 2 - 80, windowHeight / 2 - 60, 200, 160, '/gifs/table.gif'), // table
            ];

            characterX = (windowWidth / 2) - (characterSize / 2);
            characterY = 120;

            for (let i = 0; i < maxHistorySize; i++) {
                playerPositionHistory.push({ x: characterX, y: characterY, direc: direction });
            }

            characterSusie_X = characterX;
            characterSusie_Y = characterY;

            characterRalsei_X = characterX;
            characterRalsei_Y = characterY;

            window.addEventListener('keydown', handleKeyDown);
            window.addEventListener('keyup', handleKeyUp);
            startAnimation();
        }
    });

    onDestroy(() => {
        if (typeof window !== 'undefined') {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            cancelAnimationFrame(animationFrameId);
        }
    });

    function handleKeyDown(event) {
        // Prevent default behavior for arrow keys and shift even when paused
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Shift'].includes(event.key)) {
            event.preventDefault();
        }

        // Only update pressedKeys if game is not paused, or if it's the 'Z' key
        if (!gamePaused || event.key === 'z' || event.key === 'Z') {
             if (pressedKeys.hasOwnProperty(event.key)) {
                pressedKeys[event.key] = true;
            }
        }


        // --- Interaction Logic on 'Z' Press ---
        if (event.key === 'z' || event.key === 'Z') {
            if (playerInInteractionZone && currentInteractionBox) {
                // Toggle GIF visibility
                showInteractionGif = !showInteractionGif;

                if (showInteractionGif) { 
                    currentInteractionGif = currentInteractionBox.gif;
                    gamePaused = true;     // Pause the game (no moving)
                } else {
                    currentInteractionGif = '';
                    gamePaused = false;    
                }
            } else if (showInteractionGif) {
                showInteractionGif = false; // pressing Z closes it.
                currentInteractionGif = '';
                gamePaused = false;        
            }
        }
    }

    function handleKeyUp(event) {
        if (pressedKeys.hasOwnProperty(event.key)) {
            pressedKeys[event.key] = false;
        }
    }

    function isColliding(rect1, rect2) {
        return (
            rect1.x < rect2.x + rect2.width &&
            rect1.x + rect1.width > rect2.x &&
            rect1.y < rect2.y + rect2.height &&
            rect1.y + rect1.height > rect2.y
        );
    }

    // --- Ensure absolute paths for all sprites ---
    let krisSpriteUrl = '/kris/spr_krisd_dark(0).png';
    let susieSpriteUrl = '/susie/spr_susieu_eye_dark(0).png';
    let ralseiSpriteUrl = '/ralsei/spr_ralseiu(0).png';

    $: {
        krisSpriteUrl = `/kris/spr_kris${direction}_dark(${animationFrame}).png`;
    }
    $: {
        susieSpriteUrl = `/susie/spr_susie${susieDirection}_eye_dark(${animationFrame}).png`;
    }
    $: {
        ralseiSpriteUrl = `/ralsei/spr_ralsei${ralseiDirection}(${animationFrame}).png`;
    }

    function updateCharacterPosition() {
        // --- Only allow movement if game is not paused ---
        if (gamePaused) {
            isMoving = false;   // Ensure animation stops
            animationFrame = 0; // Reset animation frame to idle
            return; 
        }

        const currentSpeed = pressedKeys.Shift ? runSpeed : speed;

        let newX = characterX;
        let newY = characterY;

        if (pressedKeys.ArrowUp) newY -= currentSpeed;
        if (pressedKeys.ArrowDown) newY += currentSpeed;
        if (pressedKeys.ArrowLeft) newX -= currentSpeed;
        if (pressedKeys.ArrowRight) newX += currentSpeed;

        const futureXBounds = { x: newX, y: characterY, width: characterSize, height: characterSize };
        for (const obstacle of obstacles) {
            if (isColliding(futureXBounds, obstacle.bounds)) {
                newX = characterX;
                break;
            }
        }
        const futureYBounds = { x: newX, y: newY, width: characterSize, height: characterSize };
        for (const obstacle of obstacles) {
            if (isColliding(futureYBounds, obstacle.bounds)) {
                newY = characterY;
                break;
            }
        }

        characterX = Math.max(0, Math.min(newX, windowWidth - characterSize));
        characterY = Math.max(0, Math.min(newY, windowHeight - characterSize));

        // --- Check for Interaction Box Collision ---
        let foundInteraction = false;
        const characterBounds = { x: characterX, y: characterY, width: characterSize, height: characterSize };
        for (const box of interactionBoxes) {
            if (isColliding(characterBounds, box.bounds)) {
                foundInteraction = true;
                currentInteractionBox = box; // Store the specific box
                break;
            }
        }

        // If player enters/leaves interaction zone, update state
        if (foundInteraction && !playerInInteractionZone) {
            playerInInteractionZone = true;
        } else if (!foundInteraction && playerInInteractionZone) {
            playerInInteractionZone = false;
            currentInteractionBox = null; // Clear the specific box
            // If the GIF was open and player leaves zone, close it and unpause.
            if (showInteractionGif) {
                showInteractionGif = false;
                currentInteractionGif = '';
                gamePaused = false; // Unpause if leaving zone with GIF open
            }
        }


        if (characterY + characterSize >= windowHeight) {
            cancelAnimationFrame(animationFrameId);
            goto('/room');
            return;
        }

        if (characterY <= 0) {
            cancelAnimationFrame(animationFrameId);
            goto('/');
            return;
        }

         // --- Update Z-Index for Kris (Player) ---
        krisZIndex = characterY + characterSize; 

        // --- Update Player Position History for Followers ---
        const lastRecordedPosition = playerPositionHistory[playerPositionHistory.length - 1];
        if (!lastRecordedPosition || lastRecordedPosition.x !== characterX || lastRecordedPosition.y !== characterY || lastRecordedPosition.direc !== direction) {
            playerPositionHistory.push({ x: characterX, y: characterY, direc: direction });
        }

        if (playerPositionHistory.length > maxHistorySize) {
            playerPositionHistory.shift();
        }

        // --- Update Susie's Position and Direction ---
        const susieDelayIndex = Math.max(0, playerPositionHistory.length - Math.floor(maxHistorySize / 2) - 1);
        if (playerPositionHistory.length > 0) {
            const susiePosition = playerPositionHistory[susieDelayIndex];
            characterSusie_X = susiePosition.x;
            characterSusie_Y = susiePosition.y;
            susieDirection = susiePosition.direc;
            susieZIndex = characterSusie_Y + characterSize; // Z-index based on Susie's Y
        }

        // --- Update Ralsei's Position and Direction ---
        const ralseiDelayIndex = Math.max(0, playerPositionHistory.length - maxHistorySize - 1);
        if (playerPositionHistory.length > 0) { 
            const ralseiPosition = playerPositionHistory[ralseiDelayIndex];
            characterRalsei_X = ralseiPosition.x;
            characterRalsei_Y = ralseiPosition.y;
            ralseiDirection = ralseiPosition.direc;
            ralseiZIndex = characterRalsei_Y + characterSize; // Z-index based on Ralsei's Y
        }

        // --- Update Obstacle Z-Indices ---
        obstacles = obstacles.map(obstacle => {
            obstacle.zIndex = obstacle.y;
            return obstacle;
        });
    }

     // --- Character animations ---
    function updateAnimation() {
        // --- Only animate if game is not paused ---
        if (gamePaused) {
            animationFrame = 0; 
            isMoving = false; // No movement when paused
            return;
        }

        isMoving = pressedKeys.ArrowUp || pressedKeys.ArrowDown || pressedKeys.ArrowLeft || pressedKeys.ArrowRight;

        if (!isMoving) {
            animationFrame = 0;
            return;
        }

        // up, down, left, right
        if (pressedKeys.ArrowUp) direction = 'u';
        else if (pressedKeys.ArrowDown) direction = 'd';
        else if (pressedKeys.ArrowLeft) direction = 'l';
        else if (pressedKeys.ArrowRight) direction = 'r';

        animationTimer++;
        if (animationTimer >= animationSpeed) {
            animationTimer = 0;
            animationFrame = (animationFrame + 1) % 4;
        }
    }

    function animate() {
        updateCharacterPosition();
        updateAnimation();
        animationFrameId = requestAnimationFrame(animate);
    }

    function startAnimation() {
        animationFrameId = requestAnimationFrame(animate);
    }
</script>

<div class="character" style="--krisX: {characterX}px; --krisY: {characterY - 25}px; z-index: {krisZIndex};">
    <div class="character_kris" style="background-image: url('{krisSpriteUrl}');"></div>
    <div class="character_heart"></div>
</div>

<div class="character_susie"
    style="background-image: url('{susieSpriteUrl}'); --susieX: {characterSusie_X - 35}px; --susieY: {characterSusie_Y - 140}px; z-index: {susieZIndex};">
</div>
<div class="character_ralsei"
    style="background-image: url('{ralseiSpriteUrl}'); --ralseiX: {characterRalsei_X - 35}px; --ralseiY: {characterRalsei_Y - 130}px; z-index: {ralseiZIndex};">
</div>

{#each obstacles as obstacle (obstacle.x + '-' + obstacle.y)}
    <div
        class="obstacle"
        style="
            top: {obstacle.y}px; left: {obstacle.x}px;
            width: {obstacle.width}px; height: {obstacle.height}px;
            background-image: url('{obstacle.sprite}');
            background-color: {obstacle.sprite ? 'transparent' : 'firebrick'};
            z-index: {obstacle.zIndex};
        "
    ></div>
{/each}

{#each interactionBoxes as interactionB (interactionB.x + '-' + interactionB.y)}
    <div
        class="interactionBox"
        style="
            top: {interactionB.y}px; left: {interactionB.x}px;
            width: {interactionB.width}px; height: {interactionB.height}px;
        "
    ></div>
{/each}

{#if showInteractionGif}
    <div class="gif-overlay" style="background-image: url('{currentInteractionGif}');"></div>
{/if}

<style>
    :global(body) {
        background-color: #000000;
        margin: 0;
        overflow: hidden;
    }

    .obstacle {
        position: absolute;
        background-size: contain;
        background-repeat: no-repeat;
        background-position: center;
        image-rendering: pixelated;
    }

    .interactionBox {
        position: absolute;
    }

    .gif-overlay {
        position: fixed;
        top: 70%;
        left: 10%;
        width: 80%;
        height: 30%;
        background-size: contain;
        background-repeat: no-repeat;
        background-position: center;
        image-rendering: pixelated;
        z-index: 10000;
    }

    .character {
        width: 30px;
        height: 30px;
        position: fixed;
        top: 0;
        left: 0;
        transform: translate(var(--krisX), var(--krisY));
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .character_heart {
        position: absolute;
        width: 100%;
        height: 100%;
        background-image: url('/images/heart.png');
        background-size: contain;
        background-repeat: no-repeat;
        image-rendering: pixelated;
        z-index: 1;
    }

    .character_kris {
        position: absolute;
        width: 90px;
        height: 180px;
        background-size: contain;
        background-repeat: no-repeat;
        image-rendering: pixelated;
        z-index: 2;
    }

    .character_susie {
        position: absolute;
        width: 120px;
        height: 240px;
        transform: translate(var(--susieX), var(--susieY));
        background-size: contain;
        background-repeat: no-repeat;
        image-rendering: pixelated;
    }

    .character_ralsei {
        position: absolute;
        width: 110px;
        height: 220px;
        transform: translate(var(--ralseiX), var(--ralseiY));
        background-size: contain;
        background-repeat: no-repeat;
        image-rendering: pixelated;
    }
</style>