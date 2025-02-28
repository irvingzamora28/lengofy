<?php

namespace App\Services\AI;

use Exception;

class AIServiceFactory
{
    /**
     * Create an AI service based on the provider name
     *
     * @param string $provider The name of the AI provider (openai, anthropic, google)
     * @return AIServiceInterface The AI service
     * @throws Exception If the provider is not supported
     */
    public static function create(string $provider): AIServiceInterface
    {
        switch (strtolower($provider)) {
            case 'openai':
                return new OpenAIService();
            case 'anthropic':
                return new AnthropicService();
            case 'google':
                return new GoogleGeminiService();
            default:
                throw new Exception("Unsupported AI provider: $provider");
        }
    }
}
