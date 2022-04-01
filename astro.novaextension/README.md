![](https://cdn.sanity.io/images/binfz6bl/production/c0fefa2849a44424bf8a36edb9095cea7cc09292-1280x279.png)

# Astro for Nova

![](https://cdn.sanity.io/images/binfz6bl/production/7822df572ea696faccd3ff56e1d8c37cd4731da1-1444x874.png)

Provides syntax highlighting, IntelliSense and autocompletion for **[Astro](https://astro.build)** components.

Currently supports the following features:

- Syntax highlighting for `.astro` components
- Code hover hints and issues
- Code completion
- Emmet
- Code folding
- Color Picker in `.astro` components

Support for the following is planned for future updates:

- Debugging
- LSP config
- Jump to definition

## Known issues

- Code folding is not working correctly for html tags.
- Top level html template tags will not grey out when commented.

## Contributing

If you find a problem not listed here, know a way to fix it, or think of an enhancement [please create an issue](https://github.com/sciencefidelity/Nova-Astro/issues/new/choose), PRs welcome!

## Credits

As always credit goes to [@apexskier](https://github.com/apexskier) for making the great [TypeScript](https://github.com/apexskier/nova-typescript) extension and utils. Thanks to the Astro team for their work on the [Astro Language Server and VSCode extension](https://github.com/withastro/language-tools), and to Nova for their built in syntaxes that I have wholehartedly copied.
