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
        playerInInteractionZone, // Keep this for potential UI hints
        gamePaused, // Keep this for potential UI hints
        tileSize, 
        tileMap,
        showDialogueBox,
        dialogueText,
        dialogueFace,
        isTyping,
    } = game.state;

    let displayedText = '';

    // 'face' mapping
    const portraits = {
        //frog1: '/images/faces/frog.png', //example
    };

    $: if (isTyping && dialogueText) {
        startTypewriter(dialogueText);
    }

    let typewriterTimeout;
    
    function startTypewriter(fullText) {
        displayedText = '';
        let currentIndex = 0;

        const typeCharacter = () => {
            // Is z, stop tymeout
            if (!isTyping) {
                displayedText = fullText;
                clearTimeout(typewriterTimeout);
                return;
            }

            // Next char
            displayedText += fullText[currentIndex];
            
            // Changes the delay depending of the char
            const char = fullText[currentIndex];
            let delay = 50; // default
            if (char === '.' || char === '!' || char === '?') {
                delay = 400; // bigger delay for punctuation
            } else if (char === ',') {
                delay = 200; 
            }
            
            currentIndex++;

            // Stops typing after writing everything
            if (currentIndex < fullText.length) {
                typewriterTimeout = setTimeout(typeCharacter, delay);
            } else {
                game.state.isTyping = false; 
            }
        };

        typeCharacter(); // typing loop
    }

    // Subscribe to game state changes
    const unsubscribe = game.subscribe(newState => {
        ({
            characterX, characterY, characterSusie_X, characterSusie_Y, characterRalsei_X, characterRalsei_Y,
            krisZIndex, susieZIndex, ralseiZIndex,
            characterSize,
            direction, susieDirection, ralseiDirection,
            animationFrame,
            obstacles, interactionBoxes,
            playerInInteractionZone,
            gamePaused,
            tileSize,
            tileMap,
            showDialogueBox,
            dialogueText,
            dialogueFace,
            isTyping,
        } = newState);
    });

    const tileset = {
        // Floor
        90: '/images/tiles/ruinsLight.png',
        91: '/images/tiles/ruinsDark.png',
        92: '/images/tiles/ruinsTL.png',
        93: '/images/tiles/ruinsTR.png',
        94: '/images/tiles/ruinsDL.png',
        95: '/images/tiles/ruinsDR.png',
        
        99: '/images/tiles/BLACK.png',

        // Main wall
        10: '/images/tiles/ruinsWallD.png',
        11: '/images/tiles/ruinsWall.png',
        12: '/images/tiles/ruinsWallT.png',

        // Main wall (corner)
        13: '/images/tiles/ruinsWallDC.png',
        14: '/images/tiles/ruinsWallC.png',
        15: '/images/tiles/ruinsWallTC.png',
    
        16: '/images/tiles/ruinsWallDC_2.png',
        17: '/images/tiles/ruinsWallC_2.png',
        18: '/images/tiles/ruinsWallTC_2.png',

        // Side walls
        20: '/images/tiles/ruinsWallL.png',
        21: '/images/tiles/ruinsWallR.png',
        22: '/images/tiles/ruinsWallDOWN.png',

        // Corners walls
        30: '/images/tiles/ruinsWallTL.png',
        31: '/images/tiles/ruinsWallTR.png',
        32: '/images/tiles/ruinsWallDL.png',
        33: '/images/tiles/ruinsWallDR.png',

        34: '/images/tiles/ruinsWallTLIn.png',
        35: '/images/tiles/ruinsWallTRIn.png',
        36: '/images/tiles/ruinsWallDLIn.png',
        37: '/images/tiles/ruinsWallDRIn.png',

        38: '/images/tiles/ruinsWallDLC.png',
        39: '/images/tiles/ruinsWallDRC.png',
    };

    // 24x14 matrix of tilesets. Each number is an id for an image
    const roomTileMap = [                           //12 13
        [30, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 31], // 1
        [20, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 21],
        [20, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 21],
        [20, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 21],
        [20, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 21],
        [20, 91, 92, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 93, 91, 21], 
        [20, 91, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 91, 21], // 7
        [20, 91, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 91, 21], // 8
        [20, 91, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 91, 21], 
        [20, 91, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 91, 21], 
        [20, 91, 94, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 95, 91, 21], 
        [20, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 90, 90, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 21],
        [36, 22, 22, 22, 22, 22, 22, 22, 22, 22, 35, 90, 90, 34, 22, 22, 22, 22, 22, 22, 22, 22, 22, 37],
        [99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 20, 90, 90, 21, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99], // 14
    ];

    onMount(() => {
        if (typeof window !== 'undefined') {
            const windowWidth = 1536;
            const windowHeight = 864;

            game.setWindowDimensions(windowWidth, windowHeight);
            //console.log(windowWidth, windowHeight); // 1536, 864

            game.setObstacles([
                new Obstacle(0, 0, windowWidth, 226), // -30 height to get closest to the wall
                new Obstacle(0, 1, 96, windowHeight),
                new Obstacle(windowWidth - 96, 1, 96, windowHeight),
                new Obstacle(0, windowHeight - 140, windowWidth / 2 - 44, 150), // + 12 top so we don't touch the down wall
                new Obstacle(windowWidth / 2 + 44, windowHeight - 140, windowWidth / 2 - 64, 150),

                // objects with interaction
                new Obstacle(windowWidth/2      -60, windowHeight / 2 - 20, 120, 80, '/images/spr_classdesk(0).png'),
                new Obstacle(windowWidth/2 - 256-60, 128, 120, 80, '/images/spr_sign.png'),
                new Obstacle(windowWidth/2      -60, 128, 120, 80, '/images/spr_sign.png'),
                new Obstacle(windowWidth/2 + 256-60, 128, 120, 80, '/images/spr_sign.png'),
            ]);

            game.setInteractionBoxes([
                new InteractionBox(windowWidth / 2 - 80, windowHeight / 2 - 60, 200, 210, '* It\'s a table. It seems to be mixing up well'),

                new InteractionBox(windowWidth/2 - 256-120, 128, 240, 160, '* Move around using the arrow keys. You probably knew that'),
                new InteractionBox(windowWidth/2      -120, 128, 240, 160, '* Interact with objects using Z. You probably also knew that.'),
                new InteractionBox(windowWidth/2 + 256-120, 128, 240, 160, '* You can sprint holding left shift. Now I got you.'),
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
    $: krisSpriteUrl = `/images/kris/spr_kris${direction}_dark(${animationFrame}).png`;
    $: susieSpriteUrl = `/images/susie/spr_susie${susieDirection}_eye_dark(${animationFrame}).png`;
    $: ralseiSpriteUrl = `/images/ralsei/spr_ralsei${ralseiDirection}(${animationFrame}).png`;
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


<div class="character" style="--krisX: {characterX }px; --krisY: {characterY - 25}px; z-index: {krisZIndex};">
    <div class="character_kris" style="background-image: url('{krisSpriteUrl}');"></div>
    <div class="character_heart"></div>
</div>

<div class="character_susie"
    style="background-image: url('{susieSpriteUrl}'); --susieX: {characterSusie_X - 45}px; --susieY: {characterSusie_Y - 140}px; z-index: {susieZIndex};">
</div>
<div class="character_ralsei"
    style="background-image: url('{ralseiSpriteUrl}'); --ralseiX: {characterRalsei_X - 45}px; --ralseiY: {characterRalsei_Y - 130}px; z-index: {ralseiZIndex};">
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
            opacity: {obstacle.sprite ? '1' : '0.2'}
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

{#if showDialogueBox}
    <div class="dialogue-overlay">
        <div class="dialogue-box">
            {#if dialogueFace && portraits[dialogueFace]}
                <img class="dialogue-face" src="{portraits[dialogueFace]}" alt="Character Face" />
            {/if}
            <p class="dialogue-text">
                {displayedText}
            </p>
        </div>
    </div>
{/if}

<style>
    :global(body) {
        background-color: #000000;
        margin: 0;
        overflow: hidden;
    }
</style>