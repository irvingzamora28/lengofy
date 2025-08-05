<?php

namespace App\Services\LessonGenerator\Prompts;

/**
 * Prompts for audio JSON generation (Stage 3)
 * 
 * This class contains prompts used for generating the audio JSON file
 * that will be used to generate audio examples for the lesson.
 */
class AudioPrompts
{
    /**
     * Create a prompt for generating audio JSON
     * 
     * @param string $mdxContent The MDX content to generate audio for
     * @param string $targetLanguageName The name of the target language
     * @param int $lessonNumber The lesson number
     * @return string The complete prompt for audio JSON generation
     */
    public static function createAudioJsonPrompt(string $mdxContent, string $targetLanguageName, int $lessonNumber = 1): string
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
}
