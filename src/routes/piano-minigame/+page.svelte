<script>
    import { onMount, onDestroy } from 'svelte';
    import { goto } from '$app/navigation';
    import { game, Obstacle, InteractionBox } from '$lib/GameCore.js';
    import { base } from '$app/paths';

    // Svelte's reactivity for imported store
    let {
        characterX, characterY, characterSusie_X, characterSusie_Y, characterRalsei_X, characterRalsei_Y,
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
    } = game.state;

    let displayedText = '';

    // 'face' mapping
    const portraits = {
        //frog1: '/images/faces/frog.png', //example
    };

    // Store objects with a unique ID and the key that pressed them
    let pressedKeys = [];
    // Store active audio objects to stop them if needed on keyup
    const activeAudios = {};

    const keyMappings = {
        '1': { sound: '/sounds/C2.mp3', sprite: '/images/piano/spr_C_F.png', width: 16, height: 108, left: 320, top: 8, noteName: 'C'},
        '2': { sound: '/sounds/Db2.mp3', sprite: '/images/piano/spr_flat.png', width: 12, height: 64, left: 333, top: 8, noteName: 'D♭' },
        '3': { sound: '/sounds/D2.mp3', sprite: '/images/piano/spr_D_G_A.png', width: 16, height: 108, left: 340, top: 8, noteName: 'D' },
        '4': { sound: '/sounds/Eb2.mp3', sprite: '/images/piano/spr_flat.png', width: 12, height: 64, left: 453, top: 8, noteName: 'E♭'},
        '5': { sound: '/sounds/E2.mp3', sprite: '/images/piano/spr_B_E.png', width: 16, height: 108, left: 360, top: 8, noteName: 'E' },
        '6': { sound: '/sounds/F2.mp3', sprite: '/images/piano/spr_C_F.png', width: 16, height: 108, left: 380, top: 8, noteName: 'F' },
        '7': { sound: '/sounds/Gb2.mp3', sprite: '/images/piano/spr_flat.png', width: 12, height: 64, left: 393, top: 8, noteName: 'G♭' },
        '8': { sound: '/sounds/G2.mp3', sprite: '/images/piano/spr_D_G_A.png', width: 16, height: 108, left: 400, top: 8, noteName: 'G' },
        '9': { sound: '/sounds/Ab2.mp3', sprite: '/images/piano/spr_flat.png', width: 12, height: 64, left: 413, top: 8, noteName: 'A♭' },
        '0': { sound: '/sounds/A2.mp3', sprite: '/images/piano/spr_D_G_A.png', width: 16, height: 108, left: 420, top: 8, noteName: 'A' },
        '-': { sound: '/sounds/Bb2.mp3', sprite: '/images/piano/spr_flat.png', width: 12, height: 64, left: 433, top: 8, noteName: 'B♭' },
        '=': { sound: '/sounds/B2.mp3', sprite: '/images/piano/spr_B_E.png', width: 16, height: 108, left: 440, top: 8, noteName: 'B' },

        'q': { sound: '/sounds/C3.mp3', sprite: '/images/piano/spr_C_F.png', width: 16, height: 108, left: 460, top: 8, noteName: 'C' },
        'w': { sound: '/sounds/Db3.mp3', sprite: '/images/piano/spr_flat.png', width: 12, height: 64, left: 473, top: 8, noteName: 'D♭' },
        'e': { sound: '/sounds/D3.mp3', sprite: '/images/piano/spr_D_G_A.png', width: 16, height: 108, left: 480, top: 8, noteName: 'D' },
        'r': { sound: '/sounds/Eb3.mp3', sprite: '/images/piano/spr_flat.png', width: 12, height: 64, left: 493, top: 8, noteName: 'E♭' },
        't': { sound: '/sounds/E3.mp3', sprite: '/images/piano/spr_B_E.png', width: 16, height: 108, left: 500, top: 8, noteName: 'E' },
        'y': { sound: '/sounds/F3.mp3', sprite: '/images/piano/spr_C_F.png', width: 16, height: 108, left: 520, top: 8, noteName: 'F' },
        'u': { sound: '/sounds/Gb3.mp3', sprite: '/images/piano/spr_flat.png', width: 12, height: 64, left: 533, top: 8, noteName: 'G♭' },
        'i': { sound: '/sounds/G3.mp3', sprite: '/images/piano/spr_D_G_A.png', width: 16, height: 108, left: 540, top: 8, noteName: 'G' },
        'o': { sound: '/sounds/Ab3.mp3', sprite: '/images/piano/spr_flat.png', width: 12, height: 64, left: 553, top: 8, noteName: 'A♭' },
        'p': { sound: '/sounds/A3.mp3', sprite: '/images/piano/spr_D_G_A.png', width: 16, height: 108, left: 560, top: 8, noteName: 'A' },
        '[': { sound: '/sounds/Bb3.mp3', sprite: '/images/piano/spr_flat.png', width: 12, height: 64, left: 573, top: 8, noteName: 'B♭' },
        ']': { sound: '/sounds/B3.mp3', sprite: '/images/piano/spr_B_E.png', width: 16, height: 108, left: 580, top: 8, noteName: 'B' },
        '\\': { sound: '/sounds/C4.mp3', sprite: '/images/piano/spr_C_F.png', width: 16, height: 108, left: 600, top: 8, noteName: 'C' },

        'a': { sound: '/sounds/Db4.mp3', sprite: '/images/piano/spr_flat.png', width: 12, height: 64, left: 613, top: 8, noteName: 'D♭' },
        's': { sound: '/sounds/D4.mp3', sprite: '/images/piano/spr_D_G_A.png', width: 16, height: 108, left: 620, top: 8, noteName: 'D' },
        'd': { sound: '/sounds/Eb4.mp3', sprite: '/images/piano/spr_flat.png', width: 12, height: 64, left: 633, top: 8, noteName: 'E♭' },
        'f': { sound: '/sounds/E4.mp3', sprite: '/images/piano/spr_B_E.png', width: 16, height: 108, left: 640, top: 8, noteName: 'E' },
        'g': { sound: '/sounds/F4.mp3', sprite: '/images/piano/spr_C_F.png', width: 16, height: 108, left: 660, top: 8, noteName: 'F' },
        'h': { sound: '/sounds/Gb4.mp3', sprite: '/images/piano/spr_flat.png', width: 12, height: 64, left: 673, top: 8, noteName: 'G♭' },
        'j': { sound: '/sounds/G4.mp3', sprite: '/images/piano/spr_D_G_A.png', width: 16, height: 108, left: 680, top: 8, noteName: 'G' },
        'k': { sound: '/sounds/Ab4.mp3', sprite: '/images/piano/spr_flat.png', width: 12, height: 64, left: 693, top: 8, noteName: 'A♭' },
        'l': { sound: '/sounds/A4.mp3', sprite: '/images/piano/spr_D_G_A.png', width: 16, height: 108, left: 700, top: 8, noteName: 'A' },
        ';': { sound: '/sounds/Bb4.mp3', sprite: '/images/piano/spr_flat.png', width: 12, height: 64, left: 713, top: 8, noteName: 'B♭' },
        '\'': { sound: '/sounds/B4.mp3', sprite: '/images/piano/spr_B_E.png', width: 16, height: 108, left: 720, top: 8, noteName: 'B' },

        'z': { sound: '/sounds/C5.mp3', sprite: '/images/piano/spr_C_F.png', width: 16, height: 108, left: 600+140, top: 8, noteName: 'C' },
        'x': { sound: '/sounds/Db5.mp3', sprite: '/images/piano/spr_flat.png', width: 12, height: 64, left: 613+140, top: 8, noteName: 'D♭' },
        'c': { sound: '/sounds/D5.mp3', sprite: '/images/piano/spr_D_G_A.png', width: 16, height: 108, left: 620+140, top: 8, noteName: 'D' },
        'v': { sound: '/sounds/Eb5.mp3', sprite: '/images/piano/spr_flat.png', width: 12, height: 64, left: 633+140, top: 8, noteName: 'E♭' },
        'b': { sound: '/sounds/E5.mp3', sprite: '/images/piano/spr_B_E.png', width: 16, height: 108, left: 640+140, top: 8, noteName: 'E' },
        'n': { sound: '/sounds/F5.mp3', sprite: '/images/piano/spr_C_F.png', width: 16, height: 108, left: 660+140, top: 8, noteName: 'F' },
        'm': { sound: '/sounds/Gb5.mp3', sprite: '/images/piano/spr_flat.png', width: 12, height: 64, left: 673+140, top: 8, noteName: 'G♭' },
        ',': { sound: '/sounds/G5.mp3', sprite: '/images/piano/spr_D_G_A.png', width: 16, height: 108, left: 680+140, top: 8, noteName: 'G' },
        '.': { sound: '/sounds/Ab5.mp3', sprite: '/images/piano/spr_flat.png', width: 12, height: 64, left: 693+140, top: 8, noteName: 'A♭' },
        '/': { sound: '/sounds/A5.mp3', sprite: '/images/piano/spr_D_G_A.png', width: 16, height: 108, left: 700+140, top: 8, noteName: 'A' },
    };

    // --- MUSIC PLAYER LOGIC ---
	const songbook = [
		{
			name: "Clocks (Intro)",
			artist: "Coldplay",
			track: [
                // first tanananan
				{ key: 'd', time: 0, duration: 150 },
				{ key: '[', time: 200, duration: 150 },
				{ key: 'i', time: 400, duration: 150 },
				{ key: 'd', time: 600, duration: 150 },
				{ key: '[', time: 800, duration: 150 },
				{ key: 'i', time: 1000, duration: 150 },
				{ key: 'd', time: 1200, duration: 150 },
				{ key: '[', time: 1400, duration: 150 },

                // second tanananan
                { key: 'a', time: 0+1600, duration: 150 },
				{ key: '[', time: 200+1600, duration: 150 },
				{ key: 'y', time: 400+1600, duration: 150 },
				{ key: 'a', time: 600+1600, duration: 150 },
				{ key: '[', time: 800+1600, duration: 150 },
				{ key: 'y', time: 1000+1600, duration: 150 },
				{ key: 'a', time: 1200+1600, duration: 150 },
				{ key: '[', time: 1400+1600, duration: 150 },
                // second second tanananan
                { key: 'a', time: 0+3200, duration: 150 },
				{ key: '[', time: 200+3200, duration: 150 },
				{ key: 'y', time: 400+3200, duration: 150 },
				{ key: 'a', time: 600+3200, duration: 150 },
				{ key: '[', time: 800+3200, duration: 150 },
				{ key: 'y', time: 1000+3200, duration: 150 },
                { key: 'a', time: 1200+3200, duration: 150 },
				{ key: '[', time: 1400+3200, duration: 150 },

                // third tanananan
                { key: '\\', time: 0+4800, duration: 150 },
				{ key: 'o', time: 200+4800, duration: 150 },
				{ key: 'y', time: 400+4800, duration: 150 },
				{ key: '\\', time: 600+4800, duration: 150 },
				{ key: 'o', time: 800+4800, duration: 150 },
				{ key: 'y', time: 1000+4800, duration: 150 },
                { key: '\\', time: 1200+4800, duration: 150 },
				{ key: 'o', time: 1400+4800, duration: 150 },

                // first tanananan
				{ key: 'd', time: 0+6400, duration: 150 },
				{ key: '[', time: 200+6400, duration: 150 },
				{ key: 'i', time: 400+6400, duration: 150 },
				{ key: 'd', time: 600+6400, duration: 150 },
				{ key: '[', time: 800+6400, duration: 150 },
				{ key: 'i', time: 1000+6400, duration: 150 },
				{ key: 'd', time: 1200+6400, duration: 150 },
				{ key: '[', time: 1400+6400, duration: 150 },

                // second tanananan
                { key: 'a', time: 0+1600+6400, duration: 150 },
				{ key: '[', time: 200+1600+6400, duration: 150 },
				{ key: 'y', time: 400+1600+6400, duration: 150 },
				{ key: 'a', time: 600+1600+6400, duration: 150 },
				{ key: '[', time: 800+1600+6400, duration: 150 },
				{ key: 'y', time: 1000+1600+6400, duration: 150 },
				{ key: 'a', time: 1200+1600+6400, duration: 150 },
				{ key: '[', time: 1400+1600+6400, duration: 150 },
                // second second tanananan
                { key: 'a', time: 0+3200+6400, duration: 150 },
				{ key: '[', time: 200+3200+6400, duration: 150 },
				{ key: 'y', time: 400+3200+6400, duration: 150 },
				{ key: 'a', time: 600+3200+6400, duration: 150 },
				{ key: '[', time: 800+3200+6400, duration: 150 },
				{ key: 'y', time: 1000+3200+6400, duration: 150 },
                { key: 'a', time: 1200+3200+6400, duration: 150 },
				{ key: '[', time: 1400+3200+6400, duration: 150 },

                // third tanananan
                { key: '\\', time: 0+4800+6400, duration: 150 },
				{ key: 'o', time: 200+4800+6400, duration: 150 },
				{ key: 'y', time: 400+4800+6400, duration: 150 },
				{ key: '\\', time: 600+4800+6400, duration: 150 },
				{ key: 'o', time: 800+4800+6400, duration: 150 },
				{ key: 'y', time: 1000+4800+6400, duration: 150 },
                { key: '\\', time: 1200+4800+6400, duration: 150 },
				{ key: 'o', time: 1400+4800+6400, duration: 150 },
			]
		},
		{
			name: "Last Time",
			artist: "Toby Fox (DT)",
			track: [
				{ key: 'd', time: 0, duration: 100 },
				{ key: 'g', time: 50, duration: 200 },
				{ key: 'g', time: 450, duration: 200 },

                { key: 'd', time: 1000, duration: 100 },
				{ key: 'g', time: 1050, duration: 200 },
				{ key: 'g', time: 1500, duration: 200 },

                { key: 'd', time: 1950, duration: 100 },
				{ key: 'g', time: 2000, duration: 200 },
				{ key: 'g', time: 2450, duration: 200 },

                { key: 'd', time: 3000, duration: 100 },
				{ key: 'g', time: 3050, duration: 200 },
				{ key: 'g', time: 3500, duration: 200 },
			]
		}
	];

	let currentSongIndex = 0;
	let isPlaying = false;
	let playbackStartTime = 0;
	let notesToRender = []; // To render falling notes
	const FALL_SPEED = 0.25; // pixels per miliseconds
    const PRE_ROLL_MS = 2000; // cooldown

	function startPlayback() {
		if (isPlaying) return;
		isPlaying = true;
		playbackStartTime = performance.now() + PRE_ROLL_MS;
		// Reset the 'played' state of all notes when starting
		songbook[currentSongIndex].track.forEach(note => {
			note.played = false;
			note.released = false;
		});
	}

	function stopPlayback() {
		isPlaying = false;
		// Clear all keys
		pressedKeys = [];
	}

    // Main function (executes each frame)
	function updateMusicPlayer() {
		if (!isPlaying) {
			notesToRender = [];
			return;
		}

		const elapsedTime = performance.now() - playbackStartTime;
		const currentTrack = songbook[currentSongIndex].track;
		
		// Auto-Play logic
		currentTrack.forEach(note => {
			// Press the key at the right time
			if (elapsedTime >= note.time && !note.played) {
				playNote(note.key);
				note.played = true;
			}
			// Releases it
			if (elapsedTime >= note.time + note.duration && !note.released) {
				releaseNote(note.key);
				note.released = true;
			}
		});

		// Falling keys
		const visibleNotes = currentTrack.filter(note => {
            const timeToHit = note.time - elapsedTime;
            const noteTopPosition = -(timeToHit * FALL_SPEED);
            return noteTopPosition > -500 && noteTopPosition < 10;
        });

        // Only renders certain notes
		notesToRender = visibleNotes.map(note => {
            const mapping = keyMappings[note.key];
            if (!mapping) return null;

            const timeToHit = note.time - elapsedTime;
            const noteHeight = note.duration * FALL_SPEED; // depends on the fall speed

            return {
                id: note.key + note.time,
                left: mapping.left,
                width: mapping.width,
                top: -(timeToHit * FALL_SPEED) - noteHeight,
                height: noteHeight,
                noteName: mapping.noteName || '?'
            };
        }).filter(n => n !== null);
		
		// Stop the playback after the last note
		const lastNote = currentTrack[currentTrack.length - 1];
		if (elapsedTime > lastNote.time + lastNote.duration + 1000) {
			stopPlayback();
		}
	}

    // Just get the key and play the note
	function playNote(key) {
		const mapping = keyMappings[key];
		if (!mapping || pressedKeys.some(p => p.originalKey === key)) return;
		
		new Audio(mapping.sound).play().catch(e => {});
		
		const keyVisual = { ...mapping, id: Math.random(), originalKey: key };
		pressedKeys = [...pressedKeys, keyVisual];
	}

    // Stop it
	function releaseNote(key) {
		pressedKeys = pressedKeys.filter(p => p.originalKey !== key);
	}

	// --- UI Control (SONG SELECTION) ---
	function handleMusicControls(event) {
		if (event.key === 'ArrowRight') {
			stopPlayback();
			currentSongIndex = (currentSongIndex + 1) % songbook.length;
		} else if (event.key === 'ArrowLeft') {
			stopPlayback();
			currentSongIndex = (currentSongIndex - 1 + songbook.length) % songbook.length;
		} else if (event.key === 'Enter') {
			isPlaying ? stopPlayback() : startPlayback();
		}
	}


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

	// Will play the sound and place the div
    const handlePianoKeyDown = (event) => {
        if (event.repeat) return; // Ignore repeated key presses

        const key = event.key.toLowerCase();
        const mapping = keyMappings[key];

        if (mapping) {
            // Prevent adding the visual if it's already "pressed"
            if (pressedKeys.some(p => p.originalKey === key)) {
                return;
            }

            // Play the sound
            const noteAudio = new Audio(mapping.sound);
            noteAudio.play().catch(error => console.error("Error playing sound:", error));
            activeAudios[key] = noteAudio; 

            // Add the key visual to the array for rendering
            const keyPressId = Date.now() + Math.random(); // Unique ID for Svelte's #each block
            const keyVisual = { ...mapping, id: keyPressId, originalKey: key };

            pressedKeys = [...pressedKeys, keyVisual];
        }
    };

	// Handle when you stop pressing the key, so it takes the div out.
    const handlePianoKeyUp = (event) => {
        const key = event.key.toLowerCase();
        const mapping = keyMappings[key];

        if (mapping) {
            // Remove the key visual from the array
            pressedKeys = pressedKeys.filter(p => p.originalKey !== key);
        }
    };
    
    let sitTimer = 0;
    let frameCount = 0; // Start at 0 (kris_sit(0).png)
    let krisZIndex = 400; // Initial Z-index
    let sitSpeed = 50;

    function updateSittingAnimation() {
        if (frameCount < 9) { // Assuming frames are 0 to 8
            sitTimer++;
            if (sitTimer >= sitSpeed) {
                frameCount = Math.min(frameCount + 1, 8); // Ensure frameCount doesn't go above 8
                sitTimer = 0; // Reset timer
            }
        }

        // Change Z-index when frameCount reaches 2, and keep it
        if (frameCount >= 2 && krisZIndex !== 1000) {
            krisZIndex = 1000;
        }
    }

    function handleGoTo(event) {
        if (event.key === 'ArrowDown') {
            goto('/deltarune-web/piano');
        }
    }

    // Subscribe to game state changes
    const unsubscribe = game.subscribe(newState => {
        ({
            characterX, characterY, characterSusie_X, characterSusie_Y, characterRalsei_X, characterRalsei_Y,
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
        90: `${base}/images/tiles/gray.png`,
        92: `${base}/images/tiles/grayTL.png`,
        93: `${base}/images/tiles/grayTR.png`,
        94: `${base}/images/tiles/grayDL.png`,
        95: `${base}/images/tiles/grayDR.png`,
        99: `${base}/images/tiles/BLACK.png`,
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
                new Obstacle(windowWidth / 2 - 322, 94, 644, 784, `${base}/images/spr_piano.png`),
                new Obstacle(windowWidth / 2 - 70, 640, 140, 60, `${base}/images/spr_piano_bench.png`),
            ]);

            game.setInteractionBoxes([]);

            game.setTileMap(roomTileMap);

            window.addEventListener('keydown', game.handleKeyDown);
            window.addEventListener('keyup', game.handleKeyUp);
            window.addEventListener('keydown', handleGoTo);

            window.addEventListener('keydown', handlePianoKeyDown);
            window.addEventListener('keyup', handlePianoKeyUp);

            // sitting animation being executed in the game loop
            game.registerRoomUpdate(updateSittingAnimation);
            game.registerRoomUpdate(updateMusicPlayer);
			window.addEventListener('keydown', handleMusicControls);

            game.startAnimation(boundaryHit => {
                game.cancelAnimation();
                if (boundaryHit === 'bottom') {
                    game.initializeCharacterPosition((windowWidth / 2) - (characterSize / 2), 150);
                    goto('/deltarune-web/right-room');
                };
            });

        }
    });

    onDestroy(() => {
        if (typeof window !== 'undefined') {
            window.removeEventListener('keydown', game.handleKeyDown);
            window.removeEventListener('keyup', game.handleKeyUp);
            window.removeEventListener('keydown', handleGoTo);
            
            window.removeEventListener('keydown', handlePianoKeyDown);
            window.removeEventListener('keyup', handlePianoKeyUp);
            window.removeEventListener('keydown', handleMusicControls)
            game.clearRoomUpdates();
            game.cancelAnimation();
            unsubscribe();
        }
    });

    // Reactive declaration for the sprite URL
    $: krisSpriteUrl = `${base}/images/kris/kris_sit(${frameCount}).png`;
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

