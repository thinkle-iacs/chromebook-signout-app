<script lang="ts">
  export let mode: "staff" | "student" = "student";
  export let inputElement: HTMLInputElement | null;
  let dropdownElement: HTMLElement | null;

  import {
    studentDropdown,
    studentName,
    staffDropdown,
    staffName,
  } from "./validators";

  function select(name) {
    if (mode == "staff") {
      console.log("Set staff=>", name);
      $staffName = name;
    } else {
      console.log("Set student=>", name);
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

  function trackFocus(element) {
    document.body.addEventListener("click", (mouseEvent) => {
      console.log("Body click", mouseEvent, mouseEvent.target);
      console.log("We check", dropdownElement, "and", inputElement);
      if (
        (dropdownElement && dropdownElement.contains(mouseEvent.target)) ||
        (inputElement && inputElement.contains(mouseEvent.target))
      ) {
        console.log("Our event, do nothing");
        show = true;
      } else {
        console.log("Not our event");
        show = false;
      }
    });
  }
  $: console.log("Dropdown:", dropdown, "show:", show);
</script>

{#if dropdown.length && show}
  <ul
    class="w3-white dropdown w3-ul w3-border"
    use:trackFocus
    bind:this={dropdownElement}
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
    top: 0px;
    left: 0px;
    z-index: 2;
  }
  .inactive button.w3-button {
    text-decoration: line-through;
    color: #9e9e9e;
  }
</style>
