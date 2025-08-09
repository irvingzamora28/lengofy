<?php

namespace App\Services\LessonGenerator\Prompts;

/**
 * Component definitions for lesson generation
 *
 * This class contains all component definitions used across different stages of lesson generation:
 * 1. Lesson structure generation
 * 2. Section content generation
 * 3. Audio JSON generation
 */
class ComponentDefinitions
{
    /**
     * Get component definition for TextToSpeechPlayer
     *
     * @return string Component definition
     */
    public static function getTextToSpeechPlayerDefinition(): string
    {
        return <<<PROMPT
TextToSpeechPlayer: An audio playback component that allows learners to listen to pronunciation examples.

Purpose:
- Provides audio pronunciation of words, phrases, or sentences
- Offers both standard and mini player options for different contexts
- Enhances learning through auditory examples

Not appropriate for:
- Cultural notes or grammar explanations without examples

Format Options:
1. Standard Player:
   <TextToSpeechPlayer mp3File="../../assets/courses/es-en/_shared/lessons/lesson1/audio/hello.mp3" />

2. Mini Player (for single words):
   <TextToSpeechPlayer mp3File="../../assets/courses/es-en/_shared/lessons/lesson1/audio/hello.mp3" miniPlayer={true} />

Parameters:
- mp3File: Path to the audio file (required)
- miniPlayer: Boolean to display a compact version (optional, default: false)
- text: Text content for the audio (optional)
- displayText: Whether to display the text (optional, default: false)
- autoplay: Whether to play automatically (optional, default: false)

Usage Guidelines:
- Insert directly where audio examples are needed without additional titles
- For single words, use the miniPlayer option and place inside a table
- Use relative paths following the pattern: ../../assets/courses/[source]-[target]/_shared/lessons/lesson[number]/audio/[filename].mp3
- Always ensure the audio file exists and matches the content being taught
PROMPT;
    }

    /**
     * Get component definition for VocabularyTable
     *
     * @return string Component definition
     */
    public static function getVocabularyTableDefinition(): string
    {
        return <<<PROMPT
VocabularyTable: A structured markdown table for presenting vocabulary, grammar patterns, or language comparisons.

Purpose:
- Organizes related vocabulary or grammar concepts in a clear, tabular format
- Provides direct comparisons between languages or grammatical forms
- Presents examples alongside definitions for better understanding

Not appropriate for:
- Long explanations or paragraphs of text
- Content that requires interactive elements
- Introduction or conclusion sections

Format:
### [Table Title]

| Column 1 Header | Column 2 Header | Column 3 Header | Example Sentence      |
| --------------- | -------------- | -------------- | --------------------- |
| Row 1 Item 1    | Row 1 Item 2   | Row 1 Item 3   | Example for row 1     |
| Row 2 Item 1    | Row 2 Item 2   | Row 2 Item 3   | Example for row 2     |

Usage Guidelines:
- Always include a clear header row with column descriptions
- Use a descriptive title (H3 level) above the table
- Keep table rows concise - aim for 3-7 rows for readability
- Include example sentences or usage contexts when possible
- For language comparisons, maintain consistent order (native language → target language)
- Use for presenting articles, pronouns, verb conjugations, or thematic vocabulary groups
- Tables should be followed by explanatory text to reinforce the concepts presented
PROMPT;
    }

    /**
     * Get component definition for TipBox
     *
     * @return string Component definition
     */
    public static function getTipBoxDefinition(): string
    {
        return <<<PROMPT
TipBox: A visually distinct component for highlighting important tips, hints, or notes within the lesson content.

Purpose:
- Emphasizes key learning points or helpful suggestions
- Draws attention to important information that enhances learning
- Provides additional context or shortcuts for language learning

Format:
<TipBox>
  In Spanish, adjectives typically come after the noun they modify, unlike in English where they come before.
  For example: "the red car" becomes "el coche rojo".
</TipBox>

Parameters:
- children: The content of the tip (required) - can include text, lists, or other inline elements

Usage Guidelines:
- Use for grammar rules, pronunciation tips, cultural notes, or learning strategies
- Keep content concise and directly relevant to the surrounding lesson material
- The component automatically adds a "Pro Tip" heading - do not add your own title
- Can contain multiple paragraphs or bullet points for complex tips
- Place within the natural flow of content where the tip is most relevant
PROMPT;
    }