<div class="character" style="--krisX: 760px; --krisY: 570px; z-index: {krisZIndex};">
	<div class="character_kris" style="background-image: url('{krisSpriteUrl}');"></div>
	<div class="character_heart"></div>
</div>

<div class="character_susie"
	style="background-image: url('/images/susie/spr_susieu_eye_dark(0).png'); --susieX: 540px; --susieY: 640px; z-index: 900;">
</div>
<div class="character_ralsei"
	style="background-image: url('/images/ralsei/spr_ralseiu(0).png'); --ralseiX: 900px; --ralseiY: 650px; z-index: 900;">
</div>


<div class="container_key">
    <div class="song-hud">
        <p>◀ { songbook[currentSongIndex].name } ▶</p>
        <span>Press Enter to Play/Stop the Song</span>
    </div>

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

        {#each notesToRender as note (note.id)}
            <div 
                class="falling-note"
                style="left: {note.left}px; top: {note.top}px; width: {note.width}px; height: {note.height}px;"
            >
                <span class="note-name">{note.noteName}</span>
            </div>
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
		height: 500px;
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

	.key-press {
		position: absolute;
        height: 108px;
        width: 16px;
		image-rendering: pixelated;
		z-index: 101;
		pointer-events: none;
        background-repeat: no-repeat;
	}

    .character_kris {
        position: absolute;
        width: 104px;
        height: 152px;
    }

    .song-hud {
        position: absolute;
        top: 20px;
        color: white;
        font-family: monospace;
        text-align: center;
        text-shadow: 2px 2px 4px #000;
        user-select: none;
    }
    .song-hud p {
        font-size: 24px;
        margin: 0;
    }
    .song-hud span {
        font-size: 16px;
        opacity: 0.8;
    }

    .falling-note {
        position: absolute;
        background-color: rgba(29, 185, 84, 0.7);
        border: 1px solid rgba(255, 255, 255, 0.8);
        border-radius: 4px;
        z-index: 10;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-family: monospace;
        text-shadow: 1px 1px 2px black;
    }

    .note-name {
        font-size: 14px;
    }
</style>