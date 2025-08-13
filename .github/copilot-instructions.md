# Project Guidelines

For our UI we are trying to use simple W3.CSS classes to make a stable, predictable UI wherever possible. Avoid reinventing the wheel with custom styles unless necessary.

Remember, in svelte, we can often style just with class:w3-foo={bar} for conditional styling.

Avoid using `window.alert` for notifications; instead, use a custom `<Toast>` component.

DO NOT ADD TYPE HINTING INSIDE OF SVELTE MARKUP. It will trigger a syntax error. Typescript is allowed only inside the `<script lang="ts">` block at the top of the file but NOT in the markup below. Also, avoid superfluous `as any` type assertions.

# Project Structure / Overview

## Backend

We use serverless functions to handle API requests, mostly to AirTable, but also to other APIs. Those functions live in `src/functions/` One slightly unusual feature is that we have all the functions imported into `src/functions/index.ts` and from there we make API calls with a mode parameter which allows that single index function to call a wide variety of requests.

## Data Requests

`src/data/` contains the code that handles data requests, including fetching data from Airtable and other APIs. This is where we define how to query for students, tickets, assets, etc. We often create an object that represents the data we want to work with, such as `Student`, `Ticket`, or `Asset`, and then we can use these objects in our UI components. Those objects are typed with TypeScript interfaces in that data layer, so updates to data structures are usually reflected both in the backend and in the data layer.

One nuissance is that while the backend returned pure airtable API structures, the data layer usually transforms these into objects. So, for example, we have the convention that we use \_id on a data layer object to refer to the Airtable record ID, which is returned separately from `fields` in the Airtable API response. This means that when we fetch data, we often have to transform it into our expected format.

## UI Components

Our UI uses svelte (old school) and w3.css and is organized by feature in `src/ui/`. Each feature has its own directory, such as `tickets`, `assets`, or `students`. Inside each feature directory, we have components that are specific to that feature, as well as any shared components that are used across multiple features. `src/ui/utils/` and `src/components/` contain many general purpose components.

# Working style

When working in agent mode, please follow these guidelines:

- If we're creating a new pattern or kind of template, please generate one example and get feedback before proceeding with the rest. Once you've gotten approval on a pattern, you can continue and do a lot of work at a time if instructed.
- This project connects with Airtable, including using automations from Airtable etc., so there is important information you don't have access to in this codebase (such as which Airtable tables generate email) so ask as needed for clarification.
- DO NOT COMMIT DIRECTLY TO GITHUB. Assume I will review code before we do any commits. If I give explicit instructions to create a branch and a PR, you can follow those instructions, but absent specific and explicit guidance, assume that you should never touch my code as it exists in my repo!

## Branches:

Encourage the use of branches for features or fixes and then creating a pull request so the coder can preview the changes before merging into the main branch. This allows for code review and discussion of changes before they are finalized. In some cases, you may be asked to go ahead and create a branch in which case you can commit to the branch you've created directly, and even create a PR with a gh command, but of course never merge a PR into master/main.
