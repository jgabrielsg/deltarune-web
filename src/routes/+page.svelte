<script>
  import { onMount, onDestroy } from 'svelte';

  // --- Obstacle Class Definition ---
  class Obstacle {
    constructor(x, y, width, height, sprite = null) {
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
      this.sprite = sprite;
      this.bounds = { x, y, width, height };
    }
  }

  // --- Game State and Properties ---
  let characterX = 0;
  let characterY = 0;
  let characterX_2 = 0;
  let characterY_2 = 0;
  let characterX_3 = 0;
  let characterY_3 = 0;

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
  let animationFrame = 0;  // which sprite we are from (0-3)
  let isMoving = false;                              
  let animationTimer = 0;
  const animationSpeed = 16; 


  let krisSpriteUrl = '/kris/spr_krisd_dark(0).png';
  let susieSpriteUrl = '/susie/spr_susieu_dark(0).png'; 
  let ralseiSpriteUrl = '/ralsei/spr_ralseiu(0).png'; 
  
  // Updates everytime "direction" or "animationFrame" change
  $: {
    krisSpriteUrl = `/kris/spr_kris${direction}_dark(${animationFrame}).png`;
  }
  $: {
    susieSpriteUrl = `/susie/spr_susie${direction}_eye_dark(${animationFrame}).png`;
  }
  $: {
    ralseiSpriteUrl = `/ralsei/spr_ralsei${direction}(${animationFrame}).png`;
  }

  onMount(() => {
    if (typeof window !== 'undefined') {
      windowWidth = window.innerWidth;
      windowHeight = window.innerHeight;

      // Obstacles that can be added. Uses the object
      obstacles = [
        new Obstacle(100, 100, 600, 80),      
        new Obstacle(180, 100, 80, 300),      
        new Obstacle(180, 620, 80, 300),
      ];

      characterX = (windowWidth / 2) - (characterSize / 2);
      characterY = 0

      characterX_2 = (windowWidth / 2) - (characterSize / 2);
      characterY_2 = 0

      characterX_3 = (windowWidth / 2) - (characterSize / 2);
      characterY_3 = 0

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

  // Player positions (from where susie and ralsei will follow you)
  let playerPositionHistory = [];

  function updateCharacterPosition() {
    const currentSpeed = pressedKeys.Shift ? runSpeed : speed; // Checks if we are running

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

    // Get the player positions and puts it in an array
    const lastRecordedPosition = playerPositionHistory[playerPositionHistory.length - 1];
    if (!lastRecordedPosition || lastRecordedPosition.x !== characterX || lastRecordedPosition.y !== characterY) {
        playerPositionHistory.push({ x: characterX, y: characterY });
        console.log(playerPositionHistory);
    }

    const maxHistorySize = 80; // how many frames will ralsei be away from Kris. Susie will be x/2
    if (playerPositionHistory.length > maxHistorySize) {
        playerPositionHistory.shift(); // take the last element out
    }

    if (playerPositionHistory.length > maxHistorySize/2) {
        const delayedPosition2 = playerPositionHistory[maxHistorySize/2];
        characterX_2 = delayedPosition2.x;
        characterY_2 = delayedPosition2.y;
    }

    if (playerPositionHistory.length > 0) {
        const delayedPosition3 = playerPositionHistory[0];
        characterX_3 = delayedPosition3.x;
        characterY_3 = delayedPosition3.y;
    }
  }

  // --- Character animations ---
  function updateAnimation() {
    isMoving = pressedKeys.ArrowUp || pressedKeys.ArrowDown || pressedKeys.ArrowLeft || pressedKeys.ArrowRight;

    // If it's not moving, back to sprite 0
    if (!isMoving) {
      animationFrame = 0;
      return;
    }

    // If moving, changes direction
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

{#each obstacles as obstacle}
  <div
    class="obstacle"
    style="
      top: {obstacle.y}px; left: {obstacle.x}px;
      width: {obstacle.width}px; height: {obstacle.height}px;
      background-image: {obstacle.sprite ? `url(${obstacle.sprite})` : 'none'};
      background-color: {obstacle.sprite ? 'transparent' : 'firebrick'};
    "
  ></div>
{/each}

<div class="character" style="--krisX: {characterX}px; --krisY: {characterY}px;">
  <div class="character_kris" style="background-image: url('{krisSpriteUrl}');"></div>
  <div class="character_heart"></div>
</div>

<div class="character_susie" 
    style="background-image: url('{susieSpriteUrl}'); --susieX: {characterX_2 - 35}px; --susieY: {characterY_2 - 100}px;">
</div>
<div class="character_ralsei"
    style="background-image: url('{ralseiSpriteUrl}'); --ralseiX: {characterX_3 - 30}px; --ralseiY: {characterY_3 - 70}px;">
</div>

<style>
  :global(body) {
    background-color: #000000;
    margin: 0;
    overflow: hidden;
  }

  .obstacle {
    position: absolute;
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
    transform: translate(var(--krisX), var(--krisY));
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
    background-image: url('/kris/spr_krisd_dark(0).png');
    background-size: contain;
    background-repeat: no-repeat;
    image-rendering: pixelated;
    z-index: 2;
  }

  .character_susie {
    position: absolute;
    width: 110px;
    height: 220px;
    background-image: url('/susie/spr_susied_eye_dark(0).png');
    transform: translate(var(--susieX), var(--susieY));
    background-size: contain;
    background-repeat: no-repeat;
    image-rendering: pixelated;
    z-index: 2;
  }

  .character_ralsei {
    position: absolute;
    width: 90px;
    height: 180px;
    background-image: url('/ralsei/spr_ralseid(0).png');
    transform: translate(var(--ralseiX), var(--ralseiY));
    background-size: contain;
    background-repeat: no-repeat;
    image-rendering: pixelated;
    z-index: 2;
  }
</style>