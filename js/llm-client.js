/**
 * A unified client for interacting with multiple LLM providers
 */

/**
 * @typedef {Object} ProviderConfig
 * @property {boolean} [useOwnKey=false] - Whether to use the user's API key or proxy
 * @property {string} [apiKey=''] - API key for the selected provider
 * @property {('openai'|'anthropic'|'gemini'|'togetherai')} [provider='gemini'] - LLM provider
 * @property {string} [model] - Model name for the selected provider
 * @property {number} [temperature=0.7] - Temperature for response generation
 * @property {number} [maxTokens=1000] - Maximum tokens for response
 * @property {string} [proxyUrl] - URL for proxy server when not using own key
 */

const CACHE_DURATION = 24 * 60 * 60 * 1000;

// External script URL for BYO API key integration
const UNIFIED_LLM_API_URL = 'https://amanpriyanshu.github.io/API-LLM-Hub/unified-llm-api.js';

const PRICING_URLS = {
    anthropic: 'https://raw.githubusercontent.com/Helicone/helicone/main/costs/src/providers/anthropic/index.ts',
    openai: 'https://raw.githubusercontent.com/Helicone/helicone/main/costs/src/providers/openai/index.ts',
    gemini: 'https://raw.githubusercontent.com/Helicone/helicone/main/costs/src/providers/google/index.ts',
    togetherai: 'https://raw.githubusercontent.com/Helicone/helicone/main/costs/src/providers/togetherai/completion/index.ts'
};

export class LLMClient {
    constructor(config = {}) {
        this.config = {
            useOwnKey: false,
            apiKey: '',
            provider: 'gemini',
            model: 'gemini-1.5-flash-latest',
            temperature: 0.7,
            maxTokens: 1000,
            proxyUrl: 'https://lab-proxy.vercel.app/api/gemini-proxy',
            ...config
        };

        this.initialized = false;
        this.apiHub = null;
        this.pricingData = {};
    }

    async loadPricingData() {
        try {
            const response = await fetch(PRICING_URLS[this.config.provider]);
            const data = await response.text();

            // Parse the TypeScript-like content
            // Note: This is a simplified parser for the provided format
            const modelData = [];
            const lines = data.split('\n');
            let currentModel = null;

            for (const line of lines) {
                if (line.includes('model: {')) {
                    currentModel = {};
                } else if (currentModel && line.includes('value:')) {
                    currentModel.name = line.match(/["'](.*?)["']/)[1];
                } else if (currentModel && line.includes('prompt_token:')) {
                    currentModel.promptCost = parseFloat(line.match(/[\d.]+/)[0]);
                } else if (currentModel && line.includes('completion_token:')) {
                    currentModel.completionCost = parseFloat(line.match(/[\d.]+/)[0]);
                    if (currentModel.name) {
                        modelData.push({ ...currentModel });
                    }
                    currentModel = null;
                }
            }

            this.pricingData = modelData;
            return modelData;
        } catch (error) {
            console.error('Error loading pricing data:', error);
            return [];
        }
    }

    async initialize() {
        if (this.initialized) return;

        if (this.config.useOwnKey) {
            try {
                // Dynamically import the unified LLM API
                const APILLMHub = await import(UNIFIED_LLM_API_URL);

                this.apiHub = new APILLMHub.default({
                    provider: this.config.provider,
                    apiKey: this.config.apiKey,
                    model: this.config.model,
                    maxTokens: this.config.maxTokens,
                    temperature: this.config.temperature
                });

                await this.apiHub.initialize();
            } catch (error) {
                console.error('Error initializing APILLMHub:', error);
                throw new Error('Failed to initialize API client');
            }
        }

        this.initialized = true;
    }

    async sendMessage(prompt) {
        if (!this.initialized) {
            await this.initialize();
        }

        try {
            if (this.config.useOwnKey) {
                return await this.sendBYOKeyMessage(prompt);
            } else {
                return await this.sendProxiedMessage(prompt);
            }
        } catch (error) {
            console.error('Error sending message:', error);
            throw new Error(`Failed to send message: ${error.message}`);
        }
    }

    async sendBYOKeyMessage(prompt) {
        if (!this.apiHub) {
            throw new Error('APILLMHub not initialized');
        }

        try {
            const response = await this.apiHub.sendMessage(prompt);
            return response;
        } catch (error) {
            console.error('Error sending message through APILLMHub:', error);
            throw error;
        }
    }

    async sendProxiedMessage(prompt) {
        const response = await fetch(this.config.proxyUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            })
        });

        if (!response.ok) {
            throw new Error(`Proxy server error: ${response.status}`);
        }

        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    }
}