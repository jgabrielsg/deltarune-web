// --- Obstacle Class ---
export class Obstacle {
    constructor(x, y, width, height, sprite = null, id = null) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.sprite = sprite;
        this.id = id;
        this.bounds = { x, y, width, height };
    }
}

// --- InteractionBox Class  ---
export class InteractionBox {
    constructor(x, y, width, height, text, face = null, targetId = null) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.bounds = { x, y, width, height };
        this.text = text;       // text that will be shown
        this.face = face;       // the face sprite
        this.targetId = targetId;
    }
}

// --- Game State and Properties ---
const gameState = {
    // just for the first room (or f5)
    characterX: 300,
    characterY: 400,
    characterSusie_X: 300,
    characterSusie_Y: 400,
    characterRalsei_X: 300,
    characterRalsei_Y: 400,
    krisZIndex: 0,
    susieZIndex: 0,
    ralseiZIndex: 0,

    characterSize: 30,
    speed: 3,
    runSpeed: 6,

    pressedKeys: {
        ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false, Shift: false, Z: false,
    },

    obstacles: [],
    interactionBoxes: [],
    windowWidth: 0,
    windowHeight: 0,
    animationFrameId: null,

    direction: 'd',
    susieDirection: 'd',
    ralseiDirection: 'd',

    animationFrame: 0,
    isMoving: false,
    animationTimer: 0,
    animationSpeed: 16,

    // So we get susie and ralsei positions
    playerPositionHistory: [],
    maxHistorySize: 80,

    // For the text gifs
    playerInInteractionZone: false,
    currentInteractionBox: null,
    gamePaused: false,

    // 64x64 tiles, but the pixel art will be 16x16. TileMap will be 24x14
    tileSize: 64,
    tileMap: [],

    // animations with interactions. works for npcs
    activeTargetId: null,
    interactionAnimationFrame: 0,
    interactionAnimationTimer: 0,
    interactionAnimationSpeed: 30,

    showDialogueBox: false,         
    dialogueText: '',               
    dialogueFace: null,             
    isTyping: false,
    roomUpdateCallbacks: [], // Array for generalized animation function
};

// Event emitter to notify Svelte components of state changes
let subscribers = [];

function notifySubscribers() {
    subscribers.forEach(sub => sub(gameState));
}