    /**
     * Get component definition for Mnemonic
     *
     * @return string Component definition
     */
    public static function getMnemonicDefinition(): string
    {
        return <<<PROMPT
Mnemonic: An interactive component that provides memory aids to help learners remember vocabulary, grammar rules, or concepts.

Purpose:
- Creates memorable associations to reinforce learning
- Provides mental shortcuts for recalling complex information
- Presents memory techniques in an expandable, interactive format

Not appropriate for:
- Basic vocabulary or simple concepts

Format:
<Mnemonic title="Remember 'ser' vs 'estar'" content="For 'ser', think DOCTOR: Description, Occupation, Characteristic, Time, Origin, Relationship. For 'estar', think PLACE: Position, Location, Action, Condition, Emotion." />

Parameters:
- title: Short, descriptive title for the mnemonic (required)
- content: The memory aid or technique explanation (required)

Usage Guidelines:
- Place directly where the mnemonic is most relevant to the lesson content
- Keep titles concise (3-6 words) and clearly related to the concept
- Create mnemonics that are genuinely helpful, not forced or overly complex
- Use for challenging grammar rules, vocabulary groups, or pronunciation patterns
- The component displays as a collapsible button that expands to show the content
PROMPT;
    }

    /**
     * Get component definition for HighlightableText
     *
     * @return string Component definition
     */
    public static function getHighlightableTextDefinition(): string
    {
        return <<<PROMPT
HighlightableText: An interactive component that highlights specific words or phrases in a sentence and displays additional information when clicked.

Purpose:
- Makes vocabulary learning interactive by providing contextual explanations
- Helps learners understand grammar points within authentic sentences
- Provides pronunciation guidance, translations, or usage notes for specific terms

Not appropriate for:
- Introduction sections or cultural notes

Format:
<HighlightableText highlights='[{"word":"Guten","info":"Means \"good\" in the accusative case. Pronounced: GOO-ten."},
{"word":"Morgen","info":"Means \"morning\". Pronounced: MOR-gen."}]'>
  Guten Morgen, wie geht es dir?
</HighlightableText>

Parameters:
- children: The complete sentence or phrase containing the words to highlight (required)
- highlights: JSON array of objects with the following properties (required):
  * word: The exact word to highlight (must match exactly as it appears in the text)
  * info: The explanation, translation, or note to display when clicked

Usage Guidelines:
- Only use within complete sentences, not for single words or lists
- Ensure highlighted words appear exactly as written in the text (case-sensitive)
- Keep explanations concise and focused on the most relevant information
- Use for introducing new vocabulary, explaining grammar points, or noting pronunciation
- The component displays as an "Interactive Text" section with clickable highlighted words
- Avoid using insde the component asterisks
PROMPT;
    }

    /**
     * Get component definition for SentenceBreakdown
     *
     * @return string Component definition
     */
    public static function getSentenceBreakdownDefinition(): string
    {
        return <<<PROMPT
SentenceBreakdown: An interactive component that breaks down complex sentences into smaller parts with detailed explanations.

Purpose:
- Teaches sentence structure and grammar in an interactive way
- Allows learners to focus on individual parts of a sentence
- Provides step-by-step explanations of sentence construction

Not appropriate for:
- Introduction sections or cultural notes

Format:
<SentenceBreakdown sentence="Ich möchte einen Kaffee trinken.">
  <Part part="Ich" explanation="Subject pronoun meaning 'I'" />
  <Part part="möchte" explanation="Conjugated form of 'mögen' (to like/want) in the first person" />
  <Part part="einen Kaffee" explanation="Direct object: 'a coffee' in accusative case" />
  <Part part="trinken" explanation="Infinitive verb 'to drink' at the end of the sentence" />
</SentenceBreakdown>

Parameters:
- sentence: The complete sentence to analyze (required)
- Part components as children, each with:
  - part: The specific word or phrase segment (required)
  - explanation: The grammatical explanation for that segment (required)

Usage Tips:
- Break sentences into logical grammatical units (3-7 parts recommended)
- Provide clear, concise explanations for each part
- Use for teaching complex grammar structures, word order, or case systems
- Include examples that demonstrate key grammatical concepts from the lesson
PROMPT;
    }

    /**
     * Get component definition for VoiceRecorder
     *
     * @return string Component definition
     */
    public static function getVoiceRecorderDefinition(): string
    {
        return <<<PROMPT
VoiceRecorder: An interactive pronunciation practice component that allows learners to record their voice, compare it with native audio, and receive feedback.

Purpose:
- Provides active speaking practice with immediate feedback
- Allows comparison between learner's pronunciation and native speaker examples
- Develops confidence in speaking through guided practice

Not appropriate for:
- Grammar explanation sections or cultural notes

Format:
<VoiceRecorder
  text="¿Cómo estás?"
  nativeAudio="../../assets/courses/es-en/_shared/lessons/lesson1/audio/como_estas.mp3"
  language="es-ES"
/>

Parameters:
- text: The phrase or sentence to practice pronouncing (required)
- nativeAudio: Path to the audio file with native speaker pronunciation (required)
- language: Language code for speech recognition (required, e.g., "es-ES" for Spanish, "de-DE" for German)

Usage Guidelines:
- Use for key phrases, challenging pronunciation, or important vocabulary
- Ensure the native audio file exists and matches the text exactly
- Choose phrases that are 1-10 words long for optimal practice
- Use the appropriate language code that matches the target language
- The component provides waveform visualization, pitch analysis, and accuracy feedback
- Place in contexts where speaking practice is most beneficial for the learner
PROMPT;
    }

    /**
     * Get component definition for WordBuilder
     *
     * @return string Component definition
     */
    public static function getWordBuilderDefinition(): string
    {
        return <<<PROMPT
WordBuilder: An interactive vocabulary practice component that presents scrambled letters for learners to reconstruct into the correct word.

Purpose:
- Reinforces vocabulary recognition and spelling
- Provides immediate feedback on word construction attempts
- Engages learners through interactive drag-and-drop or click functionality

Not appropriate for:
- Introduction sections or cultural notes

Format:
<WordBuilder targetWord="palabra" nativeWord="word" />

Parameters:
- targetWord: The word in the target language to be unscrambled (required)
- nativeWord: The translation in the learner's native language (required)

Usage Tips:
- Use for introducing new vocabulary or reinforcing recently learned words
- Best for words between 3-10 letters in length
- Include a mix of difficulty levels throughout the lesson
PROMPT;
    }

    /**
     * Get component definition for ConversationBox
     *
     * @return string Component definition
     */
    public static function getConversationBoxDefinition(): string
    {
        return <<<PROMPT
ConversationBox: A component for presenting interactive dialogues and conversations with synchronized audio playback.

Purpose:
- Displays structured conversations between multiple speakers
- Provides sequential audio playback of all dialogue lines
- Highlights the current line being spoken during playback

Not appropriate for:
- Introduction sections or cultural notes

Format:
<ConversationBox title="At the Restaurant">
  <DialogueLine speaker="Waiter" audio="path/to/audio.mp3" text="¿Puedo tomar su orden?" translation="Can I take your order?"></DialogueLine>
  <DialogueLine speaker="Customer" audio="path/to/audio2.mp3" text="Sí, quisiera una ensalada por favor." translation="Yes, I would like a salad, please."></DialogueLine>
  <!-- Additional dialogue lines -->
</ConversationBox>

Parameters:
- title: Optional title for the conversation (defaults to "Conversation Practice")

Nested Components:
- Must contain DialogueLine components as children
- Each DialogueLine represents one turn in the conversation

Usage Tips:
- Create realistic, contextual dialogues relevant to the lesson topic
- Include 3-8 dialogue exchanges for optimal learning
- Ensure audio files match the text content exactly
PROMPT;
    }

    /**
     * Get component definition for AudioExercise
     *
     * @return string Component definition
     */
    public static function getAudioExerciseDefinition(): string
    {
        return <<<PROMPT
AudioExercise: A container component that organizes audio practice elements in a responsive grid layout.

Purpose:
- Groups related audio items with playable audio clips
- Creates a visually distinct section for audio-focused vocabulary or phrases
- Organizes AudioItem components in a responsive grid layout

Not appropriate for:
- Introduction sections or cultural notes

Format:
<AudioExercise title="Common Greetings">
  <AudioItem audio="../../assets/courses/es-en/_shared/lessons/lesson2/audio/good_morning.mp3" text="Good morning" />
  <AudioItem audio="../../assets/courses/es-en/_shared/lessons/lesson2/audio/good_afternoon.mp3" text="Good afternoon" />
  <AudioItem audio="../../assets/courses/es-en/_shared/lessons/lesson2/audio/good_evening.mp3" text="Good evening" />
  <AudioItem audio="../../assets/courses/es-en/_shared/lessons/lesson2/audio/good_night.mp3" text="Good night" />
</AudioExercise>

Parameters:
- title: Optional title for the exercise section (defaults to "Audio Practice")
- children: Must be AudioItem components (not TextToSpeechPlayer)

Nested Components:
- AudioItem: Each item requires:
  - audio: Path to the audio file (required)
  - text: The text displayed next to the play button (required)

Usage Tips:
- Group related audio examples that share a common theme (greetings, numbers, etc.)
- Use for vocabulary lists, common phrases, or pronunciation examples
- Include 3-8 AudioItem components for optimal learning without overwhelming
- Ensure audio paths follow the correct relative path pattern
PROMPT;
    }

    /**
     * Get component definitions for a specific list of components
     *
     * @param array $componentNames Array of component names to include
     * @return string Combined component definitions
     */
    public static function getComponentDefinitions(array $componentNames): string
    {
        $definitions = [];
        $componentMap = [
            'TextToSpeechPlayer' => 'getTextToSpeechPlayerDefinition',
            'TipBox' => 'getTipBoxDefinition',
            'Mnemonic' => 'getMnemonicDefinition',
            'HighlightableText' => 'getHighlightableTextDefinition',
            'SentenceBreakdown' => 'getSentenceBreakdownDefinition',
            'VoiceRecorder' => 'getVoiceRecorderDefinition',
            'WordBuilder' => 'getWordBuilderDefinition',
            'ConversationBox' => 'getConversationBoxDefinition',
            'AudioExercise' => 'getAudioExerciseDefinition',
            'VocabularyTable' => 'getVocabularyTableDefinition'
        ];

        foreach ($componentNames as $component) {
            if (isset($componentMap[$component])) {
                $method = $componentMap[$component];
                $definitions[] = self::$method();
            }
        }

        return !empty($definitions) ? implode("\n\n", $definitions) : '';
    }

    /**
     * Get component summary for structure planning
     *
     * @param string $componentName Name of the component
     * @return string Summary of the component for structure planning
     */
    private static function getComponentSummary(string $componentName): string
    {
        $methodName = 'get' . $componentName . 'Definition';
        if (!method_exists(self::class, $methodName)) {
            return '';
        }

        $fullDefinition = self::$methodName();

        // Extract the first line (component name and brief description)
        preg_match('/^(.*?)\n/s', $fullDefinition, $titleMatches);
        $title = $titleMatches[1] ?? '';

        // Extract the Purpose section
        preg_match('/Purpose:\n([^\n]*(?:\n[^\n]*)*?)\n\n/s', $fullDefinition, $purposeMatches);
        $purpose = $purposeMatches[1] ?? '';

        // Extract the Not appropriate for section if it exists
        preg_match('/Not appropriate for:\n([^\n]*(?:\n[^\n]*)*?)\n\n/s', $fullDefinition, $notAppropriateMatches);
        $notAppropriate = $notAppropriateMatches[1] ?? '';

        $summary = $title . "\n\n";
        if ($purpose) {
            $summary .= "Purpose:\n" . $purpose . "\n\n";
        }
        if ($notAppropriate) {
            $summary .= "Not appropriate for:\n" . $notAppropriate . "\n";
        }

        return $summary;
    }

    /**
     * Get comprehensive component descriptions for lesson structure generation
     *
     * @return string Complete component descriptions for structure planning
     */
    public static function getStructureComponentDescriptions(): string
    {
        $components = [
            'TextToSpeechPlayer',
            'SentenceBreakdown',
            'VocabularyTable',
            'Mnemonic',
            'TipBox',
            'VoiceRecorder',
            'WordBuilder',
            'HighlightableText',
            'ConversationBox',
            'AudioExercise'
        ];

        $componentDescriptions = [];
        foreach ($components as $index => $component) {
            $number = $index + 1;
            $summary = self::getComponentSummary($component);
            if ($summary) {
                $componentDescriptions[] = "$number. $summary";
            }
        }

        return "COMPONENTS GUIDE:\nHere are the available components and when to use them:\n\n" .
               implode("\n", $componentDescriptions);
    }

    /**
     * Get section planning guidelines for lesson structure generation
     *
     * @return string Section planning guidelines
     */
    public static function getSectionPlanningGuidelines(): string
    {
        return <<<PROMPT
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
PROMPT;
    }

    /**
     * Get detailed component implementation instructions for content generation
     *
     * @param array $componentNames Array of component names to include
     * @return string Detailed component implementation instructions
     */
    public static function getDetailedComponentInstructions(array $componentNames = []): string
    {
        // If no specific components are requested, include all components
        if (empty($componentNames)) {
            $componentNames = [
                'TextToSpeechPlayer',
                'TipBox',
                'Mnemonic',
                'HighlightableText',
                'SentenceBreakdown',
                'VoiceRecorder',
                'WordBuilder',
                'ConversationBox',
                'AudioExercise'
            ];
        }

        $componentDefinitions = self::getComponentDefinitions($componentNames);

        return <<<PROMPT
You are creating an MDX-JSX file for educational purposes. Make sure to use the JSX components naturally and correctly within the educational content:

$componentDefinitions

An example of a section that uses JSX components correctly is the following:

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

<AudioExercise title="Common Greetings">
  <AudioItem audio="../../assets/courses/es-en/_shared/lessons/lesson2/audio/good_morning.mp3" text="Good morning" />
  <AudioItem audio="../../assets/courses/es-en/_shared/lessons/lesson2/audio/good_afternoon.mp3" text="Good afternoon" />
  <AudioItem audio="../../assets/courses/es-en/_shared/lessons/lesson2/audio/good_evening.mp3" text="Good evening" />
  <AudioItem audio="../../assets/courses/es-en/_shared/lessons/lesson2/audio/good_night.mp3" text="Good night" />
</AudioExercise>

___

IMPORTANT: Each component MUST be used correctly into the content, appropriately and naturally. Avoid misuse or incorrect parameterization of these components These are the only JSX componets that exist so avoid using any other components.
PROMPT;
    }

    /**
     * Get MDX element instructions for content generation
     *
     * @return string MDX element instructions
     */
    public static function getMdxElementInstructions(): string
    {
        return <<<PROMPT
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
    }


    /**
     * Get content additional instructions for content generation
     *
     * @return string Content additional instructions
     */
    public static function getContentAdditionalInstructions(): string
    {
        return <<<PROMPT
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
    }

    /**
     * Get TextToSpeechPlayer component instructions for audio generation
     *
     * @return string TextToSpeechPlayer component instructions
     */
    public static function getTextToSpeechPlayerInstructions(): string
    {
        // Reuse the existing TextToSpeechPlayer definition and add audio-specific instructions
        $baseDefinition = self::getTextToSpeechPlayerDefinition();

        return <<<PROMPT
$baseDefinition

The TextToSpeechPlayer component is used to generate audio files for the lesson. Each TextToSpeechPlayer component in the MDX file will correspond to an entry in the audio JSON file.
PROMPT;
    }
}
