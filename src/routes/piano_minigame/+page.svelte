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

	let pressedKeys = [];

	const keyMappings = {
        '1': { sound: '/sounds/C2.mp3', sprite: '/images/piano/spr_C_F.png', width: 16, height: 108, left: 320, top: 8 },
		'2': { sound: '/sounds/Db2.mp3', sprite: '/images/piano/spr_flat.png', width: 12, height: 64, left: 333, top: 8 },
		'3': { sound: '/sounds/D2.mp3', sprite: '/images/piano/spr_D_G_A.png', width: 16, height: 108, left: 340, top: 8 },
		'4': { sound: '/sounds/Eb2.mp3', sprite: '/images/piano/spr_flat.png', width: 12, height: 64, left: 453, top: 8 },
		'5': { sound: '/sounds/E2.mp3', sprite: '/images/piano/spr_B_E.png', width: 16, height: 108, left: 360, top: 8 },
		'6': { sound: '/sounds/F2.mp3', sprite: '/images/piano/spr_C_F.png', width: 16, height: 108, left: 380, top: 8 },
		'7': { sound: '/sounds/Gb2.mp3', sprite: '/images/piano/spr_flat.png', width: 12, height: 64, left: 393, top: 8 },
		'8': { sound: '/sounds/G2.mp3', sprite: '/images/piano/spr_D_G_A.png', width: 16, height: 108, left: 400, top: 8 },
		'9': { sound: '/sounds/Ab2.mp3', sprite: '/images/piano/spr_flat.png', width: 12, height: 64, left: 413, top: 8 },
		'0': { sound: '/sounds/A2.mp3', sprite: '/images/piano/spr_D_G_A.png', width: 16, height: 108, left: 420, top: 8 },
		'-': { sound: '/sounds/Bb2.mp3', sprite: '/images/piano/spr_flat.png', width: 12, height: 64, left: 433, top: 8 },
		'=': { sound: '/sounds/B2.mp3', sprite: '/images/piano/spr_B_E.png', width: 16, height: 108, left: 440, top: 8 },

		'q': { sound: '/sounds/C3.mp3', sprite: '/images/piano/spr_C_F.png', width: 16, height: 108, left: 460, top: 8 },
		'w': { sound: '/sounds/Db3.mp3', sprite: '/images/piano/spr_flat.png', width: 12, height: 64, left: 473, top: 8 },
		'e': { sound: '/sounds/D3.mp3', sprite: '/images/piano/spr_D_G_A.png', width: 16, height: 108, left: 480, top: 8 },
		'r': { sound: '/sounds/Eb3.mp3', sprite: '/images/piano/spr_flat.png', width: 12, height: 64, left: 493, top: 8 },
		't': { sound: '/sounds/E3.mp3', sprite: '/images/piano/spr_B_E.png', width: 16, height: 108, left: 500, top: 8 },
		'y': { sound: '/sounds/F3.mp3', sprite: '/images/piano/spr_C_F.png', width: 16, height: 108, left: 520, top: 8 },
		'u': { sound: '/sounds/Gb3.mp3', sprite: '/images/piano/spr_flat.png', width: 12, height: 64, left: 533, top: 8 },
		'i': { sound: '/sounds/G3.mp3', sprite: '/images/piano/spr_D_G_A.png', width: 16, height: 108, left: 540, top: 8 },
		'o': { sound: '/sounds/Ab3.mp3', sprite: '/images/piano/spr_flat.png', width: 12, height: 64, left: 553, top: 8 },
		'p': { sound: '/sounds/A3.mp3', sprite: '/images/piano/spr_D_G_A.png', width: 16, height: 108, left: 560, top: 8 },
		'[': { sound: '/sounds/Bb3.mp3', sprite: '/images/piano/spr_flat.png', width: 12, height: 64, left: 573, top: 8 },
		']': { sound: '/sounds/B3.mp3', sprite: '/images/piano/spr_B_E.png', width: 16, height: 108, left: 580, top: 8 },
		'\\': { sound: '/sounds/C4.mp3', sprite: '/images/piano/spr_C_F.png', width: 16, height: 108, left: 600, top: 8 },

		'a': { sound: '/sounds/Db4.mp3', sprite: '/images/piano/spr_flat.png', width: 12, height: 64, left: 613, top: 8 },
		's': { sound: '/sounds/D4.mp3', sprite: '/images/piano/spr_D_G_A.png', width: 16, height: 108, left: 620, top: 8 },
		'd': { sound: '/sounds/Eb4.mp3', sprite: '/images/piano/spr_flat.png', width: 12, height: 64, left: 633, top: 8 },
		'f': { sound: '/sounds/E4.mp3', sprite: '/images/piano/spr_B_E.png', width: 16, height: 108, left: 640, top: 8 },
		'g': { sound: '/sounds/F4.mp3', sprite: '/images/piano/spr_C_F.png', width: 16, height: 108, left: 660, top: 8 },
		'h': { sound: '/sounds/Gb4.mp3', sprite: '/images/piano/spr_flat.png', width: 12, height: 64, left: 673, top: 8 },
		'j': { sound: '/sounds/G4.mp3', sprite: '/images/piano/spr_D_G_A.png', width: 16, height: 108, left: 680, top: 8 },
		'k': { sound: '/sounds/Ab4.mp3', sprite: '/images/piano/spr_flat.png', width: 12, height: 64, left: 693, top: 8 },
		'l': { sound: '/sounds/A4.mp3', sprite: '/images/piano/spr_D_G_A.png', width: 16, height: 108, left: 700, top: 8 },
		';': { sound: '/sounds/Bb4.mp3', sprite: '/images/piano/spr_flat.png', width: 12, height: 64, left: 713, top: 8 },
		'\'': { sound: '/sounds/B4.mp3', sprite: '/images/piano/spr_B_E.png', width: 16, height: 108, left: 720, top: 8 },

        'z': { sound: '/sounds/C5.mp3', sprite: '/images/piano/spr_C_F.png', width: 16, height: 108, left: 600+140, top: 8 },
        'x': { sound: '/sounds/Db5.mp3', sprite: '/images/piano/spr_flat.png', width: 12, height: 64, left: 613+140, top: 8 },
		'c': { sound: '/sounds/D5.mp3', sprite: '/images/piano/spr_D_G_A.png', width: 16, height: 108, left: 620+140, top: 8 },
		'v': { sound: '/sounds/Eb5.mp3', sprite: '/images/piano/spr_flat.png', width: 12, height: 64, left: 633+140, top: 8 },
		'b': { sound: '/sounds/E5.mp3', sprite: '/images/piano/spr_B_E.png', width: 16, height: 108, left: 640+140, top: 8 },
		'n': { sound: '/sounds/F5.mp3', sprite: '/images/piano/spr_C_F.png', width: 16, height: 108, left: 660+140, top: 8 },
		'm': { sound: '/sounds/Gb5.mp3', sprite: '/images/piano/spr_flat.png', width: 12, height: 64, left: 673+140, top: 8 },
		',': { sound: '/sounds/G5.mp3', sprite: '/images/piano/spr_D_G_A.png', width: 16, height: 108, left: 680+140, top: 8 },
		'.': { sound: '/sounds/Ab5.mp3', sprite: '/images/piano/spr_flat.png', width: 12, height: 64, left: 693+140, top: 8 },
		'/': { sound: '/sounds/A5.mp3', sprite: '/images/piano/spr_D_G_A.png', width: 16, height: 108, left: 700+140, top: 8 },
	};


	$: if (isTyping && dialogueText) {
		startTypewriter(dialogueText);
	}

	let typewriterTimeout;
	
	function startTypewriter(fullText) {
		displayedText = '';
		let currentIndex = 0;

		const typeCharacter = () => {
			if (!isTyping) {
				displayedText = fullText;
				clearTimeout(typewriterTimeout);
				return;
			}
			displayedText += fullText[currentIndex];
			const char = fullText[currentIndex];
			let delay = 50; // default
			if (char === '.' || char === '!' || char === '?') {
				delay = 400;
			} else if (char === ',') {
				delay = 200;
			}
			currentIndex++;
			if (currentIndex < fullText.length) {
				typewriterTimeout = setTimeout(typeCharacter, delay);
			} else {
				game.state.isTyping = false;
			}
		};
		typeCharacter();
	}

	// ✨ ATUALIZADO: Função para tocar som e mostrar a tecla pressionada
	const handlePianoKeyDown = (event) => {
		const key = event.key.toLowerCase();
		const mapping = keyMappings[key];

		if (mapping) {
			// Toca o som
			const noteAudio = new Audio(mapping.sound);
			noteAudio.play().catch(error => console.error("Error playing sound:", error));

			// Adiciona o visual da tecla ao array para renderização
			const keyPressId = Date.now() + Math.random(); // ID único para remoção segura
			const keyVisual = { ...mapping, id: keyPressId };
			
			// Evita adicionar a mesma tecla várias vezes se o usuário segurar
			if (pressedKeys.find(p => p.sound === keyVisual.sound)) return;

			pressedKeys = [...pressedKeys, keyVisual];

			// Remove o visual da tecla após 200ms
			setTimeout(() => {
				pressedKeys = pressedKeys.filter(p => p.id !== keyPressId);
			}, 200);
		}
	};

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
		90: '/images/tiles/gray.png',
		92: '/images/tiles/grayTL.png',
		93: '/images/tiles/grayTR.png',
		94: '/images/tiles/grayDL.png',
		95: '/images/tiles/grayDR.png',
		99: '/images/tiles/BLACK.png',
	};

	const roomTileMap = [
		[99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99],
		[99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99],
		[99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99],
		[99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99],
		[99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99],
		[99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99],
		[99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99],
		[99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99],
		[99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99],
		[99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99],
		[99, 99, 99, 92, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 93, 99, 99, 99],
		[99, 99, 99, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 99, 99, 99],
		[99, 99, 99, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 99, 99, 99],
		[99, 99, 99, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 99, 99, 99],
	];

	onMount(() => {
		if (typeof window !== 'undefined') {
			const windowWidth = 1536;
			const windowHeight = 864;
			game.setWindowDimensions(windowWidth, windowHeight);
			game.setObstacles([
				new Obstacle(windowWidth / 2 - 322, -250 + 194, 644, 784, '/images/spr_piano.png'),
				new Obstacle(windowWidth / 2 - 70, 380 + 154, 140, 60, '/images/spr_piano_bench.png'),
			]);
			game.setInteractionBoxes([]);
			game.setTileMap(roomTileMap);
			window.addEventListener('keydown', game.handleKeyDown);
			window.addEventListener('keyup', game.handleKeyUp);
			window.addEventListener('keydown', handlePianoKeyDown);
			game.startAnimation(boundaryHit => {
				game.cancelAnimation();
				if (boundaryHit === 'bottom') {
					game.initializeCharacterPosition((windowWidth / 2) - (characterSize / 2), 150);
					goto('/right_room');
				};
			});
		}
	});

	onDestroy(() => {
		if (typeof window !== 'undefined') {
			window.removeEventListener('keydown', game.handleKeyDown);
			window.removeEventListener('keyup', game.handleKeyUp);
			window.removeEventListener('keydown', handlePianoKeyDown);
			game.cancelAnimation();
			unsubscribe();
		}
	});
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

