<script lang="ts">
  export let mode: "staff" | "student" = "student";
  export let inputElement: HTMLInputElement | null;
  import { logger } from "@utils/log";
  let dropdownElement: HTMLElement | null;

  import {
    studentDropdown,
    studentName,
    staffDropdown,
    staffName,
  } from "@utils/validators";

  function select(name) {
    if (mode == "staff") {
      logger.logVerbose("Set staff=>", name);
      $staffName = name;
    } else {
      logger.logVerbose("Set student=>", name);
      $studentName = name;
    }
  }

  let dropdown = [];
  $: if (mode == "student") {
    dropdown = $studentDropdown;
  } else {
    dropdown = $staffDropdown;
  }
  let show = true;

  // Track positioning relative to input wrapper
  let coords = { top: 0, left: 0, width: 0 };
  function updatePosition() {
    if (inputElement) {
      const rect = inputElement.getBoundingClientRect();
      // Use offset within containing block instead of viewport
      // We'll rely on closest positioned ancestor (.input-wrapper) so just align left:0, top:100%
      coords = { top: inputElement.offsetHeight, left: 0, width: rect.width };
    }
  }
  // Recompute when dropdown content changes or input ref established
  $: updatePosition();
  function handleResize() {
    updatePosition();
  }
  window.addEventListener("resize", handleResize);
  // Clean up (Svelte automatically on destroy by returning function)
  import { onDestroy } from "svelte";
  onDestroy(() => window.removeEventListener("resize", handleResize));

  function trackFocus(element) {
    document.body.addEventListener("click", (mouseEvent) => {
      if (
        (dropdownElement && dropdownElement.contains(mouseEvent.target)) ||
        (inputElement && inputElement.contains(mouseEvent.target))
      ) {
        show = true;
        updatePosition();
      } else {
        show = false;
      }
    });
  }
  $: logger.logVerbose("Dropdown:", dropdown, "show:", show);
</script>

{#if dropdown.length && show}
  <ul
    class="w3-white dropdown w3-ul w3-border"
    use:trackFocus
    bind:this={dropdownElement}
    style="top:{coords.top}px;left:{coords.left}px;min-width:{coords.width}px;"
  >
    {#each dropdown as person}
      <li
        class:inactive={person?.Role?.toLowerCase()?.includes("departed") ||
          person?.Status === "Inactive"}
      >
        <button
          class="w3-button"
          on:click={() => select(person.name)}
          style="display:flex;justify-content:start;align-items:center;gap:4px;"
        >
          {person.name}
          {#if person.Role}
            <span class="w3-tiny">({person.Role})</span>
          {/if}
          {#if person.YOG}
            <span class="w3-tiny">[{person.YOG}]</span>
          {/if}
        </button>
      </li>
    {/each}
  </ul>
{/if}

<style>
  ul {
    flex-direction: column;
    display: flex;
  }

  .dropdown {
    position: absolute;
    z-index: 5;
  }
  .inactive button.w3-button {
    text-decoration: line-through;
    color: #9e9e9e;
  }
</style>
