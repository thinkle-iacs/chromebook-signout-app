# Project Guidelines

For our UI we are trying to use simple W3.CSS classes to make a stable, predictable UI wherever possible. Avoid reinventing the wheel with custom styles unless necessary.

Remember, in svelte, we can often style just with class:w3-foo={bar} for conditional styling.

Avoid using `window.alert` for notifications; instead, use a custom `<Toast>` component.

DO NOT ADD TYPE HINTING INSIDE OF SVELTE MARKUP. It will trigger a syntax error. Typescript is allowed only inside the `<script lang="ts">` block at the top of the file but NOT in the markup below. Also, avoid superfluous `as any` type assertions.

# Working style

When working in agent mode, please follow these guidelines:

- If we're creating a new pattern or kind of template, please generate one example and get feedback before proceeding with the rest. Once you've gotten approval on a pattern, you can continue and do a lot of work at a time if instructed.
- This project connects with Airtable, including using automations from Airtable etc., so there is important information you don't have access to in this codebase (such as which Airtable tables generate email) so ask as needed for clarification.
- DO NOT COMMIT DIRECTLY TO GITHUB. Assume I will review code before we do any commits. If I give explicit instructions to create a branch and a PR, you can follow those instructions, but absent specific and explicit guidance, assume that you should never touch my code as it exists in my repo!

## Branches:

Encourage the use of branches for features or fixes and then creating a pull request so the coder can preview the changes before merging into the main branch. This allows for code review and discussion of changes before they are finalized. In some cases, you may be asked to go ahead and create a branch in which case you can commit to the branch you've created directly, and even create a PR with a gh command, but of course never merge a PR into master/main.