export const game = {
    // Expose game state properties
    get state() {
        return gameState;
    },

    // Allows components to subscribe to state changes
    subscribe(callback) {
        subscribers.push(callback);
        callback(gameState); // Send initial state
        return () => {
            subscribers = subscribers.filter(sub => sub !== callback);
        };
    },
    
    // Expose functions to modify state
    setWindowDimensions(width, height) {
        gameState.windowWidth = width;
        gameState.windowHeight = height;
        notifySubscribers();
    },

    setObstacles(newObstacles) {
        gameState.obstacles = newObstacles;
        notifySubscribers();
    },

    setInteractionBoxes(newInteractionBoxes) {
        gameState.interactionBoxes = newInteractionBoxes;
        notifySubscribers();
    },

    setTileMap(newMap) {
        gameState.tileMap = newMap;
        notifySubscribers();
    },

    initializeCharacterPosition(x, y) {
        gameState.characterX = x;
        gameState.characterY = y;
        gameState.characterSusie_X = x;
        gameState.characterSusie_Y = y;
        gameState.characterRalsei_X = x;
        gameState.characterRalsei_Y = y;
        for (let i = 0; i < gameState.maxHistorySize; i++) {
            gameState.playerPositionHistory.push({ x: x, y: y, direc: gameState.direction });
        }
        notifySubscribers();
    },
    
    handleKeyDown(event) {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Shift'].includes(event.key)) {
            event.preventDefault();
        }

        // Allow 'Z' even when the game is paused
        if (event.key === 'z' || event.key === 'Z') {
            gameState.pressedKeys.Z = true;
        } else if (!gameState.gamePaused) {
            if (gameState.pressedKeys.hasOwnProperty(event.key)) {
                gameState.pressedKeys[event.key] = true;
            }
        }
        
        if (event.key === 'z' || event.key === 'Z') {
            // If it's already typing, stop it and show all the text if you press Z again
            if (gameState.isTyping) {
                gameState.isTyping = false; 
            }
            // If the typing's finished, Z will clear the dialoguebox
            else if (gameState.showDialogueBox) {
                gameState.showDialogueBox = false;
                gameState.gamePaused = false;
                gameState.activeTargetId = null;
            }
            // If the dialoguebox is not onscreen and the player press Z, then it starts.
            else if (gameState.playerInInteractionZone && gameState.currentInteractionBox) {
                gameState.showDialogueBox = true;
                gameState.gamePaused = true;
                gameState.dialogueText = gameState.currentInteractionBox.text;
                gameState.dialogueFace = gameState.currentInteractionBox.face;
                gameState.activeTargetId = gameState.currentInteractionBox.targetId;
                gameState.isTyping = true; // Typing starts
            }
        }
        notifySubscribers();
    },
    

    // Stoping the key
    handleKeyUp(event) {
        if (gameState.pressedKeys.hasOwnProperty(event.key)) {
            gameState.pressedKeys[event.key] = false;
        }
        notifySubscribers();
    },

    isColliding(rect1, rect2) {
        return (
            rect1.x < rect2.x + rect2.width &&
            rect1.x + rect1.width > rect2.x &&
            rect1.y < rect2.y + rect2.height &&
            rect1.y + rect1.height > rect2.y
        );
    },

    updateCharacterPosition(transitionCallback) {
        if (gameState.gamePaused) {
            gameState.isMoving = false;
            gameState.animationFrame = 0;
            notifySubscribers();
            return;
        }

        // The speed of the character depends if the player's pressing shift
        const currentSpeed = gameState.pressedKeys.Shift ? gameState.runSpeed : gameState.speed;

        let newX = gameState.characterX;
        let newY = gameState.characterY;

        // Move the player depending on the speed
        if (gameState.pressedKeys.ArrowUp) newY -= currentSpeed;
        if (gameState.pressedKeys.ArrowDown) newY += currentSpeed;
        if (gameState.pressedKeys.ArrowLeft) newX -= currentSpeed;
        if (gameState.pressedKeys.ArrowRight) newX += currentSpeed;
    
        // The player can't get inside an object or get out of bounds
        const futureXBounds = { x: newX, y: gameState.characterY, width: gameState.characterSize, height: gameState.characterSize };
        for (const obstacle of gameState.obstacles) {
            if (game.isColliding(futureXBounds, obstacle.bounds)) {
                newX = gameState.characterX;
                break;
            }
        }
        const futureYBounds = { x: newX, y: newY, width: gameState.characterSize, height: gameState.characterSize };
        for (const obstacle of gameState.obstacles) {
            if (game.isColliding(futureYBounds, obstacle.bounds)) {
                newY = gameState.characterY;
                break;
            }
        }

        gameState.characterX = Math.max(0, Math.min(newX, gameState.windowWidth - gameState.characterSize));
        gameState.characterY = Math.max(0, Math.min(newY, gameState.windowHeight - gameState.characterSize));

        // Get the interaction boxes. Allow the player to use Z to interact.
        let foundInteraction = false;
        const characterBounds = { x: gameState.characterX, y: gameState.characterY, width: gameState.characterSize, height: gameState.characterSize };
        for (const box of gameState.interactionBoxes) {
            if (game.isColliding(characterBounds, box.bounds)) {
                foundInteraction = true;
                gameState.currentInteractionBox = box;
                break;
            }
        }

        if (foundInteraction && !gameState.playerInInteractionZone) {
            gameState.playerInInteractionZone = true;
        } else if (!foundInteraction && gameState.playerInInteractionZone) {
            gameState.playerInInteractionZone = false;
            gameState.currentInteractionBox = null;
        }

        // --- Room Transition Logic (Decoupled) ---
        if (gameState.characterY + gameState.characterSize >= gameState.windowHeight) {
            transitionCallback('bottom'); // Indicate that the bottom boundary was hit
            return;
        }

        if (gameState.characterY <= 0) {
            transitionCallback('top'); // Indicate that the top boundary was hit
            return;
        }

        if (gameState.characterX <= 0) {
            transitionCallback('left');
            return;
        }

        if (gameState.characterX + gameState.characterSize >= gameState.windowWidth) {
            transitionCallback('right'); 
            return;
        }

        // The z-index of kris
        gameState.krisZIndex = gameState.characterY + gameState.characterSize;

        // The array that saves Kris' last positions
        const lastRecordedPosition = gameState.playerPositionHistory[gameState.playerPositionHistory.length - 1];
        if (!lastRecordedPosition || lastRecordedPosition.x !== gameState.characterX || lastRecordedPosition.y !== gameState.characterY || lastRecordedPosition.direc !== gameState.direction) {
            gameState.playerPositionHistory.push({ x: gameState.characterX, y: gameState.characterY, direc: gameState.direction });
        }

        if (gameState.playerPositionHistory.length > gameState.maxHistorySize) {
            gameState.playerPositionHistory.shift();
        }

        // Susie's position is the halfway point of the array
        const susieDelayIndex = Math.max(0, gameState.playerPositionHistory.length - Math.floor(gameState.maxHistorySize / 2) - 1);
        if (gameState.playerPositionHistory.length > 0) {
            const susiePosition = gameState.playerPositionHistory[susieDelayIndex];
            gameState.characterSusie_X = susiePosition.x;
            gameState.characterSusie_Y = susiePosition.y;
            gameState.susieDirection = susiePosition.direc;
            gameState.susieZIndex = gameState.characterSusie_Y + gameState.characterSize;
        }

        // Ralsei is the last value in the array (he stays the furthest)
        const ralseiDelayIndex = Math.max(0, gameState.playerPositionHistory.length - gameState.maxHistorySize - 1);
        if (gameState.playerPositionHistory.length > 0) {
            const ralseiPosition = gameState.playerPositionHistory[ralseiDelayIndex];
            gameState.characterRalsei_X = ralseiPosition.x;
            gameState.characterRalsei_Y = ralseiPosition.y;
            gameState.ralseiDirection = ralseiPosition.direc;
            gameState.ralseiZIndex = gameState.characterRalsei_Y + gameState.characterSize;
        };
        
        notifySubscribers();
    },

    updateAnimation() {
        ///////////////////
        // NPC animation
        ///////////////////
        // If the game is paused and there is a npc activated, animate it (look at froggit)
        if (gameState.gamePaused && gameState.activeTargetId) {
            gameState.interactionAnimationTimer++;
            if (gameState.interactionAnimationTimer >= gameState.interactionAnimationSpeed) {
                gameState.interactionAnimationTimer = 0;
                gameState.interactionAnimationFrame = (gameState.interactionAnimationFrame + 1) % 4; // 4 frames for now
            }
            notifySubscribers();
            return; // stop player animation
        }

        if (gameState.gamePaused) {
            gameState.animationFrame = 0;
            gameState.isMoving = false;
            notifySubscribers();
            return; // stop player animation
        }

        ///////////////////
        // Player animation
        ///////////////////
        gameState.isMoving = gameState.pressedKeys.ArrowUp || gameState.pressedKeys.ArrowDown || gameState.pressedKeys.ArrowLeft || gameState.pressedKeys.ArrowRight;

        // No movement => first frame, which the player is standing
        if (!gameState.isMoving) {
            gameState.animationFrame = 0;
            notifySubscribers();
            return;
        }

        // up, down, left, right
        if (gameState.pressedKeys.ArrowUp) gameState.direction = 'u';
        else if (gameState.pressedKeys.ArrowDown) gameState.direction = 'd';
        else if (gameState.pressedKeys.ArrowLeft) gameState.direction = 'l';
        else if (gameState.pressedKeys.ArrowRight) gameState.direction = 'r';

        // each X ms, change the frame
        gameState.animationTimer++;
        if (gameState.animationTimer >= gameState.animationSpeed) {
            gameState.animationTimer = 0;
            gameState.animationFrame = (gameState.animationFrame + 1) % 4;
        }
        notifySubscribers();
    },

    // It's used to go to another room after a bondary hit
    animate(gotoRoomCallback) {
        gameState.roomUpdateCallbacks.forEach(callback => callback());
        
        game.updateCharacterPosition(gotoRoomCallback);
        game.updateAnimation();
        gameState.animationFrameId = requestAnimationFrame(() => game.animate(gotoRoomCallback));
    },

    startAnimation(gotoRoomCallback) {
        if (gameState.animationFrameId) {
            cancelAnimationFrame(gameState.animationFrameId);
        }
        gameState.animationFrameId = requestAnimationFrame(() => game.animate(gotoRoomCallback));
    },

    cancelAnimation() {
        if (gameState.animationFrameId) {
            cancelAnimationFrame(gameState.animationFrameId);
            gameState.animationFrameId = null;
        }
    },

    // Allows that a page register an own update function
    registerRoomUpdate(callback) {
        gameState.roomUpdateCallbacks.push(callback);
    },

    // Clear animations after leaving the page
    clearRoomUpdates() {
        gameState.roomUpdateCallbacks = [];
    }
};