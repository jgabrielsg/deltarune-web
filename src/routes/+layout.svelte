<script>
    import { onMount } from 'svelte';
    import { game } from '$lib/GameCore.js';
    import { base } from '$app/paths';

    let { isLoaded, loadingProgress } = game.state;

    const unsubscribe = game.subscribe(state => {
        isLoaded = state.isLoaded;
        loadingProgress = state.loadingProgress;
    });

    onMount(() => {
        game.preloadAll();
    });
</script>

{#if !isLoaded}
    <div class="loading-screen">
        <img src="{base}/images/heart.png" alt="Loading..." class="heart-pulse" />
        <p>LOADING... {loadingProgress}%</p>
    </div>
{:else}
    <slot />
{/if}

<style>
    .loading-screen {
        position: fixed;
        inset: 0;
        background: black;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        color: white;
        font-family: 'Determination Mono', monospace;
        z-index: 9999;
    }

    .heart-pulse {
        width: 30px;
        margin-bottom: 20px;
        animation: pulse 0.6s infinite alternate;
    }

    @keyframes pulse {
        from { transform: scale(1); }
        to { transform: scale(1.2); }
    }
</style>