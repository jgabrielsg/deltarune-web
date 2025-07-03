<script>
  import { onMount, onDestroy } from 'svelte';

  // --- Obstacle Class Definition ---
  // This class defines the structure for any collidable object in the game.
  class Obstacle {
    constructor(x, y, width, height, sprite = null) {
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
      this.sprite = sprite; // URL for an optional background image
      // The 'bounds' object is used for collision detection.
      this.bounds = { x, y, width, height };
    }
  }

  // --- Game State and Properties ---
  let characterX = 0;
  let characterY = 0;
  const characterSize = 30; // The collision box size (heart size)
  const speed = 3;
  const runSpeed = 6;

  let pressedKeys = {
    ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false, Shift: false,
  };

  // --- Obstacle Instances ---
  // An array to hold all the obstacles in the level.
  let obstacles = [];

  let windowWidth = 0;
  let windowHeight = 0;
  let animationFrameId;

  onMount(() => {
    if (typeof window !== 'undefined') {
      windowWidth = window.innerWidth;
      windowHeight = window.innerHeight;

      // --- Initialize the Level ---
      // Create instances of the Obstacle class and add them to the array.
      obstacles = [
        new Obstacle(100, 100, 600, 80),  
        new Obstacle(180, 100, 80, 300),    
        new Obstacle(180, 620, 80, 300),      
      ];

      characterX = (windowWidth / 2) - (characterSize / 2);
      characterY = windowHeight - characterSize * 3;

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

  // AABB (Axis-Aligned Bounding Box) collision detection utility function
  function isColliding(rect1, rect2) {
    return (
      rect1.x < rect2.x + rect2.width &&
      rect1.x + rect1.width > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.y + rect1.height > rect2.y
    );
  }

  function updateCharacterPosition() {
    const currentSpeed = pressedKeys.Shift ? runSpeed : speed;

    let newX = characterX;
    let newY = characterY;

    if (pressedKeys.ArrowUp) newY -= currentSpeed;
    if (pressedKeys.ArrowDown) newY += currentSpeed;
    if (pressedKeys.ArrowLeft) newX -= currentSpeed;
    if (pressedKeys.ArrowRight) newX += currentSpeed;

    // --- Collision Logic ---
    const futureXBounds = { x: newX, y: characterY, width: characterSize, height: characterSize };
    // Check for X-axis collision with ANY obstacle
    for (const obstacle of obstacles) {
      if (isColliding(futureXBounds, obstacle.bounds)) {
        newX = characterX; // Collision detected, revert X movement
        break; // Stop checking once one collision is found
      }
    }

    const futureYBounds = { x: newX, y: newY, width: characterSize, height: characterSize };
    // Check for Y-axis collision with ANY obstacle
    for (const obstacle of obstacles) {
      if (isColliding(futureYBounds, obstacle.bounds)) {
        newY = characterY; // Collision detected, revert Y movement
        break; // Stop checking once one collision is found
      }
    }

    // Apply screen boundaries and update position
    characterX = Math.max(0, Math.min(newX, windowWidth - characterSize));
    characterY = Math.max(0, Math.min(newY, windowHeight - characterSize));
  }

  function animate() {
    updateCharacterPosition();
    animationFrameId = requestAnimationFrame(animate);
  }

  function startAnimation() {
    animationFrameId = requestAnimationFrame(animate);
  }
</script>

<!-- Renders all obstacles from the 'obstacles' array -->
{#each obstacles as obstacle}
  <div
    class="obstacle"
    style="
      top: {obstacle.y}px;
      left: {obstacle.x}px;
      width: {obstacle.width}px;
      height: {obstacle.height}px;
      background-image: {obstacle.sprite ? `url(${obstacle.sprite})` : 'none'};
      background-color: {obstacle.sprite ? 'transparent' : 'firebrick'};
    "
  ></div>
{/each}

<!-- The character container -->
<div
  class="character"
  style="--characterX: {characterX}px; --characterY: {characterY}px;"
>
  <div class="character_kris"></div>
  <div class="character_heart"></div>
</div>

<style>
  :global(body) {
    background-color: #000000;
    margin: 0;
    overflow: hidden;
  }

  .obstacle {
    position: absolute; /* Position is now set directly via inline styles */
    z-index: 5;
    background-size: cover;
    background-repeat: no-repeat;
  }

  .character {
    width: 30px;
    height: 30px;
    position: fixed;
    top: 0;
    left: 0;
    transform: translate(var(--characterX), var(--characterY));
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10;
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
    background-image: url('/images/kris.png');
    background-size: contain;
    background-repeat: no-repeat;
    image-rendering: pixelated;
    transform: translateY(-20px);
    z-index: 2;
  }
</style>