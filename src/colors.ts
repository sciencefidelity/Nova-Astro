import { cssNamedColors } from "./colorsProvider";
interface ColorStrings {
  [key: string]: Color;
}

export class AstroColorAssistant implements ColorAssistant {
  hexRegex: RegExp;
  hexaRegex: RegExp;
  hexShortRegex: RegExp;
  hexaShortRegex: RegExp;
  rgbRegex: RegExp;
  rgbaRegex: RegExp;
  hslRegex: RegExp;
  hslaRegex: RegExp;
  srgbRegex: RegExp;
  srgbaRegex: RegExp;
  displayP3Regex: RegExp;
  displayP3ARegex: RegExp;
  namedColors: ColorStrings;

  constructor() {
    // this.attributeBlockChars = new Charset("\\/{")
    // this.stringDoubleQuotedChars = new Charset("\"\\")
    // this.stringSingleQuotedChars = new Charset("'\\")
    // this.attributeNameChars = Charset.alphanumeric.concat("-_")
    // this.valueDelimiterChars = new Charset("/\"';")

    // Regexes
    this.hexRegex = new RegExp("#([a-fA-F0-9]{6})", "i");
    this.hexaRegex = new RegExp("#([a-fA-F0-9]{8})", "i");
    this.hexShortRegex = new RegExp("#([a-fA-F0-9]{3})", "i");
    this.hexaShortRegex = new RegExp("#([a-fA-F0-9]{4})", "i");
    this.rgbRegex = new RegExp(
      "\\brgb\\(\\s*([0-9]{1,3})\\s*,\\s*([0-9]{1,3})\\s*,\\s*([0-9]{1,3})\\s*\\)",
      "i"
    );
    this.rgbaRegex = new RegExp(
      "\\brgba\\(\\s*([0-9]{1,3})\\s*,\\s*([0-9]{1,3})\\s*,\\s*([0-9]{1,3})\\s*,\\s*([0-9]*.?[0-9]+)\\s*\\)",
      "i"
    );
    this.hslRegex = new RegExp(
      "\\bhsl\\(\\s*([0-9]{1,3})\\s*,\\s*([0-9]*.?[0-9]+)%\\s*,\\s*([0-9]*.?[0-9]+)%\\s*\\)",
      "i"
    );
    this.hslaRegex = new RegExp(
      "\\bhsla\\(\\s*([0-9]{1,3})\\s*,\\s*([0-9]*.?[0-9]+)%\\s*,\\s*([0-9]*.?[0-9]+)%\\s*,\\s*([0-9]*.?[0-9]+)\\s*\\)",
      "i"
    );
    this.srgbRegex = new RegExp(
      "\\bcolor\\(\\s*srgb\\s+([0-9]*.?[0-9]+)\\s+([0-9]*.?[0-9]+)\\s+([0-9]*.?[0-9]+)\\s*\\)",
      "i"
    );
    this.srgbaRegex = new RegExp(
      "\\bcolor\\(\\s*srgb\\s+([0-9]*.?[0-9]+)\\s+([0-9]*.?[0-9]+)\\s+([0-9]*.?[0-9]+)\\s*(?:/\\s*([0-9]*.?[0-9]+)\\s*)\\)",
      "i"
    );
    this.displayP3Regex = new RegExp(
      "\\bcolor\\(\\s*display-p3\\s+([0-9]*.?[0-9]+)\\s+([0-9]*.?[0-9]+)\\s+([0-9]*.?[0-9]+)\\s*\\)",
      "i"
    );
    this.displayP3ARegex = new RegExp(
      "\\bcolor\\(\\s*display-p3\\s+([0-9]*.?[0-9]+)\\s+([0-9]*.?[0-9]+)\\s+([0-9]*.?[0-9]+)\\s*(?:/\\s*([0-9]*.?[0-9]+)\\s*)\\)",
      "i"
    );

    // Named colors
    const namedColors: ColorStrings = {};
    const keys = Object.keys(cssNamedColors);
    for (const key of keys) {
      const string = cssNamedColors[key];

      const red = parseInt(string.substring(0, 2), 16) / 255.0;
      const green = parseInt(string.substring(2, 4), 16) / 255.0;
      const blue = parseInt(string.substring(4, 6), 16) / 255.0;

      const color = Color.rgb(red, green, blue, 1.0);
      namedColors[key] = color;
    }
    this.namedColors = namedColors;
  }

