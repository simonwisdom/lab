/**
 * A unified client for interacting with multiple LLM providers
 */

/**
 * @typedef {Object} ProviderConfig
 * @property {boolean} [useOwnKey=false] - Whether to use the user's API key or proxy
 * @property {string} [apiKey=''] - API key for the selected provider
 * @property {('openai'|'anthropic'|'google'|'togetherai')} [provider='google'] - LLM provider
 * @property {string} [model] - Model name for the selected provider
 * @property {number} [temperature=0.7] - Temperature for response generation
 * @property {number} [maxTokens=1000] - Maximum tokens for response
 * @property {string} [proxyUrl] - URL for proxy server when not using own key
 */

const SUPPORTED_PROVIDERS = {
    OPENAI: 'openai',
    ANTHROPIC: 'anthropic',
    GOOGLE: 'google',
    TOGETHER: 'togetherai'
};

const CACHE_DURATION = 24 * 60 * 60 * 1000;

// External script URL for BYO API key integration
const UNIFIED_LLM_API_URL = 'https://amanpriyanshu.github.io/API-LLM-Hub/unified-llm-api.js';

export class LLMClient {
    constructor(config = {}) {
        this.config = {
            useOwnKey: false,
            apiKey: '',
            provider: SUPPORTED_PROVIDERS.GOOGLE,
            model: 'gemini-1.5-flash-latest',
            temperature: 0.7,
            maxTokens: 1000,
            proxyUrl: 'https://lab-proxy.vercel.app/api/gemini-proxy',
            ...config
        };

        this.initialized = false;
        this.apiHub = null;
        this.pricingData = null;
    }

    async loadPricingData() {
        try {
            const response = await fetch('/assets/llm-costs-2025-01-30.csv');
            const csvText = await response.text();
            const lines = csvText.split('\n').filter(line => line.trim());
            
            // Store the pricing data in the instance variable
            this.pricingData = lines.slice(1).map(line => {
                const [provider, model, _, __, inputCost, outputCost] = line
                    .split(',')
                    .map(v => v.trim().replace(/^"|"$/g, ''));
                
                return {
                    provider: provider.toLowerCase(),
                    model: model,
                    name: model,
                    inputCost: parseFloat(inputCost.replace(/[^0-9.]/g, '')),
                    outputCost: parseFloat(outputCost.replace(/[^0-9.]/g, ''))
                };
            }).filter(({ provider }) => 
                Object.values(SUPPORTED_PROVIDERS).includes(provider)
            );
            
            return this.pricingData;
            
        } catch (error) {
            console.error('Error loading pricing data:', error);
            return [];
        }
    }

    async initialize() {
        if (this.initialized) return;

        // Load pricing data during initialization
        if (!this.pricingData) {
            await this.loadPricingData();
        }

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

    async calculateMessageCost(prompt, response = '') {
        if (!this.pricingData) {
            try {
                await this.loadPricingData();
            } catch (error) {
                console.warn('Failed to load pricing data:', error);
                return null;
            }
        }

        // Guard against null pricingData even after load attempt
        if (!this.pricingData || !Array.isArray(this.pricingData)) {
            console.warn('Pricing data unavailable');
            return null;
        }

        // Find pricing for current model
        const modelPricing = this.pricingData.find(m => m.name === this.config.model);
        if (!modelPricing) {
            console.warn(`No pricing data found for model: ${this.config.model}`);
            return null;
        }

        // Estimate token counts (rough approximation)
        const promptTokens = Math.ceil(prompt.length / 4);
        const responseTokens = Math.ceil(response.length / 4);

        // Calculate costs
        const promptCost = (promptTokens / 1000) * modelPricing.inputCost;
        const responseCost = (responseTokens / 1000) * modelPricing.outputCost;
        const totalCost = promptCost + responseCost;

        return {
            promptTokens,
            responseTokens,
            promptCost,
            responseCost,
            totalCost
        };
    }

    async sendMessage(prompt) {
        if (!this.initialized) {
            await this.initialize();
        }

        try {
            let response;
            if (this.config.useOwnKey) {
                response = await this.sendBYOKeyMessage(prompt);
            } else {
                response = await this.sendProxiedMessage(prompt);
            }

            // Calculate cost after successful response
            const cost = await this.calculateMessageCost(prompt, response);
            
            return {
                text: response,
                cost: cost
            };
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