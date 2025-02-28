<?php

namespace App\Services\AI;

use Exception;
use GuzzleHttp\Client;

class GoogleGeminiService implements AIServiceInterface
{
    protected $client;
    protected $apiKey;
    protected $model;

    public function __construct()
    {
        $this->apiKey = env('GOOGLE_GEMINI_API_KEY');
        $this->model = env('GOOGLE_GEMINI_MODEL', 'gemini-pro');
        
        if (!$this->apiKey) {
            throw new Exception('Google Gemini API key is not set in .env file');
        }

        $this->client = new Client([
            'base_uri' => 'https://generativelanguage.googleapis.com/v1beta/',
            'headers' => [
                'Content-Type' => 'application/json',
            ],
        ]);
    }

    public function generateContent(string $prompt, array $options = []): string
    {
        $model = $options['model'] ?? $this->model;
        $temperature = $options['temperature'] ?? 0.7;
        $maxTokens = $options['max_tokens'] ?? 2000;

        try {
            $response = $this->client->post("models/{$model}:generateContent", [
                'query' => [
                    'key' => $this->apiKey,
                ],
                'json' => [
                    'contents' => [
                        ['parts' => [['text' => $prompt]]]
                    ],
                    'generationConfig' => [
                        'temperature' => $temperature,
                        'maxOutputTokens' => $maxTokens,
                    ]
                ]
            ]);

            $body = json_decode($response->getBody(), true);
            return $body['candidates'][0]['content']['parts'][0]['text'] ?? '';
        } catch (Exception $e) {
            throw new Exception('Error generating content with Google Gemini: ' . $e->getMessage());
        }
    }
}
