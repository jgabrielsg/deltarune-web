<script>
    import { onMount, onDestroy } from 'svelte';
    import { goto } from '$app/navigation';
    import { game, Obstacle, InteractionBox } from '$lib/GameCore.js';
    import { base } from '$app/paths';

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
        90: `${base}/images/tiles/ruinsLight.png`,
        91: `${base}/images/tiles/ruinsDark.png`,
        92: `${base}/images/tiles/ruinsTL.png`,
        93: `${base}/images/tiles/ruinsTR.png`,
        94: `${base}/images/tiles/ruinsDL.png`,
        95: `${base}/images/tiles/ruinsDR.png`,
        
        99: `${base}/images/tiles/BLACK.png`,

        // Main wall
        10: `${base}/images/tiles/ruins2WallDC.png`, // changed this one
        11: `${base}/images/tiles/ruins2Wall.png`, // changed this one
        12: `${base}/images/tiles/ruins2WallTC.png`, // changed this one

        // Main wall (corner)
        13: `${base}/images/tiles/ruinsWallDC.png`,
        14: `${base}/images/tiles/ruinsWallC.png`,
        15: `${base}/images/tiles/ruinsWallTC.png`,
    
        16: `${base}/images/tiles/ruins2WallDCL.png`, // changed this one
        17: `${base}/images/tiles/ruins2WallCL.png`, // changed this one
        18: `${base}/images/tiles/ruins2WallTCL.png`, // changed this one

        // Side walls
        20: `${base}/images/tiles/ruinsWallL.png`,
        21: `${base}/images/tiles/ruinsWallR.png`,
        22: `${base}/images/tiles/ruinsWallDOWN.png`,

        // Corners walls
        30: `${base}/images/tiles/ruinsWallTL.png`,
        31: `${base}/images/tiles/ruinsWallTR.png`,
        32: `${base}/images/tiles/ruinsWallDL.png`,
        33: `${base}/images/tiles/ruinsWallDR.png`,

        34: `${base}/images/tiles/ruinsWallTLIn.png`,
        35: `${base}/images/tiles/ruinsWallTRIn.png`,
        36: `${base}/images/tiles/ruinsWallDLIn.png`,
        37: `${base}/images/tiles/ruinsWallDRIn.png`,

        38: `${base}/images/tiles/ruinsWallDLC.png`,
        39: `${base}/images/tiles/ruinsWallDRC.png`,
    };

    // 24x14 matrix of tilesets. Each number is an id for an image
    const roomTileMap = [                           //12 13
        [30, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 31], // 1
        [20, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 21],
        [20, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 21],
        [20, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 21],
        [20, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 18],
        [20, 91, 92, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 93, 91, 17], 
        [20, 91, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 91, 17], // 7
        [20, 91, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 91, 16], // 8
        [20, 91, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90], 
        [20, 91, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90], 
        [20, 91, 94, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 95, 91, 34], 
        [20, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 21],
        [36, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 37],
        [99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99], // 14
    ];

    onMount(() => {
        if (typeof window !== 'undefined') {
            const windowWidth = 1536;
            const windowHeight = 864;

            game.setWindowDimensions(windowWidth, windowHeight);

            game.setObstacles([
                new Obstacle(0, 0, windowWidth, 224),

                new Obstacle(0, 1, 96, windowHeight),
                new Obstacle(windowWidth - 96, 1, 96, 480),
                new Obstacle(windowWidth - 96, 590, 96, 300),

                new Obstacle(0, windowHeight - 150, windowWidth, 150),

                new Obstacle(704, 123, 64, 128, `${base}/images/tiles/fakewater/spr_fakewateropenl_0.png`),
                new Obstacle(768, 123, 64, 128, `${base}/images/tiles/fakewater/spr_fakewateropenm_0.png`),
                new Obstacle(832, 123, 64, 128, `${base}/images/tiles/fakewater/spr_fakewateropenr_0.png`),
                new Obstacle(704, 201, 64, 64, `${base}/images/tiles/fakewater/spr_fakewaterl_0.png`),
                new Obstacle(768, 201, 64, 64, `${base}/images/tiles/fakewater/spr_fakewaterm_0.png`),
                new Obstacle(832, 201, 64, 64, `${base}/images/tiles/fakewater/spr_fakewaterr_0.png`),
                new Obstacle(704, 265, 64, 64, `${base}/images/tiles/fakewater/spr_fakewaterl_0.png`),
                new Obstacle(768, 265, 64, 64, `${base}/images/tiles/fakewater/spr_fakewaterm_0.png`),
                new Obstacle(832, 265, 64, 64, `${base}/images/tiles/fakewater/spr_fakewaterr_0.png`),
                new Obstacle(704, 329, 64, 64, `${base}/images/tiles/fakewater/spr_fakewaterl_0.png`),
                new Obstacle(768, 329, 64, 64, `${base}/images/tiles/fakewater/spr_fakewaterm_0.png`),
                new Obstacle(832, 329, 64, 64, `${base}/images/tiles/fakewater/spr_fakewaterr_0.png`),
                new Obstacle(704, 393, 64, 64, `${base}/images/tiles/fakewater/spr_fakewaterl_0.png`),
                new Obstacle(768, 393, 64, 64, `${base}/images/tiles/fakewater/spr_fakewaterm_0.png`),
                new Obstacle(832, 393, 64, 64, `${base}/images/tiles/fakewater/spr_fakewaterr_0.png`),

                new Obstacle(704, 393+135, 64, 64, `${base}/images/tiles/fakewater/spr_fakewatershadowl_0.png`),
                new Obstacle(768, 393+135, 64, 64, `${base}/images/tiles/fakewater/spr_fakewatershadowm_0.png`),
                new Obstacle(832, 393+135, 64, 64, `${base}/images/tiles/fakewater/spr_fakewatershadowr_0.png`),
                new Obstacle(704, 393+199, 64, 64, `${base}/images/tiles/fakewater/spr_fakewaterl_0.png`),
                new Obstacle(768, 393+199, 64, 64, `${base}/images/tiles/fakewater/spr_fakewaterm_0.png`),
                new Obstacle(832, 393+199, 64, 64, `${base}/images/tiles/fakewater/spr_fakewaterr_0.png`),
                new Obstacle(704, 393+263, 64, 64, `${base}/images/tiles/fakewater/spr_fakewaterl_0.png`),
                new Obstacle(768, 393+263, 64, 64, `${base}/images/tiles/fakewater/spr_fakewaterm_0.png`),
                new Obstacle(832, 393+263, 64, 64, `${base}/images/tiles/fakewater/spr_fakewaterr_0.png`),
                new Obstacle(704, 393+263+48, 64, 64, `${base}/images/tiles/fakewater/spr_fakewaterl_0.png`),
                new Obstacle(768, 393+263+48, 64, 64, `${base}/images/tiles/fakewater/spr_fakewaterm_0.png`),
                new Obstacle(832, 393+263+48, 64, 64, `${base}/images/tiles/fakewater/spr_fakewaterr_0.png`),

                new Obstacle(425, 48, 150, 256, `${base}/images/spr_pillar_0.png`),
                new Obstacle(1036, 48, 150, 256, `${base}/images/spr_pillar_0.png`),

                new Obstacle(160, 400, 92, 110, `${base}/images/spr_dummy_0.png`, 'dummy'),
            ]);

            game.setInteractionBoxes([
                new InteractionBox(120, 360, 160, 120, '* It\'s a training dummy. You are not sure why, but it looks threatening.', 'null', 'frog1'),
            ]);

            game.setTileMap(roomTileMap); 

            window.addEventListener('keydown', game.handleKeyDown);
            window.addEventListener('keyup', game.handleKeyUp);

            // Pass goto as a callback for room transitions
            game.startAnimation(boundaryHit => {
                game.cancelAnimation();
                if (boundaryHit === 'right') {
                    game.initializeCharacterPosition(150, 530);
                    goto('/deltarune-web/main-room');
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
    $: krisSpriteUrl = `${base}/images/kris/spr_kris${direction}_dark(${animationFrame}).png`;
    $: susieSpriteUrl = `${base}/images/susie/spr_susie${susieDirection}_eye_dark(${animationFrame}).png`;
    $: ralseiSpriteUrl = `${base}/images/ralsei/spr_ralsei${ralseiDirection}(${animationFrame}).png`;

    const bridgeeUrl = `${base}/images/tiles/fakewater/bad_bridge.png`;
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
    style="background-image: url('{susieSpriteUrl}'); --susieX: {characterSusie_X - 35}px; --susieY: {characterSusie_Y - 115}px; z-index: {susieZIndex};">
</div>
<div class="character_ralsei"
    style="background-image: url('{ralseiSpriteUrl}'); --ralseiX: {characterRalsei_X - 35}px; --ralseiY: {characterRalsei_Y - 105}px; z-index: {ralseiZIndex};">
</div>

<div class="bridge"
    style="background-image: url('{bridgeeUrl}'); top: 450px; left: 704px; height:80px; width:192px; z-index: 100;">
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

    .bridge {
        position: absolute;
        background-size: contain;
        background-repeat: no-repeat;
        background-position: center;
        image-rendering: pixelated;
    }
</style>