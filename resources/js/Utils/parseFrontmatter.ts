// Utils/parseFrontmatter.ts
import { load } from "js-yaml";

interface Frontmatter {
    [key: string]: any;
}

export function parseFrontmatter(text: string): Frontmatter | null {
    const yamlSeparator = /^---$/;
    const lines = text.split("\n");
    const firstSeparatorIndex = lines.findIndex((line) =>
        yamlSeparator.test(line)
    );

    if (firstSeparatorIndex === -1) return null;

    const secondSeparatorIndex = lines
        .slice(firstSeparatorIndex + 1)
        .findIndex((line) => yamlSeparator.test(line));

    if (secondSeparatorIndex === -1) return null;

    const frontmatter = lines
        .slice(
            firstSeparatorIndex + 1,
            firstSeparatorIndex + 1 + secondSeparatorIndex
        )
        .join("\n");

    try {
        const data = load(frontmatter);
        return data as Frontmatter;
    } catch (e) {
        console.error("Error parsing frontmatter:", e);
        return null;
    }
}
