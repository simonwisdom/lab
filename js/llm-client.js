/**
 * A unified client for interacting with LLMs through OpenRouter
 */

/**
 * @typedef {Object} ProviderConfig
 * @property {boolean} [useOwnKey=false] - Whether to use the user's API key
 * @property {string} [apiKey=''] - OpenRouter API key
 * @property {string} [model='anthropic/claude-3-opus'] - Model identifier including provider prefix
 * @property {number} [temperature=0.7] - Temperature for response generation
 * @property {number} [maxTokens=1000] - Maximum tokens for response
 */

const DEFAULT_MODELS = {
    CLAUDE_SONNET: 'anthropic/claude-3.5-sonnet',
    CLAUDE_HAIKU: 'anthropic/claude-3.5-haiku',
    GEMINI_FLASH_1_5: 'google/gemini-flash-1.5',
    GEMINI_FLASH_1_5_8B: 'google/gemini-flash-1.5-8b',
    GEMINI_FLASH_2: 'google/gemini-flash-2.0-001',
    GPT4o_MINI: 'openai/gpt-4o-mini',
    MISTRAL_NEMO: 'mistral/mistral-nemo',
    DEEPSEEK_V3: 'deepseek/deepseek-chat',
    LLAMA_70B: 'meta/llama-3.3-70b-instruct'
};

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export class LLMClient {
    constructor(config = {}) {
        this.config = {
            useOwnKey: false,
            apiKey: '',
            model: DEFAULT_MODELS.CLAUDE_HAIKU,
            temperature: 0.7,
            maxTokens: 1000,
            ...config
        };
    }

    async sendMessage(prompt) {
        try {
            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.config.apiKey}`,
                'HTTP-Referer': window.location.origin, // For OpenRouter analytics
                'X-Title': 'Simon Wisdom LLM Widget' // For OpenRouter analytics
            };

            const response = await fetch(OPENROUTER_API_URL, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    model: this.config.model,
                    messages: [{
                        role: 'user',
                        content: prompt
                    }],
                    temperature: this.config.temperature,
                    max_tokens: this.config.maxTokens
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to get response from OpenRouter');
            }

            const data = await response.json();
            const messageContent = data.choices[0]?.message?.content;

            if (!messageContent) {
                throw new Error('No content in response');
            }

            // Return response with usage data if available
            return {
                text: messageContent,
                cost: data.usage ? {
                    promptTokens: data.usage.prompt_tokens,
                    responseTokens: data.usage.completion_tokens,
                    totalTokens: data.usage.total_tokens
                } : null
            };

        } catch (error) {
            console.error('Error sending message:', error);
            throw new Error(`Failed to send message: ${error.message}`);
        }
    }

    // Helper method to get available default models
    static getDefaultModels() {
        return DEFAULT_MODELS;
    }
}