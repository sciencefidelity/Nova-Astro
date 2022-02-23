![](https://raw.githubusercontent.com/sciencefidelity/Nova-Astro/main/images/banner.png)

# Astro for Nova

![](https://raw.githubusercontent.com/sciencefidelity/Nova-Astro/main/images/screenshot-2.png)

Provides syntax highlighting, IntelliSense and autocompletion for **[Astro](https://astro.build)** components.

Currently supports the following features:

- Code hover hints
- Code completion
- Syntax highlighting for `.astro` components
- Code folding
- Emmet
- Color Picker in `.astro` components

Support for the following is planned for a future update:

- Jump to definition
- Syntax highlighting for astro syntax in Markdown

## Caveats

The [Astro Language Server](https://github.com/withastro/language-tools) is still young and certain things don't work as expected. It will not resolve aliases in your `tsconfig.json`, won't understand imports of `.svelte` or `.vue` components, and will show type errors for props passed to those components. Dispite these warnings, most times your app will still compile.

Sometimes the language server does not start when opening a new workspace, or it doesn't update when making changes, in such cases restart the server with the Extensions menu. `Extensions->Astro->Restart Server` should fix these small crashes.

There are still some quirks with the syntax to iron out. The top level html template tags will not grey out when commented.

## Contributing

I'm by no means an expert with Nova extensions, if you find a problem not listed here, know a way to fix it, or think of an enhancement [please create an issue](https://github.com/sciencefidelity/Nova-Astro/issues/new/choose).

## Credits

As always credit goes to [@apexskier](https://github.com/apexskier) for making the great [TypeScript](https://github.com/apexskier/nova-typescript) extension and utils. Thanks to the Astro team for their work on the [Astro Language Server and VSCode extension](https://github.com/withastro/language-tools), and to Nova for their built in syntaxes that I have wholehartedly copied.