  provideColors(
    _editor: TextEditor,
    context: ColorInformationContext
  ): AssistantArray<ColorInformation> {
    const regexes = [
      this.hexaRegex,
      this.hexRegex,
      this.hexaShortRegex,
      this.hexShortRegex,
      this.rgbaRegex,
      this.rgbRegex,
      this.hslaRegex,
      this.hslRegex,
      this.srgbRegex,
      this.srgbaRegex,
      this.displayP3Regex,
      this.displayP3ARegex,
    ];
    const colors = [];

    const candidates = context.candidates;
    for (const candidate of candidates) {
      const string = candidate.text;
      const range = candidate.range;

      const namedColor = this.namedColors[string];
      if (namedColor) {
        // Named color
        const infoRange = new Range(range.start, range.start + string.length);
        const colorInfo = new ColorInformation(infoRange, namedColor, "named");
        colors.push(colorInfo);
      } else {
        for (const regex of regexes) {
          const match = string.match(regex);
          if (match) {
            const color = this.parseColorMatch(match, regex, range);
            if (color) {
              colors.push(color);
              break;
            }
          }
        }
      }
    }

    return colors;
  }

  parseColorMatch(
    match: RegExpMatchArray,
    regex: RegExp,
    range: Range
  ): ColorInformation | null {
    // Parses a CSS color string into an color object
    const position = range.start + match.index!;
    const matchStr = match[0];

    if (regex == this.hexaRegex) {
      let red = parseInt(matchStr.substring(1, 3), 16);
      let green = parseInt(matchStr.substring(3, 5), 16);
      let blue = parseInt(matchStr.substring(5, 7), 16);
      let alpha = parseInt(matchStr.substring(7, 9), 16);

      red = red / 255.0;
      green = green / 255.0;
      blue = blue / 255.0;
      alpha = alpha / 255.0;

      const color = Color.rgb(red, green, blue, alpha);
      const range = new Range(position, position + matchStr.length);
      const info = new ColorInformation(range, color, "hexa");
      info.format = ColorFormat.rgb;
      return info;
    } else if (regex == this.hexaShortRegex) {
      const redStr = matchStr.substring(1, 2);
      const greenStr = matchStr.substring(2, 3);
      const blueStr = matchStr.substring(3, 4);
      const alphaStr = matchStr.substring(4, 5);

      let red = parseInt(redStr + redStr, 16);
      let green = parseInt(greenStr + greenStr, 16);
      let blue = parseInt(blueStr + blueStr, 16);
      let alpha = parseInt(alphaStr + alphaStr, 16);

      red = red / 255.0;
      green = green / 255.0;
      blue = blue / 255.0;
      alpha = alpha / 255.0;

      const color = Color.rgb(red, green, blue, alpha);
      const range = new Range(position, position + matchStr.length);
      const info = new ColorInformation(range, color, "hexas");
      info.format = ColorFormat.rgb;
      return info;
    } else if (regex == this.hexRegex) {
      let red = parseInt(matchStr.substring(1, 3), 16);
      let green = parseInt(matchStr.substring(3, 5), 16);
      let blue = parseInt(matchStr.substring(5, 7), 16);

      red = red / 255.0;
      green = green / 255.0;
      blue = blue / 255.0;

      const color = Color.rgb(red, green, blue, 1.0);
      const range = new Range(position, position + matchStr.length);
      const info = new ColorInformation(range, color, "hex");
      info.format = ColorFormat.rgb;
      return info;
    } else if (regex == this.hexShortRegex) {
      const redStr = matchStr.substring(1, 2);
      const greenStr = matchStr.substring(2, 3);
      const blueStr = matchStr.substring(3, 4);

      let red = parseInt(redStr + redStr, 16);
      let green = parseInt(greenStr + greenStr, 16);
      let blue = parseInt(blueStr + blueStr, 16);

      red = red / 255.0;
      green = green / 255.0;
      blue = blue / 255.0;

      const color = Color.rgb(red, green, blue, 1.0);
      const range = new Range(position, position + matchStr.length);
      const info = new ColorInformation(range, color, "hexs");
      info.format = ColorFormat.rgb;
      return info;
    } else if (regex == this.rgbaRegex) {
      let red = parseInt(match[1]);
      let green = parseInt(match[2]);
      let blue = parseInt(match[3]);
      const alpha = parseFloat(match[4]);

      red = red / 255.0;
      green = green / 255.0;
      blue = blue / 255.0;

      const color = Color.rgb(red, green, blue, alpha);
      const range = new Range(position, position + matchStr.length);
      const info = new ColorInformation(range, color, "rgba");
      info.format = ColorFormat.rgb;
      return info;
    } else if (regex == this.rgbRegex) {
      let red = parseInt(match[1]);
      let green = parseInt(match[2]);
      let blue = parseInt(match[3]);

      red = red / 255.0;
      green = green / 255.0;
      blue = blue / 255.0;

      const color = Color.rgb(red, green, blue, 1.0);
      const range = new Range(position, position + matchStr.length);
      const info = new ColorInformation(range, color, "rgb");
      info.format = ColorFormat.rgb;
      return info;
    } else if (regex == this.hslaRegex) {
      let hue = parseInt(match[1]);
      let sat = parseFloat(match[2]);
      let lum = parseFloat(match[3]);
      const alpha = parseFloat(match[4]);

      hue = hue / 360.0;
      sat = sat / 100.0;
      lum = lum / 100.0;

      const color = Color.hsl(hue, sat, lum, alpha);
      const range = new Range(position, position + matchStr.length);
      const info = new ColorInformation(range, color, "hsla");
      info.format = ColorFormat.hsl;
      return info;
    } else if (regex == this.hslRegex) {
      let hue = parseInt(match[1]);
      let sat = parseFloat(match[2]);
      let lum = parseFloat(match[3]);

      hue = hue / 360.0;
      sat = sat / 100.0;
      lum = lum / 100.0;

      const color = Color.hsl(hue, sat, lum, 1.0);
      const range = new Range(position, position + matchStr.length);
      const info = new ColorInformation(range, color, "hsl");
      info.format = ColorFormat.hsl;
      return info;
    } else if (regex == this.srgbRegex) {
      const red = parseFloat(match[1]);
      const green = parseFloat(match[2]);
      const blue = parseFloat(match[3]);

      const color = Color.rgb(red, green, blue);
      const range = new Range(position, position + matchStr.length);
      const info = new ColorInformation(range, color, "srgb");
      info.format = ColorFormat.rgb;
      info.usesFloats = true;
      return info;
    } else if (regex == this.srgbaRegex) {
      const red = parseFloat(match[1]);
      const green = parseFloat(match[2]);
      const blue = parseFloat(match[3]);
      const alpha = parseFloat(match[4]);

      const color = Color.rgb(red, green, blue, alpha);
      const range = new Range(position, position + matchStr.length);
      const info = new ColorInformation(range, color, "srgba");
      info.format = ColorFormat.rgb;
      info.usesFloats = true;
      return info;
    } else if (regex == this.displayP3Regex) {
      const red = parseFloat(match[1]);
      const green = parseFloat(match[2]);
      const blue = parseFloat(match[3]);

      const color = Color.displayP3(red, green, blue);
      const range = new Range(position, position + matchStr.length);
      const info = new ColorInformation(range, color, "p3");
      info.format = ColorFormat.displayP3;
      info.usesFloats = true;
      return info;
    } else if (regex == this.displayP3ARegex) {
      const red = parseFloat(match[1]);
      const green = parseFloat(match[2]);
      const blue = parseFloat(match[3]);
      const alpha = parseFloat(match[4]);

      const color = Color.displayP3(red, green, blue, alpha);
      const range = new Range(position, position + matchStr.length);
      const info = new ColorInformation(range, color, "p3a");
      info.format = ColorFormat.displayP3;
      info.usesFloats = true;
      return info;
    }
    return null;
  }

