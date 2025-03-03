<?php

namespace App\Services\AI;

use Exception;
use GuzzleHttp\Client;

class OpenAIService implements AIServiceInterface
{
    protected $client;
    protected $apiKey;
    protected $model;

    public function __construct()
    {
        $this->apiKey = env('OPENAI_API_KEY');
        $this->model = env('OPENAI_MODEL', 'gpt-4');
        
        if (!$this->apiKey) {
            throw new Exception('OpenAI API key is not set in .env file');
        }

        $this->client = new Client([
            'base_uri' => 'https://api.openai.com/v1/',
            'headers' => [
                'Authorization' => 'Bearer ' . $this->apiKey,
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
            $response = $this->client->post('chat/completions', [
                'json' => [
                    'model' => $model,
                    'messages' => [
                        ['role' => 'system', 'content' => 'You are a helpful assistant that creates educational content.'],
                        ['role' => 'user', 'content' => $prompt]
                    ],
                    'temperature' => $temperature,
                    'max_tokens' => $maxTokens,
                ]
            ]);

            $body = json_decode($response->getBody(), true);
            $content = $body['choices'][0]['message']['content'] ?? '';
            
            if (empty($content)) {
                throw new Exception('Empty response from OpenAI API');
            }
            
            return $content;
        } catch (\GuzzleHttp\Exception\RequestException $e) {
            $responseBody = $e->hasResponse() ? $e->getResponse()->getBody()->getContents() : 'No response body';
            throw new Exception('Error generating content with OpenAI: ' . $e->getMessage() . '. Response: ' . $responseBody);
        } catch (Exception $e) {
            throw new Exception('Error generating content with OpenAI: ' . $e->getMessage());
        }
    }
}
