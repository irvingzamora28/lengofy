<?php

namespace App\Services\AI;

use Exception;
use GuzzleHttp\Client;

class AnthropicService implements AIServiceInterface
{
    protected $client;
    protected $apiKey;
    protected $model;

    public function __construct()
    {
        $this->apiKey = env('ANTHROPIC_API_KEY');
        $this->model = env('ANTHROPIC_MODEL', 'claude-3-opus-20240229');
        
        if (!$this->apiKey) {
            throw new Exception('Anthropic API key is not set in .env file');
        }

        $this->client = new Client([
            'base_uri' => 'https://api.anthropic.com/v1/',
            'headers' => [
                'x-api-key' => $this->apiKey,
                'anthropic-version' => '2023-06-01',
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
            $response = $this->client->post('messages', [
                'json' => [
                    'model' => $model,
                    'messages' => [
                        ['role' => 'user', 'content' => $prompt]
                    ],
                    'temperature' => $temperature,
                    'max_tokens' => $maxTokens,
                ]
            ]);

            $body = json_decode($response->getBody(), true);
            return $body['content'][0]['text'] ?? '';
        } catch (Exception $e) {
            throw new Exception('Error generating content with Anthropic: ' . $e->getMessage());
        }
    }
}
