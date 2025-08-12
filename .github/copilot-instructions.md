# Project Guidelines

For our UI we are trying to use simple W3.CSS classes to make a stable, predictable UI wherever possible. Avoid reinventing the wheel with custom styles unless necessary.

Remember, in svelte, we can often style just with class:w3-foo={bar} for conditional styling.

Avoid using `window.alert` for notifications; instead, use a custom `<Toast>` component.

# Working style

When working in agent mode, please follow these guidelines:

- If we're creating a new pattern or kind of template, please generate one example and get feedback before proceeding with the rest. Once you've gotten approval on a pattern, you can continue and do a lot of work at a time if instructed.
- This project connects with Airtable, including using automations from Airtable etc., so there is important information you don't have access to in this codebase (such as which Airtable tables generate email) so ask as needed for clarification.
