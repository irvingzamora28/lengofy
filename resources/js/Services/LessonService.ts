interface LessonMetadata {
    title: string;
    lessonNumber: number;
    level: string;
    topics: string[];
    prerequisites: string[];
}

interface Lesson extends LessonMetadata {
    content: string;
    languagePair: string;
    path: string;
}

class LessonService {
    private static async fetchLessonContent(languagePair: string, level: string, lesson: string): Promise<string> {
        try {
            const response = await fetch(`/lessons/${languagePair}/${level}/${lesson}`);
            if (!response.ok) {
                throw new Error('Failed to fetch lesson content');
            }
            return await response.text();
        } catch (error) {
            console.error('Error fetching lesson:', error);
            throw error;
        }
    }

    static async getLesson(languagePair: string, level: string, lesson: string): Promise<Lesson | null> {
        try {
            const content = await this.fetchLessonContent(languagePair, level, lesson);
            
            // Parse frontmatter
            const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
            if (!frontmatterMatch) {
                throw new Error('Invalid lesson format');
            }

            const [, frontmatter, lessonContent] = frontmatterMatch;
            const metadata = this.parseFrontmatter(frontmatter);

            return {
                ...metadata,
                content: lessonContent.trim(),
                languagePair,
                path: `${languagePair}/${level}/${lesson}`,
            };
        } catch (error) {
            console.error('Error loading lesson:', error);
            return null;
        }
    }

    private static parseFrontmatter(frontmatter: string): LessonMetadata {
        const lines = frontmatter.split('\n');
        const metadata: any = {};

        lines.forEach(line => {
            const [key, ...valueParts] = line.split(':');
            if (key && valueParts.length) {
                let value = valueParts.join(':').trim();
                
                // Remove quotes if present
                if (value.startsWith('"') && value.endsWith('"')) {
                    value = value.slice(1, -1);
                }

                // Parse arrays
                if (value.startsWith('[') && value.endsWith(']')) {
                    value = JSON.parse(value);
                }

                metadata[key.trim()] = value;
            }
        });

        return metadata as LessonMetadata;
    }
}

export default LessonService;
export type { Lesson, LessonMetadata };
