<script>
    import { onMount, onDestroy } from 'svelte';
    import { goto } from '$app/navigation';
    import { game, Obstacle, InteractionBox } from '$lib/GameCore.js';

    // Svelte's reactivity for imported store
    let {
        characterX, characterY, characterSusie_X, characterSusie_Y, characterRalsei_X, characterRalsei_Y,
        krisZIndex, susieZIndex, ralseiZIndex,
        characterSize,
        direction, susieDirection, ralseiDirection,
        animationFrame,
        obstacles, interactionBoxes,
        showInteractionGif, currentInteractionGif,
        playerInInteractionZone, // Keep this for potential UI hints
        gamePaused, // Keep this for potential UI hints
        tileSize, 
        tileMap 
    } = game.state;

    // Subscribe to game state changes
    const unsubscribe = game.subscribe(newState => {
        ({
            characterX, characterY, characterSusie_X, characterSusie_Y, characterRalsei_X, characterRalsei_Y,
            krisZIndex, susieZIndex, ralseiZIndex,
            characterSize,
            direction, susieDirection, ralseiDirection,
            animationFrame,
            obstacles, interactionBoxes,
            showInteractionGif, currentInteractionGif,
            playerInInteractionZone,
            gamePaused,
            tileSize,
            tileMap
        } = newState);
    });

    const tileset = {
        0: '/images/tiles/ruinsLight.png',
        1: '/images/tiles/ruinsDark.png',
        2: '/images/tiles/ruinsTL.png',
        3: '/images/tiles/ruinsTR.png',
        4: '/images/tiles/ruinsDL.png',
        5: '/images/tiles/ruinsDR.png',

        10: '/images/tiles/ruinsWallD.png',
        11: '/images/tiles/ruinsWall.png',
        12: '/images/tiles/ruinsWallT.png',
        13: '/images/tiles/ruinsWallTLCorner.png',
        14: '/images/tiles/ruinsWallL.png',
        15: '/images/tiles/ruinsWallTRCorner.png',
        16: '/images/tiles/ruinsWallR.png',
        17: '/images/tiles/ruinsWallDLCorner.png',
        18: '/images/tiles/ruinsWallDown.png',
        19: '/images/tiles/ruinsWallDRCorner.png',

        20: '/images/tiles/ruinsWallTLCornerIn.png',
        21: '/images/tiles/ruinsWallTRCornerIn.png',

        99: '/images/tiles/BLACK.png',
    };

    // 24x14 matrix of tilesets. Each number is an id for an image
    const roomTileMap = [               //12 13
        [13, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 15], // 1
        [14, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 16],
        [14, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 16],
        [14, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 16],
        [14, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 16],
        [14, 1, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 1, 16], 
        [14, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 16], 
        [14, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 16], 
        [14, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 16], 
        [14, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 16], 
        [14, 1, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 1, 16], 
        [14, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 16],
        [17, 18, 18, 18, 18, 18, 18, 18, 18, 18, 21, 0, 0, 20, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19],
        [99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 16, 0, 0, 14, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99], // 14
    ];

    onMount(() => {
        if (typeof window !== 'undefined') {
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;

            game.setWindowDimensions(windowWidth, windowHeight);
            //console.log(windowWidth, windowHeight); // 1536, 864

            game.setObstacles([
                new Obstacle(0, 0, windowWidth, 194),
                new Obstacle(0, 80, 80, windowHeight),
                new Obstacle(windowWidth - 80, 80, 80, windowHeight),
                new Obstacle(80, windowHeight - 80, windowWidth / 2 - 240, 80),
                new Obstacle(windowWidth / 2 + 160, windowHeight - 80, windowWidth / 2 - 240, 80),
                new Obstacle(windowWidth / 2 - 40, windowHeight / 2 - 20, 120, 80, './images/spr_classdesk(0).png'),
            ]);

            game.setInteractionBoxes([
                new InteractionBox(windowWidth / 2 - 80, windowHeight / 2 - 60, 200, 160, './gifs/table.gif'),
            ]);

            game.setTileMap(roomTileMap); 

            window.addEventListener('keydown', game.handleKeyDown);
            window.addEventListener('keyup', game.handleKeyUp);

            // Pass goto as a callback for room transitions
            game.startAnimation(boundaryHit => {
                game.cancelAnimation(); // Stop animation before navigating
                if (boundaryHit === 'bottom') {
                    game.initializeCharacterPosition((windowWidth / 2) - (characterSize / 2), 120);
                    goto('/main_room');
                }
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
    $: krisSpriteUrl = `./kris/spr_kris${direction}_dark(${animationFrame}).png`;
    $: susieSpriteUrl = `./susie/spr_susie${susieDirection}_eye_dark(${animationFrame}).png`;
    $: ralseiSpriteUrl = `./ralsei/spr_ralsei${ralseiDirection}(${animationFrame}).png`;
</script>


<div class="tile-container">
    {#each tileMap as row, y}
        {#each row as tileId, x}
            <div
                class="tile"
                style="
                    left: {x * tileSize}px;
                    top: {y * tileSize}px;
                    width: {tileSize}px;
                    height: {tileSize}px;
                    background-image: url({tileset[tileId] || ''});
                "
            ></div>
        {/each}
    {/each}
</div>

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
</style>