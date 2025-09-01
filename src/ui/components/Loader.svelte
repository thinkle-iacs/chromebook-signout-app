<script lang="ts">
  export let text = "Loading";
  export let working = false;
  export let steps: number | null = null;
  export let currentStep: number = 0;
</script>

{#if working}
  {#if steps}
    <div class="w3-container w3-margin-top w3-margin-bottom">
      <div class="w3-progress-container w3-round w3-dark-grey">
        <div
          class="w3-progressbar w3-blue w3-round animated-bar"
          style="width: {Math.round((currentStep / steps) * 100)}%;"
        >
          <div class="progress-stripes"></div>
        </div>
        <span
          class="w3-text-white w3-small"
          style="position:absolute; left:8px; top:0; height:24px; line-height:24px; z-index:2; pointer-events:none;"
        >
          {text}
          {currentStep}/{steps}
        </span>
      </div>
    </div>
  {:else}
    <div
      class="w3-center w3-pale-yellow w3-padding"
      style="display: inline-block"
    >
      <span class="loader-dots"
        >{text} <span class="dot">.</span><span class="dot">.</span><span
          class="dot">.</span
        ></span
      >
    </div>
  {/if}
{/if}

<style>
  .loader-dots .dot {
    animation: blink 1.4s infinite both;
    font-size: 1.5em;
    font-weight: bold;
    color: #2196f3;
    margin-left: 2px;
  }
  .loader-dots .dot:nth-child(2) {
    animation-delay: 0.2s;
  }
  .loader-dots .dot:nth-child(3) {
    animation-delay: 0.4s;
  }
  @keyframes blink {
    0%,
    80%,
    100% {
      opacity: 0;
    }
    40% {
      opacity: 1;
    }
  }

  .animated-bar {
    background-color: #2196f3;
    position: relative;
    overflow: hidden;
  }
  .progress-stripes {
    position: absolute;
    top: 0;
    left: 0;
    width: 200%;
    height: 100%;
    background: repeating-linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.15) 0px,
      rgba(255, 255, 255, 0.15) 16px,
      transparent 16px,
      transparent 32px
    );
    animation: moveStripes 1.2s linear infinite;
    z-index: 1;
  }
  @keyframes moveStripes {
    0% {
      left: 0;
    }
    100% {
      left: -50%;
    }
  }
  .w3-progress-container {
    height: 24px;
    position: relative;
    overflow: hidden;
  }
  .w3-progressbar {
    height: 24px;
  }
</style>
