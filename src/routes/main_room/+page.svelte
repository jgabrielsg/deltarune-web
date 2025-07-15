<script>
    import { onMount, onDestroy } from 'svelte';
    import { goto } from '$app/navigation';
    import { game, Obstacle } from '$lib/GameCore.js';

    // Svelte's reactivity for imported store
    let {
        characterX, characterY, characterSusie_X, characterSusie_Y, characterRalsei_X, characterRalsei_Y,
        krisZIndex, susieZIndex, ralseiZIndex,
        characterSize,
        direction, susieDirection, ralseiDirection,
        animationFrame,
        obstacles
    } = game.state;

    // Subscribe to game state changes
    const unsubscribe = game.subscribe(newState => {
        ({
            characterX, characterY, characterSusie_X, characterSusie_Y, characterRalsei_X, characterRalsei_Y,
            krisZIndex, susieZIndex, ralseiZIndex,
            characterSize,
            direction, susieDirection, ralseiDirection,
            animationFrame,
            obstacles
        } = newState);
    });

    onMount(() => {
        if (typeof window !== 'undefined') {
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;

            game.setWindowDimensions(windowWidth, windowHeight);
            game.setInteractionBoxes([]); // No interaction boxes in this room for now

            game.setObstacles([
                new Obstacle(0, 0, windowWidth / 2 - 120, 80),
                new Obstacle(windowWidth / 2 + 120, 0, windowWidth / 2, 80),
                new Obstacle(0, 80, 80, 250),
                new Obstacle(0, 580, 80, 300),
                new Obstacle(windowWidth - 80, 80, 80, 250),
                new Obstacle(windowWidth - 80, 580, 80, 300),
                new Obstacle(0, windowHeight - 80, windowWidth, 80),
            ]);

            window.addEventListener('keydown', game.handleKeyDown);
            window.addEventListener('keyup', game.handleKeyUp);

            // Pass goto as a callback for room transitions
            game.startAnimation(boundaryHit => {
                game.cancelAnimation(); // Stop animation before navigating
                if (boundaryHit === 'top') {
                    game.initializeCharacterPosition((windowWidth / 2) - (characterSize / 2), 550);
                    goto('/'); // Go to '/'  when hitting top
                };
                if (boundaryHit === 'right') {
                    game.initializeCharacterPosition(150, 450);
                    goto('/right_room'); 
                };
                if (boundaryHit === 'left') {
                    game.initializeCharacterPosition(windowWidth - 150, 450);
                    goto('/left_room'); 
                };
            });
        }
    });

    onDestroy(() => {
        if (typeof window !== 'undefined') {
            window.removeEventListener('keydown', game.handleKeyDown);
            window.removeEventListener('keyup', game.handleKeyUp);
            game.cancelAnimation();
            unsubscribe(); // Clean up subscription
        }
    });

    // Reactive declarations for sprite URLs based on shared state
    $: krisSpriteUrl = `/kris/spr_kris${direction}_dark(${animationFrame}).png`;
    $: susieSpriteUrl = `/susie/spr_susie${susieDirection}_eye_dark(${animationFrame}).png`;
    $: ralseiSpriteUrl = `/ralsei/spr_ralsei${ralseiDirection}(${animationFrame}).png`;
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
            z-index: {Math.floor(obstacle.y)};
            width: {obstacle.width}px; height: {obstacle.height}px;
            background-image: url('{obstacle.sprite}');
            background-color: {obstacle.sprite ? 'transparent' : 'firebrick'};
        "
    ></div>
{/each}

<style>
    :global(body) {
        background-color: #000000;
        margin: 0;
        overflow: hidden;
    }
</style>