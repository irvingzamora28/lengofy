<?php

namespace App\Services\AI;

interface AIServiceInterface
{
    /**
     * Generate content using AI
     *
     * @param string $prompt The prompt to send to the AI service
     * @param array $options Additional options for the AI service
     * @return string The generated content
     */
    public function generateContent(string $prompt, array $options = []): string;
}
