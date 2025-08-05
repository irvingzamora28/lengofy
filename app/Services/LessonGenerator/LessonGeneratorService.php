<?php

namespace App\Services\LessonGenerator;

use App\Services\AI\AIServiceFactory;
use Exception;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class LessonGeneratorService
{
    protected $aiService;
    protected $sourceLanguage;
    protected $targetLanguage;

    const COMPONENTS_INSTRUCTIONS = <<<PROMPT
    You are creating an MDX-JSX file for educational purposes. Make sure to use the JSX components naturally and correctly within the educational content:

    - TextToSpeechPlayer: This component embeds audio related to the lesson. Use it without any title or explicit announcement. Just insert it where the audio example is necessary. Format: <TextToSpeechPlayer mp3File="relative_path_to_audio_file" />. Ensure the path is relevant to the content discussed. If the audio that represents the example is only one word add the "miniPlayer" parameter set to true. If its a "miniPlayer" put the example and the TextToSpeechPlayer component formated inside a table. When the TextToSpeechPlayer is a miniPlayer it MUST be inside a table. Format: <TextToSpeechPlayer mp3File="relative_path_to_audio_file" miniPlayer={true} />.

    - TipBox: This component highlights key tips or important notes within the content. It should encapsulate a list of tips or a single tip directly, without any preceding title like "Tip:". Format: <TipBox>Here goes the tip or a list of tips.</TipBox>. It should be used to emphasize crucial points or suggestions naturally within the flow of the content.

    - Mnemonic: This component provides mnemonic aids for learning. Include it directly where the mnemonic aid is relevant to the lesson content. Do not precede it with any titles or introductions. It should appear as a natural part of the educational narrative. Format: <Mnemonic content="mnemonic_phrase" />. Ensure the content is helpful and relevant to the associated topic.

    - HighlightableText: This component highlights key words or phrases in a sentence and provides additional information (e.g., translations, grammar rules, pronunciation). Use it to make vocabulary or grammar points interactive. It should only be used in sentences and not on single words. It should not be used in a list.  Format: <HighlightableText highlights='[{"word":"Guten","info":"Means good in the accusative case."},{"word":"Morgen","info":"Means morning. Pronounced: MOR-gen."}]'>
      Guten Morgen, wie geht es dir?
    </HighlightableText>

    - SentenceBreakdown: This component breaks down complex sentences into smaller parts with explanations for each segment. Use it to teach sentence structure interactively. Format: <SentenceBreakdown sentence="Your sentence here"><Part part="segment" explanation="explanation" />...</SentenceBreakdown>. Each <Part> represents a segment of the sentence and its corresponding explanation. Learners can click through parts to understand the sentence structure step by step. Use it to make sentence analysis engaging and interactive.

    - VoiceRecorder: This component is an interactive tool designed to help language learners improve their pronunciation. It allows users to Record Their Voice and Listen to Native Pronunciation.Format: <VoiceRecorder text="Guten Morgen" nativeAudio="../../courses/en-de/_shared/guten_morgen.mp3" />

    - WordBuilder: This component allows users to practice vocabulary by scrambling the letters of a given word. It takes two arguments: targetWord (the word to be unscrambled) and nativeWord (the corresponding word in the learner's native language). Use it to engage learners in reconstructing words from scrambled letters. Format: <WordBuilder targetWord="your_target_word" nativeWord="your_native_word" />. Ensure the words are relevant to the lesson context to enhance the learning experience

    An example of a section that uses correctly all JSX components is the following:

    ## Section 2: Articles

    Articles in Spanish must agree in gender and number with the noun they accompany. There are definite articles (the) and indefinite articles (a, an).

    ### Definite Articles

    | English         | Spanish Singular | Spanish Plural | Example Sentence     |
    | --------------- | ---------------- | -------------- | -------------------- |
    | The (masculine) | El               | Los            | El libro, Los libros |
    | The (feminine)  | La               | Las            | La casa, Las casas   |

    ### Indefinite Articles

    | English       | Spanish Singular | Spanish Plural | Example Sentence      |
    | ------------- | ---------------- | -------------- | --------------------- |
    | A (masculine) | Un               | Unos           | Un libro, Unos libros |
    | A (feminine)  | Una              | Unas           | Una casa, Unas casas  |

    <TextToSpeechPlayer mp3File="/src/assets/courses/spanish/_shared/lessons/lesson5/audio/articles.mp3" />

    Explanation on How to Form Articles:

    The articles in Spanish change based on the gender (masculine or feminine) and number (singular or plural) of the noun they precede. Definite articles are used for specific items known to the speaker ('the' in English), while indefinite articles are used for nonspecific items ('a,' 'an,' or 'some' in English). To form the correct article, first, identify the gender and number of the noun, then choose the corresponding article:

    Use "el" for masculine singular, "los" for masculine plural.
    Use "la" for feminine singular, "las" for feminine plural.
    Use "un" for masculine singular, "unos" for masculine plural.
    Use "una" for feminine singular, "unas" for feminine plural.

    <Mnemonic title="Definite Articles" content="El is E for masculine singular, La is L for feminine singular, Los is plural masculine, Las is plural feminine" />

    <TipBox>
    Remember:
    - Pronouns replace nouns in a sentence
    </TipBox>

    ## Practice Exercise: Build the Word
    Now it's time to practice spelling some of these greetings! Rearrange the letters to spell the correct German word.

    <WordBuilder targetWord="Guten Morgen" nativeWord="Good morning" />
    <WordBuilder targetWord="Guten Tag" nativeWord="Good day" />
    <WordBuilder targetWord="Guten Abend" nativeWord="Good evening" />

    ## Pronunciation Practice
    Practice saying the following phrase in German:

    <VoiceRecorder text="Guten Morgen" nativeAudio="../../courses/en-de/_shared/guten_morgen.mp3" />

    -   **A Pronounced like the "a" in "father."**

    | Examples                                             | Pronunciation                                                                                                     |
    | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
    | _casa_ (house), _agua_ (water), _amarillo_ (yellow). | <TextToSpeechPlayer mp3File="../../assets/courses/en-es/_shared/lessons/lesson1/audio/a.mp3" miniPlayer={true} /> |



    <HighlightableText highlights='[{"word":"Guten","info":"Means good in the accusative case."},{"word":"Morgen","info":"Means morning. Pronounced: MOR-gen."}]'>
      Guten Morgen, wie geht es dir?
    </HighlightableText>

    <SentenceBreakdown sentence="Ich möchte einen Kaffee bestellen.">
      <Part part="Ich" explanation="I (subject pronoun)" />
      <Part part="möchte" explanation="Would like (modal verb)" />
      <Part part="einen Kaffee" explanation="A coffee (accusative case)" />
      <Part part="bestellen" explanation="To order (infinitive verb)" />
    </SentenceBreakdown>


    ___

    IMPORTANT: Each component MUST be used correctly into the content, appropriately and naturally. Avoid misuse or incorrect parameterization of these components These are the only JSX componets that exist so avoid using any other components.
    PROMPT;

    const ELEMENTS_INSTRUCTIONS = <<<PROMPT
    MDX elements refer to markdown elements like headers, lists, and tables used to structure the content. Use the specified elements to organize the content clearly and effectively.
    For instance, use tables to compare words or show translation and concise examples. When using tables use more than 3 columns and 3 rows for meaningful content.
    A good example of the table use is the following:
    | Noun (English)  | Noun (Spanish) | Gender    | Example Sentence                  |
    | --------------- | -------------- | --------- | --------------------------------- |
    | Friend          | Amigo          | Masculine | Mi amigo es alto.                 |
    | Book            | Libro          | Masculine | El libro está en la mesa.         |
    | Friend (female) | Amiga          | Feminine  | Mi amiga es inteligente.          |
    | House           | Casa           | Feminine  | La casa es grande.                |
    | Table           | Mesa           | Feminine  | Hay una mesa en la cocina.        |
    | Chair           | Silla          | Feminine  | Hay una silla en la sala.         |
    | Desk            | Escritorio     | Masculine | El escritorio está en la oficina. |

    Inside of a table do not use components. Do not use HTML table, use the markdown equivalent. The only exception where a component is inside a table is when the TextToSpeechPlayer component is a "miniPlayer".
    In the case of the TextToSpeechPlayer component, when it is a "miniPlayer", it MUST be used inside a table.
    Use list items for steps or tips, and ensure that the usage of these elements is directly relevant to the educational material. If an element like a table or list is mentioned, it must be used accordingly. Ensure each element enhances the lesson's educational value and readability.
    PROMPT;

    const CONTENT_ADDITIONAL_INSTRUCTIONS = <<<PROMPT
    \n\nNote: Remember to provide only the generated content in MDX format without unnecessary explanations or meta-commentary.
    Examples are very important to help students understand concepts. When you see pertinent the use of examples, use clear, concise examples to explain the key points and most importanly USE MANY examples, MORE THAN 6, THIS IS VERY IMPORTANT, USE MORE THAN 6 examples ALWAYS.
    Generate the content and only the content in an MDX format.
    Keep the content short and to the point.
    Do not include text about what you did, your thought process or any other messages, just the generated content in MDX format.
    Also omit the title of the lesson and the title of the section, just provide the content.
    DO NOT USE <table> html tags, use the markdown equivalent.
    DO NOT USE <ul> or <ol> html tags, use the markdown equivalent.
    DO NOT USE <li> html tags, use the markdown equivalent.
    DO NOT USE html tags, USE only markdown.
    IT IS STRICTLY PROHIBITED TO USE HTML TAGS, USE ONLY MARKDOWN.
    Do not format the output with ```markdown, ```mdx or anything like that.
    PROMPT;



    /**
     * Create a new LessonGeneratorService instance
     *
     * @param string $provider The AI provider to use (openai, anthropic, google)
     * @param string $sourceLanguage The language code of the speaker (e.g., 'es' for Spanish)
     * @param string $targetLanguage The language code being learned (e.g., 'en' for English)
     */
    public function __construct(string $provider, string $sourceLanguage, string $targetLanguage)
    {
        $this->aiService = AIServiceFactory::create($provider);
        $this->sourceLanguage = $sourceLanguage;
        $this->targetLanguage = $targetLanguage;
    }

    /**
     * Generate a lesson structure JSON from a course JSON file
     *
     * @param string $courseJsonPath Path to the course JSON file
     * @param int $lessonNumber The lesson number to generate
     * @return string Path to the generated lesson structure JSON file
     */
    public function generateLessonStructure(string $courseJsonPath, int $lessonNumber): string
    {
        // Read the course JSON file
        $courseJson = json_decode(File::get($courseJsonPath), true);

        // Find the lesson by number
        $lesson = null;
        foreach ($courseJson as $level) {
            foreach ($level['lessons'] as $lessonData) {
                if ($lessonData['lesson_number'] == $lessonNumber) {
                    $lesson = $lessonData;
                    break 2;
                }
            }
        }

        if (!$lesson) {
            throw new Exception("Lesson number $lessonNumber not found in the course JSON file");
        }

        // Create the lesson structure prompt
        $prompt = $this->createLessonStructurePrompt($lesson, $this->sourceLanguage, $this->targetLanguage);

        // Generate the lesson structure using AI
        $lessonStructureJson = $this->aiService->generateContent($prompt);

        // Clean the response to ensure it's valid JSON
        $lessonStructureJson = $this->cleanJsonResponse($lessonStructureJson);

        // Ensure the generated content is valid JSON
        $lessonStructure = json_decode($lessonStructureJson, true);
        if (!$lessonStructure) {
            $jsonError = json_last_error_msg();
            $excerpt = substr($lessonStructureJson, 0, 500) . (strlen($lessonStructureJson) > 500 ? '...' : '');
            throw new Exception("Generated lesson structure is not valid JSON. Error: $jsonError. Content excerpt: \n$excerpt");
        }

        // Create the directory if it doesn't exist
        $outputDir = storage_path("app/lessons/{$this->sourceLanguage}-{$this->targetLanguage}/01-beginner");
        if (!File::exists($outputDir)) {
            File::makeDirectory($outputDir, 0755, true);
        }

        // Create a slug from the lesson name
        $slug = Str::slug($lesson['name']);

        // Save the lesson structure JSON
        $outputPath = "$outputDir/lesson_{$lessonNumber}_structure.json";
        File::put($outputPath, json_encode($lessonStructure, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

        return $outputPath;
    }

    protected function generateVocabulary(array $lessonStructure): string
    {
        $prompt = $this->createVocabularyPrompt($lessonStructure);
        $vocabulary = $this->aiService->generateContent($prompt);
        // Clean content remove ```
        $vocabulary = preg_replace('/```mdx\s*/', '', $vocabulary);
        $vocabulary = preg_replace('/```\s*$/', '', $vocabulary);

        if (!$vocabulary) {
            throw new Exception('Failed to generate valid vocabulary MDX');
        }

        return $vocabulary;
    }

    protected function createVocabularyPrompt(array $lessonStructure): string
    {
        $sourceLanguageName = $this->getLanguageName($this->sourceLanguage);
        $targetLanguageName = $this->getLanguageName($this->targetLanguage);

        // Encode the vocabulary structure as a pretty-printed JSON string
        $words = implode(', ', $lessonStructure['vocabulary']['words']);
        $properties = implode(', ', $lessonStructure['vocabulary']['properties']);

        return <<<PROMPT
    You are an expert language curriculum designer. Generate vocabulary for a language lesson.

    TASK:
    Create vocabulary entries for this lesson:
    - Title: {$lessonStructure['title']}
    - Description: {$lessonStructure['description']}
    - Source Language: $sourceLanguageName
    - Target Language: $targetLanguageName

    Here is an example of the vocabulary in MDX format generated with the words: jirafa, huevo, guerra, cielo, año. The source language is english and the target language is spanish. The properties: word, translation, exampleSentence, exampleTranslation, gender, challenge:
    vocabulary:
        - word: "jirafa"
        translation: "giraffe"
        exampleSentence: "La jirafa tiene un cuello largo."
        exampleTranslation: "The giraffe has a long neck."
        gender: "fem"
        challenge: "The 'j' is pronounced like an English 'h'."
        - word: "huevo"
        translation: "egg"
        exampleSentence: "Quiero un huevo frito."
        exampleTranslation: "I want a fried egg."
        gender: "masc"
        challenge: "Remember that 'h' is always silent."
        - word: "guerra"
        translation: "war"
        exampleSentence: "La guerra no es la solución."
        exampleTranslation: "War is not the solution."
        gender: "fem"
        challenge: "'G' before 'u' and 'e' can be tricky."
        - word: "cielo"
        translation: "sky"
        exampleSentence: "El cielo es azul."
        exampleTranslation: "The sky is blue."
        gender: "masc"
        challenge: "'C' before 'i' and 'e' sounds like 'th' in Spain and 's' in Latin America."
        - word: "año"
        translation: "year"
        exampleSentence: "Cada año vamos a la playa."
        exampleTranslation: "Every year we go to the beach."
        gender: "masc"
        challenge: "The 'ñ' sound doesn't exist in English."

    Generate the content and only the content in an MDX format.
    In this case, The vocabulary words are $words.
    The vocabulary you are going to generate in an MDX format and will have the following properties $properties.
    The vocabulary will be in the target language $targetLanguageName and the source language is $sourceLanguageName, that means the word will be in $targetLanguageName and the translation will be in $sourceLanguageName, the exampleSentence will be in $targetLanguageName and the exampleTranslation will be in $sourceLanguageName (Which might or might not be different from the example).
    Do not include text about what you did, your thought process or any other messages,
    just the generated content in MDX format.
    Also omit the title of the lesson and the title of the section.

    PROMPT;
    }

    protected function generateSection(array $section, array $lessonStructure, string $sourceLanguage, string $targetLanguage): string
    {
        $sourceLanguageName = $this->getLanguageName($sourceLanguage);
        $targetLanguageName = $this->getLanguageName($targetLanguage);

        // Extract and format section data
        $lessonTitle = $lessonStructure['title'];
        $sectionTitle = $section['title'];
        $sectionAbout = $section['about'];
        $sectionComponents = $this->formatComponents($section['components'] ?? []);
        $sectionElements = $this->formatElements($section['elements'] ?? []);

        // Dynamically build the prompt with optional components and elements instructions
        $componentsInstruction = !empty($sectionComponents)
            ? self::COMPONENTS_INSTRUCTIONS . "\nThe JSX components that MUST be used are: {$sectionComponents}. "
            : '';

        $elementsInstruction = !empty($sectionElements)
            ? self::ELEMENTS_INSTRUCTIONS . "\nThe MDX elements that MUST be incorporated are: {$sectionElements}. In this case a {$sectionElements} was told to be used. So you MUST incorporate {$sectionElements} into the generated content."
            : '';


        $prompt = <<<PROMPT
        You are an expert language curriculum designer. Create a section for a language learning lesson.

        TASK:
        Generate content for the lesson titled "{$lessonTitle}", specifically the section titled "{$sectionTitle}".
        Generate the section content based on the prompt: {$sectionAbout}. Ensure the content is instructional and engaging. The content should be directly relevant to the lesson subject and formatted in MDX. This will be part of a larger lesson, so make sure the content is engaging, informative, and very short.

        {$componentsInstruction}{$elementsInstruction}

        Lesson Context:
        - Title: {$lessonTitle}
        - Description: {$lessonStructure['description']}
        - Source Language: $sourceLanguageName (The learner speaks this language)
        - Target Language: $targetLanguageName (The learner is learning this language)

        Requirements:
        1. Follow MDX format
        2. Create engaging, interactive content using the specified components: {$sectionComponents}
        3. The lesson MUST start with a title in MDX format, in this case the title is {$lessonTitle}
        4. The lesson section will be in $sourceLanguageName and the target language is $targetLanguageName, that means the instructions and content will be in $sourceLanguageName and the content the user is learning will be in $targetLanguageName (Which might or might not be different from the example).
        5. Keep in mind this section is part of a larger lesson

        Output the section content in MDX format.\n\n
        PROMPT;

        // Append the constant CONTENT_ADDITIONAL_INSTRUCTIONS to the prompt
        $prompt .= self::CONTENT_ADDITIONAL_INSTRUCTIONS;
        echo $prompt;
        return $this->aiService->generateContent($prompt);
    }

    protected function formatComponents(array $components): string
    {
        return implode(', ', array_map(function ($component) {
            return "'$component'";
        }, $components));
    }

    protected function formatElements(array $elements): string
    {
        return implode(', ', array_map(function ($element) {
            return "'$element'";
        }, $elements));
    }

    protected function generateFrontMatter(array $lessonStructure, string $vocabulary): string
    {
        $frontMatter = [
            'title' => $lessonStructure['title'],
            'lesson_number' => $lessonStructure['lesson_number'],
            'description' => $lessonStructure['description'],
            'date' => date('Y-m-d'),
        ];

        return "---\n" . $this->arrayToYaml($frontMatter) . $vocabulary . "\n---";
    }

    protected function arrayToYaml(array $array, int $indent = 0): string
    {
        $yaml = '';
        $indentation = str_repeat('  ', $indent);

        foreach ($array as $key => $value) {
            if (is_array($value)) {
                $yaml .= "{$indentation}{$key}:\n" . $this->arrayToYaml($value, $indent + 1);
            } else {
                $formattedValue = is_string($value) ? "\"{$value}\"" : $value;
                $yaml .= "{$indentation}{$key}: {$formattedValue}\n";
            }
        }

        return $yaml;
    }

    /**
     * Generate a lesson MDX file from a lesson structure JSON
     *
     * @param string $lessonStructurePath Path to the lesson structure JSON file
     * @return string Path to the generated MDX file
     */
    public function generateLessonMdx(string $lessonStructurePath): string
    {
        // Read the lesson structure JSON
        $lessonStructure = json_decode(File::get($lessonStructurePath), true);

        // Generate vocabulary first
        $vocabulary = $this->generateVocabulary($lessonStructure);

        // Generate each section separately
        $sectionContents = [];
        foreach ($lessonStructure['sections'] as $section) {
            $sectionContent = $this->generateSection($section, $lessonStructure, $this->sourceLanguage, $this->targetLanguage);
            $sectionContents[] = $sectionContent;
        }

        // Combine all sections into final MDX
        $frontMatter = $this->generateFrontMatter($lessonStructure, $vocabulary);
        $lessonMdx = $frontMatter . "\n\n" . implode("\n\n", $sectionContents);

        // Extract the lesson number from the structure
        $lessonNumber = $lessonStructure['lesson_number'] ?? 1;

        // Create a slug from the lesson title
        $slug = Str::slug($lessonStructure['title']);

        // Determine the output directory
        $outputDir = resource_path("lessons/{$this->sourceLanguage}-{$this->targetLanguage}/01-beginner");
        if (!File::exists($outputDir)) {
            File::makeDirectory($outputDir, 0755, true);
        }

        // Save the lesson MDX
        $outputPath = "$outputDir/lesson_" . str_pad($lessonNumber, 2, '0', STR_PAD_LEFT) . "_{$slug}.mdx";
        File::put($outputPath, $lessonMdx);

        return $outputPath;
    }

    /**
     * Generate an audio JSON file for a lesson
     *
     * @param string $mdxFilePath Path to the lesson MDX file
     * @return string Path to the generated audio JSON file
     */
    public function generateAudioJson(string $mdxFilePath): string
    {
        // Read the MDX file
        $mdxContent = File::get($mdxFilePath);

        // Extract lesson number from MDX file
        $lessonNumber = 1; // Default
        if (preg_match('/lesson_number:\s*(\d+)/', $mdxContent, $matches)) {
            $lessonNumber = (int) $matches[1];
        }

        // Parse the MDX content into sections
        $sections = $this->parseMdxIntoSections($mdxContent);
        
        // Process each section to generate audio JSON entries
        $audioEntries = [];
        
        foreach ($sections as $index => $section) {
            // Skip sections without TextToSpeechPlayer components
            if (!preg_match('/<TextToSpeechPlayer\s/', $section)) {
                continue;
            }
            
            // Create the audio JSON prompt for this section
            $prompt = $this->createAudioJsonPrompt($section, $this->targetLanguage, $lessonNumber);
            
            // Generate the audio JSON for this section using AI
            $sectionAudioJson = $this->aiService->generateContent($prompt);
            
            // Clean the response to ensure it's valid JSON
            $sectionAudioJson = $this->cleanJsonResponse($sectionAudioJson);
            
            // Decode the section's audio JSON
            $sectionAudioEntries = json_decode($sectionAudioJson, true);
            
            // Check if the section's audio JSON is valid
            if (!$sectionAudioEntries) {
                $jsonError = json_last_error_msg();
                $excerpt = substr($sectionAudioJson, 0, 200) . (strlen($sectionAudioJson) > 200 ? '...' : '');
                // Log the error but continue processing other sections
                error_log("Section $index generated invalid JSON. Error: $jsonError. Content excerpt: \n$excerpt");
                continue;
            }
            
            // If the section returned a single object instead of an array, convert it to an array
            if (isset($sectionAudioEntries['text'])) {
                $sectionAudioEntries = [$sectionAudioEntries];
            }
            
            // Add the section's audio entries to the main array
            foreach ($sectionAudioEntries as $entry) {
                if (isset($entry['text']) && isset($entry['audio_file_name'])) {
                    $audioEntries[] = $entry;
                }
            }
        }
        
        // If no valid audio entries were generated, try the original approach as fallback
        if (empty($audioEntries)) {
            // Create the audio JSON prompt for the entire content
            $prompt = $this->createAudioJsonPrompt($mdxContent, $this->targetLanguage, $lessonNumber);
            
            // Generate the audio JSON using AI
            $audioJson = $this->aiService->generateContent($prompt);
            
            // Clean the response to ensure it's valid JSON
            $audioJson = $this->cleanJsonResponse($audioJson);
            
            // Decode the audio JSON
            $audioEntries = json_decode($audioJson, true);
            
            // Ensure the generated content is valid JSON
            if (!$audioEntries) {
                $jsonError = json_last_error_msg();
                $excerpt = substr($audioJson, 0, 500) . (strlen($audioJson) > 500 ? '...' : '');
                throw new Exception("Generated audio JSON is not valid JSON. Error: $jsonError. Content excerpt: \n$excerpt");
            }
            
            // If the result is a single object instead of an array, convert it to an array
            if (isset($audioEntries['text'])) {
                $audioEntries = [$audioEntries];
            }
        }
        
        // Get the directory and filename from the MDX file path
        $pathInfo = pathinfo($mdxFilePath);
        $directory = $pathInfo['dirname'];
        $filename = $pathInfo['filename'];
        
        // Create the audio directory if it doesn't exist
        $audioDir = "$directory/audio";
        if (!File::exists($audioDir)) {
            File::makeDirectory($audioDir, 0755, true);
        }
        
        // Save the audio JSON
        $outputPath = "$audioDir/{$filename}.json";
        File::put($outputPath, json_encode($audioEntries, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        
        return $outputPath;
    }

    /**
     * Parse MDX content into sections for better processing
     *
     * @param string $mdxContent The MDX content to parse
     * @return array Array of MDX content sections
     */
    protected function parseMdxIntoSections(string $mdxContent): array
    {
        // Remove the frontmatter
        $mdxContent = preg_replace('/^---[\s\S]*?---/m', '', $mdxContent);
        
        // Split by headers (## or ###)
        $sections = preg_split('/(^#{2,3}\s+.*$)/m', $mdxContent, -1, PREG_SPLIT_DELIM_CAPTURE | PREG_SPLIT_NO_EMPTY);
        
        // If no sections were found, treat the whole content as one section
        if (count($sections) <= 1) {
            return [$mdxContent];
        }
        
        // Combine headers with their content
        $combinedSections = [];
        $currentSection = '';
        
        foreach ($sections as $section) {
            // If this is a header, start a new section
            if (preg_match('/^#{2,3}\s+.*$/m', $section)) {
                // If we have content in the current section, add it to the combined sections
                if (!empty($currentSection)) {
                    $combinedSections[] = $currentSection;
                }
                $currentSection = $section;
            } else {
                // This is content, add it to the current section
                $currentSection .= $section;
            }
        }
        
        // Add the last section
        if (!empty($currentSection)) {
            $combinedSections[] = $currentSection;
        }
        
        // Further split large sections by TextToSpeechPlayer components
        $finalSections = [];
        foreach ($combinedSections as $section) {
            // If the section has multiple TextToSpeechPlayer components, split it
            $textToSpeechCount = substr_count($section, '<TextToSpeechPlayer');
            
            if ($textToSpeechCount > 1) {
                // Split by TextToSpeechPlayer, keeping the component with the content before it
                $parts = preg_split('/(?=<TextToSpeechPlayer)/i', $section);
                
                // The first part might not have a TextToSpeechPlayer component
                if (!empty($parts[0]) && !preg_match('/<TextToSpeechPlayer/i', $parts[0])) {
                    // Skip parts without TextToSpeechPlayer or combine with the next part
                    if (isset($parts[1])) {
                        $parts[1] = $parts[0] . $parts[1];
                    }
                    array_shift($parts);
                }
                
                foreach ($parts as $part) {
                    if (!empty(trim($part))) {
                        $finalSections[] = $part;
                    }
                }
            } else {
                // Keep the section as is
                $finalSections[] = $section;
            }
        }
        
        return $finalSections;
    }

    /**
     * Create a prompt for generating the lesson structure
     *
     * @param array $lesson The lesson data from the course JSON
     * @param string $sourceLanguage The language code of the speaker
     * @param string $targetLanguage The language code being learned
     * @return string The prompt
     */
    protected function createLessonStructurePrompt(array $lesson, string $sourceLanguage, string $targetLanguage): string
    {
        $sourceLanguageName = $this->getLanguageName($sourceLanguage);
        $targetLanguageName = $this->getLanguageName($targetLanguage);

        return <<<PROMPT
    You are an expert language curriculum designer. Create a detailed lesson structure for a language learning platform.

    TASK:
    Create a JSON structure for a language lesson with the following details:
    - Lesson Title: {$lesson['name']}
    - Lesson Number: {$lesson['lesson_number']}
    - Description: {$lesson['description']}
    - Source Language: $sourceLanguageName
    - Target Language: $targetLanguageName

    The JSON structure should include multiple sections, each with a title, description, and appropriate components.

    IMPORTANT: Your response must be ONLY valid JSON without any additional text, markdown formatting, or code blocks.

    COMPONENTS GUIDE:
    Here are the available components and when to use them:

    1. TextToSpeechPlayer:
    - Purpose: Plays audio of text for pronunciation practice
    - Use in: Vocabulary sections, dialogue sections, pronunciation practice
    - Not appropriate for: Cultural notes or grammar explanations without examples

    2. SentenceBreakdown:
    - Purpose: Breaks down sentences to show word-by-word translations and grammar notes
    - Use in: Grammar sections, example sentences, dialogue analysis
    - Not appropriate for: Introduction sections or cultural notes

    3. VocabularyTable:
    - Purpose: Displays vocabulary words with translations and example usage
    - Use in: Vocabulary sections, thematic word groups
    - Not appropriate for: Introduction or conclusion sections

    4. Mnemonic:
    - Purpose: Provides memory aids for difficult vocabulary or grammar concepts
    - Use in: Vocabulary sections, grammar rules that are challenging to remember
    - Not appropriate for: Basic vocabulary or simple concepts

    5. TipBox:
    - Purpose: Highlights important tips, exceptions, or cultural notes
    - Use in: Any section where additional guidance would be helpful
    - Especially useful for: Grammar exceptions, cultural context, pronunciation tips

    6. VoiceRecorder:
    - Purpose: Allows learners to record themselves and compare with native pronunciation
    - Use in: Pronunciation practice, speaking exercises, dialogue practice
    - Not appropriate for: Grammar explanation sections or cultural notes

    7. WordBuilder:
    - Purpose: Interactive exercise to practice forming words
    - Use in: Vocabulary practice sections, word formation exercises
    - Not appropriate for: Introduction sections or cultural notes

    8. HighlightableText:
    - Purpose: Highlights text for emphasis or attention
    - Use in: Any section where an example needs to be highlighted
    - Not appropriate for: Introduction sections or cultural notes

    9. ConversationBox:
    - Purpose: Displays a conversation between two people to present a scenario
    - Use in: Any section where a conversation needs to be presented
    - Not appropriate for: Introduction sections or cultural notes

    10. AudioExercise:
    - Purpose: Provides practice with audio exercises
    - Use in: Any section where audio exercises are needed
    - Not appropriate for: Introduction sections or cultural notes

    SECTION PLANNING GUIDELINES:
    1. Introduction Section:
    - Should provide an overview of what will be learned
    - Appropriate components: TipBox
    - Should NOT include: SentenceBreakdown, VoiceRecorder, WordBuilder, Quiz

    2. Vocabulary Sections:
    - Should include new words related to the lesson theme
    - Appropriate components: VocabularyTable, TextToSpeechPlayer, Mnemonic, AudioExercise, ConversationBox
    - May include: TipBox for usage notes

    3. Grammar Sections:
    - Should explain grammatical concepts with examples
    - Appropriate components: SentenceBreakdown, TipBox, TextToSpeechPlayer, AudioExercise, ConversationBox
    - May include: Mnemonic for complex rules

    4. Practice Sections:
    - Should provide opportunities to apply new knowledge
    - Appropriate components: VoiceRecorder, WordBuilder, Quiz
    - Should include: TextToSpeechPlayer for models

    5. Cultural Notes:
    - Should provide cultural context relevant to the language
    - Appropriate components: TipBox, TextToSpeechPlayer for examples
    - Should NOT include: SentenceBreakdown, WordBuilder

    Input:

    The input will be a JSON object containing the following fields:

    name: The name of the lesson.
    lesson_number: The lesson's number.
    description: A brief description of the lesson.
    goals: An array of strings representing the learning goals of the lesson (e.g., "Fundamentals", "Vocabulary").

    Output Format:

    The output must be a valid JSON object with the following structure:

    {
        "title": "Lesson Title",
        "lesson_number": 1,
        "description": "Lesson Description",
        "sections": [
            {
                "title": "Section Title",
                "about": "Section Description",
                "components": ["Component1", "Component2"],
                "elements": ["Element1", "Element2"]
            },
            ...
        ],
        "vocabulary": {
            "words": ["word1", "word2", ...],
            "properties": ["translation", "exampleSentence", "exampleTranslation", "gender"]
        }
    }

    Detailed Instructions:

    title: Create the lesson title by prepending "Lesson [lesson_number]: " to the name field from the input.

    description: Use the description field from the input directly.

    sections:

    Create an "Introduction" section with a generic welcome message in the about field. This section should have empty components and elements arrays.

    Based on the goals array in the input, create between 3 and 5 additional sections. Each section should have:

    title: A descriptive title for the section, this should be in $sourceLanguageName.

    about: A brief explanation of the section's content, this should be in $sourceLanguageName.

    components: An array of strings representing relevant components (see "Components" below). Choose components that are appropriate for the section's content.

    elements: An array of strings representing interactive elements (see "Elements" below).

    vocabulary: This is the most crucial part. There is only one vocabulary object in the lesson. The vocabulary must be an object with exactly two keys:

    words: An array of strings. These strings should be the vocabulary words themselves (e.g., "hola", "adiós"). Do not create objects for each word. Just list the words as strings. Provide words and not single letters. (Words should be at least 2 characters long).

    properties: An array of strings representing the names of the properties that will be associated with each word in a separate data structure (which is not part of this JSON output). This array should always be: ["translation", "exampleSentence", "exampleTranslation", "gender"]. Do not include the actual translations, example sentences, etc., in this JSON.

    Components:

    Use the following components where appropriate within the sections:

    TextToSpeechPlayer: For audio examples.
    TipBox: For important notes or tips.
    Mnemonic: For memory aids.
    VoiceRecorder: For pronunciation practice.
    SentenceBreakdown: For analyzing complex sentences.
    HighlightableText: To highlight key words or phrases.
    WordBuilder: For vocabulary practice (unscrambling letters).
    ConversationBox: For presenting a conversation scenario.
    AudioExercise: For audio exercises.

    Elements:

    Use the following elements where appropriate within the sections:

    table
    list

    Strict Rules:

    1. The output MUST be valid, well-formatted JSON.
    2. The vocabulary.words array MUST contain only strings (the words themselves), NOT objects.
    3. The vocabulary.properties must be exactly ["translation", "exampleSentence", "exampleTranslation", "gender"]
    4. Adhere to all structural requirements outlined above.

    Now, using the following input, generate the corresponding JSON lesson:


    PROMPT;
    }

    /**
     * Create a prompt for generating the audio JSON
     *
     * @param string $mdxContent The MDX content to generate audio for
     * @param string $targetLanguage The target language code
     * @param int $lessonNumber The lesson number
     * @return string The prompt for generating the audio JSON
     */
    protected function createAudioJsonPrompt(string $mdxContent, string $targetLanguage, int $lessonNumber = 1): string
    {
        return <<<PROMPT
        You are going to generate a json string, this is going to have two properties, text and audio_file_name.
        The text is going to be the text from the examples of the lesson, the audio_file_name is going to be the name of the file name. I will show you an example:
        If the input is the following:
        ## Section 1: The Tricky 'J' Sound
        The letter 'j' in Spanish is pronounced like the 'h' in "hot" in English but stronger and comes from deep in the throat. It's a guttural sound that is distinct in words like "jirafa" (giraffe).
        Practice words:

        | Word   | Pronunciation |
        | ------ | ------------- |
        | Jirafa | hee-rah-fah   |
        | Jugo   | hoo-goh       |
        | Joven  | hoh-vehn      |
        | Jardín | hahr-deen     |
        | Caja   | kah-hah       |

        <Mnemonic title={{Mnemonic}} content={{Think of the sound you make when you're trying to fog up a mirror with your breath but make it harsher.}} />

        <TextToSpeechPlayer mp3File={{/src/assets/courses/spanish/_shared/lessons/lesson2/audio/tricky-j.mp3}} />

        The output should be the following:

        {{
            'text': 'Jirafa ... Jugo ... Joven ... Jardín ... Caja',
            'audio_file_name': 'tricky-j.mp3'
        }}

        Another example, if the input is the following:
        ## Section 3: Pronouns

        Pronouns replace nouns and are used frequently in everyday conversation. They must match the gender and number of the noun they replace.

        ### Subject Pronouns

        | Pronoun (English) | Pronoun (Spanish) | Example Sentence                        |
        | ----------------- | ----------------- | --------------------------------------- |
        | I                 | Yo                | Yo soy estudiante.                      |
        | You (informal)    | Tú                | ¿Tú eres el profesor?                   |
        | He/She/           | Él/Ella           | Él es mi hermano. Ella es mi hermana.   |
        | You formal        | Usted             | ¿Cómo está usted?                       |
        | You plural        | Ustedes           | Ustedes son amables.                    |
        | We                | Nosotros/Nosotras | Nosotros estudiamos español.            |
        | They              | Ellos/Ellas       | Ellos hablan español. Ellas también.    |
        | It                | Eso/Esa           | Eso es interesante. Esa casa es bonita. |

        <TextToSpeechPlayer mp3File={{/src/assets/courses/spanish/_shared/lessons/lesson5/audio/subject-pronouns.mp3}} />

        The output should be the following:

        {{
            'text': 'Yo soy estudiante ... ¿Tú eres el profesor? ... Él es mi hermano. Ella es mi hermana ... ¿Cómo está usted? ... Ustedes son amables ... Nosotros estudiamos español ... Ellos hablan español. Ellas también ... Eso es interesante. Esa casa es bonita',
            'audio_file_name': 'subject-pronouns.mp3'
        }}

        Notice that the text property contains the text of the concepts the learner needs to understand concatenated with ' ... ' in between to separate the examples.
        Notice that the text property does not contain any extra text like headings or explanations.
        Notice that the text property containts only and excluselively text or phrases in spanish.
        For each TextToSpeechPlayer, there should be one object with two keys:
        - text: the text to speak
        - audio_file_name: the name of the audio file
        VERY IMPORTANT: If there are 6 TextToSpeechPlayer there should be exactly 6 objects in the output. If there are 8 TextToSpeechPlayer there should be exactly 8 objects in the output. If there are 3 TextToSpeechPlayer there should be exactly 3 objects in the output. If there are 1 TextToSpeechPlayer there should be exactly 1 object in the output. If there are 0 TextToSpeechPlayer there should be exactly 0 objects in the output. If there are 10 TextToSpeechPlayer there should be exactly 10 objects in the output. If there are 5 TextToSpeechPlayer there should be exactly 5 objects in the output. If there are 2 TextToSpeechPlayer there should be exactly 2 objects in the output. If there are 4 TextToSpeechPlayer there should be exactly 4 objects in the output. If there are 7 TextToSpeechPlayer there should be exactly 7 objects in the output. If there are 9 TextToSpeechPlayer there should be exactly 9 objects in the output. If there are 11 TextToSpeechPlayer there should be exactly 11 objects in the output. If there are 12 TextToSpeechPlayer there should be exactly 12 objects in the output. If there are 13 TextToSpeechPlayer there should be exactly 13 objects in the output. If there are 14 TextToSpeechPlayer there should be exactly 14 objects in the output. If there are 15 TextToSpeechPlayer there should be exactly 15 objects in the output. If there are 16 TextToSpeechPlayer there should be exactly 16 objects in the output. If there are 17 TextToSpeechPlayer there should be exactly 17 objects in the output. If there are 18 TextToSpeechPlayer there should be exactly 18 objects in the output. If there are 19 TextToSpeechPlayer there should be exactly 19 objects in the output. If there are 20 TextToSpeechPlayer there should be exactly 20 objects in the output. If there are 21 TextToSpeechPlayer there should be exactly 21 objects in the output. If there are 22 TextToSpeechPlayer there should be exactly 22 objects in the output. If there are 23 TextToSpeechPlayer there should be exactly 23 objects in the output. If there are 24 TextToSpeechPlayer there should be exactly 24 objects in the output. If there are 25 TextToSpeechPlayer there should be exactly 25 objects in the output.
        The text should reflext the example given and should not be repeated.
        If the example is only one word then the text should be only that word.

        Generate the json for this section based on the following content:
        $mdxContent
        Generate the json string and only the json string in json format.
        Do not include text about what you did, your thought process or any other messages,
        just the generated string in json format.
        PROMPT;
    }

    /**
     * Get the country code for a language code
     *
     * @param string $languageCode The language code
     * @return string The country code
     */
    protected function getCountryCode(string $languageCode): string
    {
        $countryCodes = [
            'en' => 'US',
            'es' => 'ES',
            'fr' => 'FR',
            'de' => 'DE',
            'it' => 'IT',
            'pt' => 'PT',
            'nl' => 'NL',
            'ru' => 'RU',
            'ja' => 'JP',
            'zh' => 'CN',
            'ar' => 'SA',
            'hi' => 'IN',
            'ko' => 'KR',
            'tr' => 'TR',
            'pl' => 'PL',
            'vi' => 'VN',
            'th' => 'TH',
            'id' => 'ID',
            'ms' => 'MY',
            'fa' => 'IR',
        ];

        return $countryCodes[$languageCode] ?? strtoupper($languageCode);
    }

    /**
     * Clean a JSON response from AI to ensure it's valid JSON
     *
     * @param string $response The response from AI
     * @return string Cleaned JSON
     */
    protected function cleanJsonResponse(string $response): string
    {
        // Remove markdown code blocks if present
        $response = preg_replace('/```json\s*/', '', $response);
        $response = preg_replace('/```\s*$/', '', $response);

        // Remove any other markdown formatting
        $response = preg_replace('/```/', '', $response);

        // Trim whitespace
        $response = trim($response);

        // If the response doesn't start with { or [, try to find the JSON
        if (!preg_match('/^\s*[{\[]/', $response)) {
            // Look for the first { or [ in the response
            if (preg_match('/\s*([{\[].*)$/s', $response, $matches)) {
                $response = $matches[1];
            }
        }

        return $response;
    }

    /**
     * Get the full language name from a language code
     *
     * @param string $code The language code (e.g., 'en', 'es')
     * @return string The language name
     */
    protected function getLanguageName(string $code): string
    {
        $languages = [
            'en' => 'English',
            'es' => 'Spanish',
            'de' => 'German',
            'fr' => 'French',
            'it' => 'Italian',
            'pt' => 'Portuguese',
            'ru' => 'Russian',
            'zh' => 'Chinese',
            'ja' => 'Japanese',
            'ko' => 'Korean',
        ];

        return $languages[$code] ?? $code;
    }
}