  provideColorPresentations(
    color: Color, // eslint-disable-next-line no-unused-vars
    _editor: TextEditor, // eslint-disable-next-line no-unused-vars
    _context: ColorPresentationContext
  ): AssistantArray<ColorPresentation> {
    // Converts a color object into an array of color presentations
    const format = color.format;
    const presentations = [];

    if (format == ColorFormat.displayP3) {
      // Display P3
      const components = color.components;

      // Ensure a certain amount of rounding precision, to prevent very small exponent floats
      const red = Math.round(components[0] * 1000.0) / 1000.0;
      const green = Math.round(components[1] * 1000.0) / 1000.0;
      const blue = Math.round(components[2] * 1000.0) / 1000.0;
      const alpha = Math.round(components[3] * 1000.0) / 1000.0;

      // color(display-p3 r g b)
      if (alpha == 1.0) {
        const string =
          "color(display-p3 " +
          red.toString() +
          " " +
          green.toString() +
          " " +
          blue.toString() +
          ")";

        const presentation = new ColorPresentation(string, "p3");
        presentation.format = ColorFormat.displayP3;
        presentation.usesFloats = true;
        presentations.push(presentation);
      }

      // color(display-p3 r g b / a)
      {
        const string =
          "color(display-p3 " +
          red.toString() +
          " " +
          green.toString() +
          " " +
          blue.toString() +
          " / " +
          alpha.toString() +
          ")";

        const presentation = new ColorPresentation(string, "p3a");
        presentation.format = ColorFormat.displayP3;
        presentation.usesFloats = true;
        presentations.push(presentation);
      }
    } else {
      // color()
      {
        const rgbColor = color.convert(ColorFormat.rgb);
        const components = rgbColor.components;

        // Ensure a certain amount of rounding precision, to prevent very small exponent floats
        const red = Math.round(components[0] * 1000.0) / 1000.0;
        const green = Math.round(components[1] * 1000.0) / 1000.0;
        const blue = Math.round(components[2] * 1000.0) / 1000.0;
        const alpha = Math.round(components[3] * 1000.0) / 1000.0;

        // color(srgb r g b)
        if (alpha == 1.0) {
          const string =
            "color(srgb " +
            red.toString() +
            " " +
            green.toString() +
            " " +
            blue.toString() +
            ")";

          const presentation = new ColorPresentation(string, "srgb");
          presentation.format = ColorFormat.rgb;
          presentation.usesFloats = true;
          presentations.push(presentation);
        }

        // color(srgb r g b / a)
        {
          const string =
            "color(srgb " +
            red.toString() +
            " " +
            green.toString() +
            " " +
            blue.toString() +
            " / " +
            alpha.toString() +
            ")";

          const presentation = new ColorPresentation(string, "srgba");
          presentation.format = ColorFormat.rgb;
          presentation.usesFloats = true;
          presentations.push(presentation);
        }
      }

      // RGB
      {
        const rgbColor = color.convert(ColorFormat.rgb);
        const components = rgbColor.components;

        let red = Math.round(components[0] * 1000.0) / 1000.0;
        let green = Math.round(components[1] * 1000.0) / 1000.0;
        let blue = Math.round(components[2] * 1000.0) / 1000.0;
        const alpha = Math.round(components[3] * 1000.0) / 1000.0;

        red = red * 255.0;
        green = green * 255.0;
        blue = blue * 255.0;

        // rgb()
        if (alpha == 1.0) {
          const string =
            "rgb(" +
            red.toFixed() +
            ", " +
            green.toFixed() +
            ", " +
            blue.toFixed() +
            ")";

          const presentation = new ColorPresentation(string, "rgb");
          presentation.format = ColorFormat.rgb;
          presentations.push(presentation);
        }

        // rgba()
        {
          const string =
            "rgba(" +
            red.toFixed() +
            ", " +
            green.toFixed() +
            ", " +
            blue.toFixed() +
            ", " +
            alpha.toString() +
            ")";

          const presentation = new ColorPresentation(string, "rgba");
          presentation.format = ColorFormat.rgb;
          presentations.push(presentation);
        }
      }

      // HSL
      {
        const hslColor = color.convert(ColorFormat.hsl);
        const components = hslColor.components;

        let hue = Math.round(components[0] * 1000.0) / 1000.0;
        let sat = Math.round(components[1] * 1000.0) / 1000.0;
        let lum = Math.round(components[2] * 1000.0) / 1000.0;
        const alpha = Math.round(components[3] * 1000.0) / 1000.0;

        hue = hue * 360.0;
        sat = sat * 100.0;
        lum = lum * 100.0;

        // hsl()
        if (alpha == 1.0) {
          const string =
            "hsl(" +
            hue.toFixed() +
            ", " +
            sat.toFixed() +
            "%, " +
            lum.toFixed() +
            "%)";

          const presentation = new ColorPresentation(string, "hsl");
          presentation.format = ColorFormat.hsl;
          presentations.push(presentation);
        }

        // hsla()
        {
          const string =
            "hsla(" +
            hue.toFixed() +
            ", " +
            sat.toFixed() +
            "%, " +
            lum.toFixed() +
            "%, " +
            alpha.toString() +
            ")";

          const presentation = new ColorPresentation(string, "hsla");
          presentation.format = ColorFormat.hsl;
          presentations.push(presentation);
        }
      }

      // Hex
      {
        const rgbColor = color.convert(ColorFormat.rgb);
        const components = rgbColor.components;

        let red = components[0];
        let green = components[1];
        let blue = components[2];
        let alpha = components[3];

        red = red * 255.0;
        green = green * 255.0;
        blue = blue * 255.0;

        let redHex = Math.floor(red).toString(16);
        if (redHex.length == 1) {
          redHex = "0" + redHex;
        }
        let greenHex = Math.floor(green).toString(16);
        if (greenHex.length == 1) {
          greenHex = "0" + greenHex;
        }
        let blueHex = Math.floor(blue).toString(16);
        if (blueHex.length == 1) {
          blueHex = "0" + blueHex;
        }

        if (alpha == 1.0) {
          if (
            redHex.charAt(0) == redHex.charAt(1) &&
            greenHex.charAt(0) == greenHex.charAt(1) &&
            blueHex.charAt(0) == blueHex.charAt(1)
          ) {
            // Short form
            const string =
              "#" + redHex.charAt(0) + greenHex.charAt(0) + blueHex.charAt(0);

            const presentation = new ColorPresentation(string, "hexs");
            presentation.format = ColorFormat.rgb;
            presentations.push(presentation);
          }

          const string = "#" + redHex + greenHex + blueHex;

          const presentation = new ColorPresentation(string, "hex");
          presentation.format = ColorFormat.rgb;
          presentations.push(presentation);
        }

        alpha = alpha * 255.0;

        let alphaHex = Math.floor(alpha).toString(16);
        if (alphaHex.length == 1) {
          alphaHex = "0" + alphaHex;
        }

        if (
          redHex.charAt(0) == redHex.charAt(1) &&
          greenHex.charAt(0) == greenHex.charAt(1) &&
          blueHex.charAt(0) == blueHex.charAt(1) &&
          alphaHex.charAt(0) == alphaHex.charAt(1)
        ) {
          // Short form
          const string =
            "#" +
            redHex.charAt(0) +
            greenHex.charAt(0) +
            blueHex.charAt(0) +
            alphaHex.charAt(0);

          const presentation = new ColorPresentation(string, "hexas");
          presentation.format = ColorFormat.rgb;
          presentations.push(presentation);
        }

        const string = "#" + redHex + greenHex + blueHex + alphaHex;

        const presentation = new ColorPresentation(string, "hexa");
        presentation.format = ColorFormat.rgb;
        presentations.push(presentation);
      }
    }

    return presentations;
  }
}
