<script lang="ts">
  import Checkout from "./Checkout.svelte";
  import LookupAsset from "./LookupAsset.svelte";
  import Contracts from "./Contracts.svelte";
  import LookupStudent from "./LookupStudent.svelte";
  import History from "./History.svelte";
  import Message from "./BulkMessageSender.svelte";
  import router from "page";
  import LogIn from "./LogIn.svelte";
  import { loggedIn, user } from "./data/user";
  import { l } from "./util";
  import { onMount, SvelteComponent } from "svelte";
  import { fade } from "svelte/transition";
  import LookupStaff from "./LookupStaff.svelte";
  import Reports from "./reports/Reports.svelte";
  import SISTest from "./SISTest.svelte";
  import ScheduleTester from "./scheduling/ScheduleTester.svelte";
  import TicketBrowser from "./tickets/TicketBrowser.svelte";
  import TicketNumberPage from "./tickets/TicketNumberPage.svelte";
  import Invoices from "./Invoices.svelte";

  let update = 0;
  let title = "IACS Chromebook Signout";

  let itUsers = [
    "thinkle@innovationcharter.org",
    "ntroy@innovationcharter.org",
    "aspence@innovationcharter.org",
  ];

  let isIt: boolean = false;
  $: if (loggedIn) {
    let email = $user?.email;
    if (email) {
      let found = itUsers.find((e) => e == email);
      isIt = !!found;
    }
  }

  let page: SvelteComponent;
  let params: {
    name?: string;
    tag?: string;
  } = {};

  const SIGNOUT_TITLE = "IACS Chromebook Signout";
  const IT_NAME = "IACS IT Super Tool";

  onMount(() => {
    router("/message", () => {
      if (page != Message) update += 1;
      page = Message;

      title = "Send Notifications";
    });
    router("/contracts", () => {
      if (page != Contracts) update += 1;
      page = Contracts;
      title = "Manage Chromebook Contract";
    });
    router("/user", () => {
      page = LogIn;
      update += 1;
      title = "IACS Chromebook Signout Log In";
    });
    router("/", () => {
      page = Checkout;
      title = SIGNOUT_TITLE;
    });
    router("/student/", (ctx) => {
      page = LookupStudent;
      title = "IACS Chromebook Student Lookup";
    });
    router("/student/:name", (ctx) => {
      params.name = ctx.params.name;
      page = LookupStudent;
      title = "IACS Chromebook Student Lookup";
    });
    router("/staff/", (ctx) => {
      page = LookupStaff;
      title = "IACS Chromebook Staff Lookup";
    });
    router("/staff/:name", (ctx) => {
      params.name = ctx.params.name;
      page = LookupStaff;
      title = "IACS Chromebook Student Lookup";
    });
    router("/asset/", (ctx) => {
      params = {};
      page = LookupAsset;
      title = "IACS Chromebook Lookup";
    });
    router("/asset/:tag", (ctx) => {
      params = {};
      params.tag = ctx.params.tag;
      page = LookupAsset;
      title = "IACS Chromebook Lookup";
    });
    router("/checkout/", (ctx) => {
      params = {};
      page = Checkout;
      title = "IACS Chromebook Signout";
    });
    router("/history/", (ctx) => {
      page = History;
      title = "IACS Chromebook Signout History";
    });
    router("/it/", (ctx) => {
      page = Checkout;
      params = {
        mode: "it",
      };
      title = IT_NAME;
    });
    router("/reports/", (ctx) => {
      page = Reports;
      title = "IACS Chromebook Reports";
    });

    router("/sis-test/", (ctx) => {
      page = SISTest;
      title = "SIS API Test Tool";
    });
    router("/schedule-test/", (ctx) => {
      page = ScheduleTester;
      title = "Schedule Structure Tester";
    });
    router("/tickets/", (ctx) => {
      page = TicketBrowser;
      title = "Ticket Browser";
    });
    router("/invoices/", (ctx) => {
      page = Invoices;
      title = "Invoices";
    });

    // Route for /ticket/number/:number
    router("/ticket/number/:number", (ctx) => {
      params = { number: ctx.params.number };
      page = TicketNumberPage;
      title = `Ticket #${ctx.params.number}`;
    });
    router.start();
  });
  let navActive;
</script>

<div
  class="w3-main"
  on:click={() => {
    navActive = false;
  }}
  on:keydown={(e) => {
    if (e.key === "Enter" || e.key === " ") {
      navActive = false;
    }
  }}
