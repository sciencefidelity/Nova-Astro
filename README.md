# Nova-Astro

**[Astro](https://astro.build) language support for [Nova](https://nova.app).**

Provides syntax highlighting, IntelliSense and autocompletion.

Currently supports the following features:

- Syntax highlighting for `.astro` components
- Code hover hints and issues
- Code completion
- Emmet
- Code folding
- Color Picker in `.astro` components

Support for the following is planned for future updates:

- Jump to definition
- Syntax highlighting for astro syntax in Markdown documents

## Known issues

- Code folding is not working correctly for html tags.
- Top level html template tags will not grey out when commented.

## Contributing

If you find a problem not listed here, know a way to fix it, or think of an enhancement [please create an issue](https://github.com/sciencefidelity/Nova-Astro/issues/new/choose), PRs welcome!

## Credits

As always credit goes to [@apexskier](https://github.com/apexskier) for making the great [TypeScript](https://github.com/apexskier/nova-typescript) extension and utils. Thanks to the Astro team for their work on the [Astro Language Server and VSCode extension](https://github.com/withastro/language-tools), and to Nova for their built in syntaxes that I have wholehartedly copied.