<div class="character" style="--krisX: 750px; --krisY: 470px; z-index: 470;">
	<div class="character_kris" style="background-image: url('/images/kris/spr_krisu_dark(0).png');"></div>
	<div class="character_heart"></div>
</div>

<div class="character_susie"
	style="background-image: url('/images/susie/spr_susieu_eye_dark(0).png'); --susieX: 540px; --susieY: 490px; z-index: 900;">
</div>
<div class="character_ralsei"
	style="background-image: url('/images/ralsei/spr_ralseiu(0).png'); --ralseiX: 900px; --ralseiY: 500px; z-index: 900;">
</div>

<div class="container_key">
	<div class="keyboard">
		{#each pressedKeys as key (key.id)}
			<div
				class="key-press"
				style="
                    left: {key.left}px;
                    top: {key.top}px;
                    width: {key.width}px;
                    height: {key.height}px;
                    background-image: url('{key.sprite}');
                    background-repeat: no-repeat;
		            background-size: 100% 100%;
                "
			></div>
		{/each}
	</div>
</div>


{#each obstacles as obstacle (obstacle.x + '-' + obstacle.y)}
	<div
		class="obstacle"
		style="
			top: {obstacle.y}px; left: {obstacle.x}px;
			z-index: {obstacle.y < 0 ? 1 : Math.floor(obstacle.y)};
			width: {obstacle.width}px; height: {obstacle.height}px;
			background-image: url('{obstacle.sprite}');
			background-color: {obstacle.sprite ? 'transparent' : 'firebrick'};
			opacity: {obstacle.sprite ? '1' : '0.2'}
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

	.container_key {
		position: relative;
		height: 350px;
		width: 100%;
		display: flex;
		justify-content: center;
		background-color: rgba(0, 0, 0, 0.9);
		z-index: 100;
		align-items: flex-end;
	}

	.keyboard {
		position: relative;
		width: 1038px;
		height: 116px;
		image-rendering: pixelated;
		background-image: url('/images/piano/spr_piano.png');
		z-index: 100;
		background-repeat: no-repeat;
		background-size: 100% 100%;
	}

	/* ✨ NOVO: Estilo para o visual da tecla pressionada */
	.key-press {
		position: absolute;
        height: 108px;
        width: 16px;
		/* Garante que a imagem não fique borrada ao ser redimensionada */
		image-rendering: pixelated;
		/* Garante que a tecla pressionada apareça sobre o teclado base */
		z-index: 101;
		/* Impede que o usuário selecione a imagem da tecla */
		pointer-events: none;
        background-repeat: no-repeat;
	}
</style>