>
  <nav class="w3-sidebar w3-light-grey" class:navActive>
    <button
      on:click={() => {
        navActive = false;
      }}
      class="mobileNav w3-button close-button">&times;</button
    >
    <a
      class="w3-bar-item w3-button"
      href="/checkout"
      on:click={l("/checkout")}
      class:active={title == SIGNOUT_TITLE}
      class:w3-blue={title == SIGNOUT_TITLE}>Sign In/Out</a
    >
    <a
      class="w3-bar-item w3-button"
      class:active={page == LookupAsset}
      href="/asset/"
      on:click={l("/asset/")}
      class:w3-blue={page == LookupAsset}>Look Up Info</a
    >
    <a
      class="w3-bar-item w3-button"
      class:active={page == LookupStudent}
      class:w3-blue={page == LookupStudent}
      href="/students/"
      on:click={l("/student/")}>Look Up Student</a
    >
    <a
      class="w3-bar-item w3-button"
      class:active={page == LookupStaff}
      class:w3-blue={page == LookupStaff}
      href="/staff/"
      on:click={l("/staff/")}>Look Up Staff</a
    >
    <a
      class="w3-bar-item w3-button"
      class:active={page == History}
      class:w3-blue={page == History}
      href="/history/"
      on:click={l("/history/")}>Signout History</a
    >

    {#if loggedIn && isIt}
      <a
        class="w3-bar-item w3-button"
        class:active={page == Contracts}
        class:w3-blue={page == Contracts}
        href="/reports/"
        on:click={l("/reports/")}>Reports</a
      >
      <a
        class="w3-bar-item w3-button"
        class:active={page == Contracts}
        class:w3-blue={page == Contracts}
        href="/contracts/"
        on:click={l("/contracts/")}>Manage Contracts</a
      >
      <a
        class="w3-bar-item w3-button"
        class:active={page == TicketBrowser}
        class:w3-blue={page == TicketBrowser}
        href="/tickets/"
        on:click={l("/tickets/")}>Tickets</a
      >
      <a
        class="w3-bar-item w3-button"
        class:active={page == Invoices}
        class:w3-blue={page == Invoices}
        href="/invoices/"
        on:click={l("/invoices/")}>Invoices</a
      >
      <a
        class="w3-bar-item w3-button"
        class:active={page == Message}
        class:w3-blue={page == Message}
        href="/message/"
        on:click={l("/message/")}>Send Notifications</a
      >
      <a
        class="w3-bar-item w3-button"
        class:active={title == IT_NAME}
        class:w3-blue={title == IT_NAME}
        href="/it/"
        on:click={l("/it/")}>IT Tool</a
      >
      <a
        class="w3-bar-item w3-button"
        class:active={page == SISTest}
        class:w3-blue={page == SISTest}
        href="/sis-test/"
        on:click={l("/sis-test/")}>🧪 SIS Test</a
      >
      <a
        class="w3-bar-item w3-button"
        class:active={page == ScheduleTester}
        class:w3-blue={page == ScheduleTester}
        href="/schedule-test/"
        on:click={l("/schedule-test/")}>📅 Schedule Test</a
      >
    {/if}
  </nav>
  <main>
    <header class="w3-bar w3-blue">
      <button
        class="mobileNav w3-bar-item w3-blue"
        on:click={(e) => {
          console.log("mobileNav click!");
          navActive = true;
          e.stopPropagation();
        }}>☰</button
      >
      <h4 class="w3-bar-item w3-center w3-blue">
        {title}
      </h4>
    </header>

    {#if !$loggedIn}
      <LogIn />
    {:else if page}
      <!-- This each logic had been there, presumably to 
    try to fix some problem w/ stale data? At any rate, it seems that
    by eliminating it I'm eliminating a buggy situation where I had multiple
    pages rendering on top of each other.
     -->
      {#key update}
        <svelte:component this={page} {...params} />
      {/key}
      <!-- {#if page == History}
        <div in:fade><History {...params} /></div>
      {:else if page == LookupAsset}
        <div in:fade><LookupAsset {...params} /></div>
      {:else if page == Checkout}
        <div in:fade><Checkout {...params} /></div>
      {:else if page == LookupStudent}
        <div in:fade><LookupStudent {...params} /></div>
      {:else if page == History}
        <div in:fade><History {...params} /></div>
      {:else if page == LogIn}
        <LogIn {...params} />
      {:else if page == Contracts}
        <Contracts />
      {:else} 
        <svelte:component this={page} {...params} />        
      {/if} -->
    {:else}
      Weird, nobody's home
    {/if}
  </main>
</div>
{#if $loggedIn}
  <footer class="w3-container w3-cell w3-cell-bottom w3-white">
    Hi there, {$user?.user_metadata?.full_name} ({$user.email})
    <a href="/user" on:click={l("/user")}>(need to log out?)</a>
  </footer>
{/if}

<style>
  header {
    display: flex;
  }
  header h4 {
    margin-left: auto;
    margin-right: auto;
  }
  main {
    padding-bottom: 96px;
    margin-left: 200px;
  }
  footer {
    margin-left: 200px;
  }
  nav :global(a) {
    text-decoration: none;
    width: 200px;
  }

  .mobileNav {
    display: none;
  }
  @media screen and (max-width: 960px) {
    .mobileNav {
      display: initial;
    }
    .close-button {
      display: flex;
      margin-left: auto;
    }
    main,
    footer {
      margin-left: 0px;
    }

    nav {
      display: block;
      overflow: hidden;
      width: 0px;
      transition: width 200ms;
    }

    nav.navActive {
      display: block;
      width: 200px;
    }
  }
  nav a {
    transition: background-color 500ms;
  }

  footer {
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
    max-height: 64px;
  }

  .active:hover {
    background-color: #2196f3 !important;
  }
  h4 {
    margin-top: 0;
  }
</style>
