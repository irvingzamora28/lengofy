// Utils/parseContent.ts
export function parseContent(text: string): string {
    const yamlSeparator = /^---$/;
    const lines = text.split("\n");
    const firstSeparatorIndex = lines.findIndex((line) => yamlSeparator.test(line));

    if (firstSeparatorIndex === -1) return text;

    const secondSeparatorIndex = lines.slice(firstSeparatorIndex + 1).findIndex((line) => yamlSeparator.test(line));

    if (secondSeparatorIndex === -1) return text;

    const contentLines = lines.slice(firstSeparatorIndex + 1 + secondSeparatorIndex + 1);
    return contentLines.join("\n");
  }
