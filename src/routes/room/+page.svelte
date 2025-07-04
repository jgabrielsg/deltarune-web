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

    // --- Game State and Properties ---
    let characterX = 0;
    let characterY = 0;
    let characterX_2 = 0;
    let characterY_2 = 0;
    let characterX_3 = 0;
    let characterY_3 = 0;

    let krisZIndex = 0;
    let susieZIndex = 0;
    let ralseiZIndex = 0;

    const characterSize = 30;
    const speed = 3;
    const runSpeed = 6;

    let pressedKeys = {
        ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false, Shift: false,
    };

    let obstacles = [];
    let windowWidth = 0;
    let windowHeight = 0;
    let animationFrameId;

    // --- Animation ---
    let direction = 'd';  // Initial direction
    let susieDirection = 'd';
    let ralseiDirection = 'd';

    let animationFrame = 0;
    let isMoving = false;
    let animationTimer = 0;
    const animationSpeed = 16;

    // Player positions history for followers
    let playerPositionHistory = [];
    const maxHistorySize = 80; // how many frames will ralsei be away from Kris. Susie will be x/2

    onMount(() => {
        if (typeof window !== 'undefined') {
            windowWidth = window.innerWidth;
            windowHeight = window.innerHeight;

            // Obstacles that can be added. Uses the object
            // NOTA: Para z-index dinâmico, o y do obstáculo define sua "profundidade" inicial.
            obstacles = [
                new Obstacle(0, 0, windowWidth/2 - 120, 80),
                new Obstacle(windowWidth/2 + 120, 0, windowWidth/2, 80), // x, y, width, height
                new Obstacle(0, 80, 80, 250), 
                new Obstacle(0, 580, 80, 300), 
                new Obstacle(windowWidth-80, 80, 80, 250),
                new Obstacle(windowWidth-80, 580, 80, 300), 
                new Obstacle(0, windowHeight-80, windowWidth, 80),
            ];

            characterX = (windowWidth / 2) - (characterSize / 2);
            characterY = 120;

            // Preenche o histórico de posições no início para evitar saltos
            // Importante: Faça isso APENAS depois de definir characterX e characterY
            for (let i = 0; i < maxHistorySize; i++) {
                playerPositionHistory.push({ x: characterX, y: characterY, direc: direction });
            }

            characterX_2 = characterX; // Inicia na mesma posição do Kris
            characterY_2 = characterY;

            characterX_3 = characterX; // Inicia na mesma posição do Kris
            characterY_3 = characterY;

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
        if (pressedKeys.hasOwnProperty(event.key)) {
            event.preventDefault();
            pressedKeys[event.key] = true;
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

    let krisSpriteUrl = '/kris/spr_krisd_dark(0).png';
    let susieSpriteUrl = '/susie/spr_susieu_eye_dark(0).png';
    let ralseiSpriteUrl = '/ralsei/spr_ralseiu(0).png';

    // Updates everytime "direction" or "animationFrame" change
    $: {
        krisSpriteUrl = `/kris/spr_kris${direction}_dark(${animationFrame}).png`;
    }
    $: {
        susieSpriteUrl = `/susie/spr_susie${susieDirection}_eye_dark(${animationFrame}).png`;
    }
    $: {
        ralseiSpriteUrl = `/ralsei/spr_ralsei${ralseiDirection}(${animationFrame}).png`;
    }

    // --- Main Game Loop Update ---
    function updateCharacterPosition() {
        const currentSpeed = pressedKeys.Shift ? runSpeed : speed;

        let newX = characterX;
        let newY = characterY;

        if (pressedKeys.ArrowUp) newY -= currentSpeed;
        if (pressedKeys.ArrowDown) newY += currentSpeed;
        if (pressedKeys.ArrowLeft) newX -= currentSpeed;
        if (pressedKeys.ArrowRight) newX += currentSpeed;

        // Functions to look for colision in the X and Y dimensions for EVERY obstacle
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

        if (characterY  <= 0) {
            cancelAnimationFrame(animationFrameId);

            // Exemplo de como você pode tentar construir a URL de forma mais "segura"
            // Isso é útil se você tem um basePath, mas '/room' já é absoluto.
            const roomUrl = new URL('/', window.location.origin).pathname;
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
            characterX_2 = susiePosition.x;
            characterY_2 = susiePosition.y;
            susieDirection = susiePosition.direc;
            susieZIndex = characterY_2 + characterSize; // Z-index based on Susie's Y
        }

        // --- Update Ralsei's Position and Direction ---
        const ralseiDelayIndex = Math.max(0, playerPositionHistory.length - maxHistorySize - 1);
        if (playerPositionHistory.length > 0) { 
            const ralseiPosition = playerPositionHistory[ralseiDelayIndex];
            characterX_3 = ralseiPosition.x;
            characterY_3 = ralseiPosition.y;
            ralseiDirection = ralseiPosition.direc;
            ralseiZIndex = characterY_3 + characterSize; // Z-index based on Ralsei's Y
        }

        // --- Update Obstacle Z-Indices ---
        obstacles = obstacles.map(obstacle => {
            obstacle.zIndex = obstacle.y;
            return obstacle;
        });
    }

    // --- Character animations ---
    function updateAnimation() {
        isMoving = pressedKeys.ArrowUp || pressedKeys.ArrowDown || pressedKeys.ArrowLeft || pressedKeys.ArrowRight;

        if (!isMoving) {
            animationFrame = 0;
            return;
        }

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

<div class="character" style="--krisX: {characterX}px; --krisY: {characterY}px; z-index: {krisZIndex};">
    <div class="character_kris" style="background-image: url('{krisSpriteUrl}');"></div>
    <div class="character_heart"></div>
</div>

<div class="character_susie"
    style="background-image: url('{susieSpriteUrl}'); --susieX: {characterX_2 - 35}px; --susieY: {characterY_2 - 115}px; z-index: {susieZIndex};">
</div>
<div class="character_ralsei"
    style="background-image: url('{ralseiSpriteUrl}'); --ralseiX: {characterX_3 - 35}px; --ralseiY: {characterY_3 - 105}px; z-index: {ralseiZIndex};">
</div>

{#each obstacles as obstacle (obstacle.x + '-' + obstacle.y)} <div
        class="obstacle"
        style="
            top: {obstacle.y}px; left: {obstacle.x}px;
            width: {obstacle.width}px; height: {obstacle.height}px;
            background-image: {obstacle.sprite ? `url(${obstacle.sprite})` : 'none'};
            background-color: {obstacle.sprite ? 'transparent' : 'firebrick'};
            z-index: {obstacle.zIndex};
        "
    ></div>
{/each}

---

<style>
    :global(body) {
        background-color: #000000;
        margin: 0;
        overflow: hidden;
    }

    .obstacle {
        position: absolute;
        background-size: cover;
        background-repeat: no-repeat;
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
        /* dinamic z-index  */
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
        background-image: url('/kris/spr_krisd_dark(0).png');
        background-size: contain;
        background-repeat: no-repeat;
        image-rendering: pixelated;
        z-index: 2; 
    }

    .character_susie {
        position: absolute;
        width: 120px;
        height: 240px;
        background-image: url('/susie/spr_susied_eye_dark(0).png');
        transform: translate(var(--susieX), var(--susieY));
        background-size: contain;
        background-repeat: no-repeat;
        image-rendering: pixelated;
        /* dinamic z-index  */
    }

    .character_ralsei {
        position: absolute;
        width: 110px;
        height: 220px;
        background-image: url('/ralsei/spr_ralseid(0).png');
        transform: translate(var(--ralseiX), var(--ralseiY));
        background-size: contain;
        background-repeat: no-repeat;
        image-rendering: pixelated;
        /* dinamic z-index  */
    }
</style>