import { LLMClient } from './llm-client.js';

export class LLMWidget extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        // Get default models from LLMClient
        this.defaultModels = LLMClient.getDefaultModels();
        
        this.providers = [
            { id: 'openrouter', name: 'OpenRouter (BYO API Key)' }
        ];

        this.client = new LLMClient();
    }

    formatTokenPrice(price) {
        // Convert from per-1000 tokens to per-million tokens
        const pricePerMillion = price * 1000;
        // Round to 2 decimal places
        return `$${pricePerMillion.toFixed(2)}/M tokens`;
    }

    async updateModelsList() {
        const modelSelect = this.shadowRoot.getElementById('model');
        const modelGroup = this.shadowRoot.getElementById('modelGroup');
        
        if (!modelSelect || !modelGroup) return;

        // Clear existing options first
        modelSelect.innerHTML = '';

        // Add default option
        modelSelect.add(new Option('Select a model...', ''));

        // Add all default models
        Object.entries(this.defaultModels).forEach(([key, value]) => {
            const displayName = key.replace(/_/g, ' ').toLowerCase()
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
            modelSelect.add(new Option(displayName, value));
        });

        // Add custom option
        modelSelect.add(new Option('Custom Model ID...', 'custom'));

        // Add custom model input field (hidden by default)
        if (!this.shadowRoot.getElementById('customModelGroup')) {
            const div = document.createElement('div');
            div.id = 'customModelGroup';
            div.style.display = 'none';
            div.innerHTML = `
                <input type="text" 
                    id="customModel" 
                    placeholder="Enter model ID (e.g., anthropic/claude-3-opus)"
                    style="margin-top: 0.5rem;">
            `;
            modelGroup.appendChild(div);
        }

        // Handle custom model selection
        modelSelect.addEventListener('change', (e) => {
            const customModelGroup = this.shadowRoot.getElementById('customModelGroup');
            const customModelInput = this.shadowRoot.getElementById('customModel');
            
            if (e.target.value === 'custom') {
                customModelGroup.style.display = 'block';
                if (customModelInput) {
                    customModelInput.focus();
                    // Update client model when custom input changes
                    customModelInput.addEventListener('input', (e) => {
                        if (this.client) {
                            this.client.config.model = e.target.value.trim();
                        }
                    });
                }
            } else {
                customModelGroup.style.display = 'none';
                if (this.client) {
                    this.client.config.model = e.target.value;
                }
            }
        });
    }

    updatePricingInfo() {
        // Remove pricing info since OpenRouter handles this differently
        const pricingInfo = this.shadowRoot.getElementById('pricingInfo');
        if (pricingInfo) {
            pricingInfo.innerHTML = '';
        }
    }

    connectedCallback() {
        this.render();
        this.updateModelsList();
        this.attachEventListeners();
        // Autofocus message input
        // setTimeout(() => {
        //     this.shadowRoot.getElementById('message')?.focus();
        // }, 0);
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    font-family: system-ui, -apple-system, sans-serif;
                    max-width: 32rem;
                    margin: 0 auto;
                    position: relative;
                }
                .container {
                    padding: 1rem;
                }
                .settings-button {
                    position: absolute;
                    top: 0.5rem;
                    right: 0.5rem;
                    padding: 0.5rem;
                    background: none;
                    border: none;
                    cursor: pointer;
                    border-radius: 9999px;
                    transition: all 0.2s;
                }
                .settings-button:hover,
                .settings-button.active {
                    background-color: rgba(0, 0, 0, 0.1);
                }
                .settings-icon {
                    width: 1.25rem;
                    height: 1.25rem;
                    color: #4B5563;
                }
                .settings-panel {
                    display: none;
                    position: absolute;
                    top: 3rem;
                    right: 0.5rem;
                    width: 20rem;
                    background: white;
                    border: 1px solid #E5E7EB;
                    border-radius: 0.5rem;
                    padding: 1rem;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                    z-index: 10;
                }
                .settings-group {
                    margin-bottom: 1rem;
                }
                .settings-group:last-child {
                    margin-bottom: 0;
                }
                    .settings-footer {
                    margin-top: 1rem;
                    padding-top: 1rem;
                    border-top: 1px solid #E5E7EB;
                    display: flex;
                    justify-content: flex-end;
                }
                
                .save-button {
                    background: #10B981;
                }
                
                .save-button:hover:not(:disabled) {
                    background: #059669;
                }
                label {
                    display: block;
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: #374151;
                    margin-bottom: 0.25rem;
                }
                select, input, textarea {
                    width: 100%;
                    padding: 0.5rem;
                    border: 1px solid #D1D5DB;
                    border-radius: 0.375rem;
                    margin-bottom: 0.5rem;
                    box-sizing: border-box;
                    transition: border-color 0.2s;
                }
                textarea {
                    height: 8rem;
                    resize: vertical;
                }
                .api-key-valid {
                    border-color: #10B981;
                }
                .api-key-invalid {
                    border-color: #EF4444;
                }
                button {
                    padding: 0.5rem 1rem;
                    background: #2563EB;
                    color: white;
                    border: none;
                    border-radius: 0.375rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                button:hover:not(:disabled) {
                    background: #1D4ED8;
                }
                button:disabled {
                    background: #9CA3AF;
                    cursor: not-allowed;
                }
                .button-container {
                    display: flex;
                    justify-content: flex-end;
                }
                .pricing-details {
                    margin-top: 0.5rem;
                    padding: 0.5rem;
                    background: #F3F4F6;
                    border-radius: 0.375rem;
                    font-size: 0.875rem;
                }
                .response {
                    margin-top: 1rem;
                    padding: 1rem;
                    background: #F3F4F6;
                    border-radius: 0.375rem;
                    white-space: pre-wrap;
                }
                .error {
                    margin-top: 1rem;
                    padding: 1rem;
                    background: #FEE2E2;
                    color: #991B1B;
                    border-radius: 0.375rem;
                }
                .loading {
                    display: none;
                    color: #6B7280;
                    margin-top: 0.5rem;
                    text-align: center;
                }
                @keyframes fade {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .settings-panel.visible {
                    display: block;
                    animation: fade 0.2s ease-out;
                }
                .api-key-group {
                    margin-bottom: 1rem;
                }
                
                .model-group {
                    margin-bottom: 1rem;
                }
                
                .custom-model-input {
                    margin-top: 0.5rem;
                }
                
                .usage-info {
                    margin-top: 0.5rem;
                    padding: 0.5rem;
                    background: #F3F4F6;
                    border-radius: 0.375rem;
                    font-size: 0.875rem;
                }
                .api-key-header {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin-bottom: 0.25rem;
                }
                
                .get-key-link {
                    font-size: 0.875rem;
                    color: #2563EB;
                    text-decoration: none;
                }
                
                .get-key-link:hover {
                    text-decoration: underline;
                }
            </style>
            
            <div class="container">
                <!-- Settings Button -->
                <button class="settings-button" id="settingsButton" title="Configure LLM settings">
                    <svg class="settings-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3zM19 12c0-.342-.035-.674-.1-.998l2.182-1.838a.5.5 0 00.118-.63l-2-3.464a.5.5 0 00-.606-.195l-2.466 1.033c-.53-.408-1.12-.742-1.757-.987L14.1 2.4a.5.5 0 00-.495-.4h-4a.5.5 0 00-.495.4l-.371 2.52c-.636.245-1.227.58-1.757.987L4.516 4.874a.5.5 0 00-.606.195l-2 3.464a.5.5 0 00.118.63l2.182 1.838A8.048 8.048 0 004 12c0 .342.035.674.1.998l-2.182 1.838a.5.5 0 00-.118.63l2 3.464c.118.204.373.286.606.195l2.466-1.033c.53.408 1.12.742 1.757.987l.371 2.52a.5.5 0 00.495.4h4a.5.5 0 00.495-.4l.371-2.52c.636-.245 1.227-.58 1.757-.987l2.466 1.033a.5.5 0 00.606-.195l2-3.464a.5.5 0 00-.118-.63l-2.182-1.838c.065-.324.1-.656.1-.998z"/>
                    </svg>
                </button>

                <!-- Settings Panel -->
                <div class="settings-panel" id="settingsPanel">
                    <div class="settings-group api-key-group">
                        <div class="api-key-header">
                            <label for="apiKey">OpenRouter API Key</label>
                            <a href="https://openrouter.ai/settings/keys" 
                               class="get-key-link" 
                               target="_blank" 
                               rel="noopener noreferrer">Get Key</a>
                        </div>
                        <input type="password" id="apiKey" placeholder="Enter your OpenRouter API key">
                    </div>
                    
                    <div class="settings-group model-group" id="modelGroup">
                        <label for="model">Model</label>
                        <select id="model">
                            <option value="">Select a model...</option>
                        </select>
                    </div>

                    <div class="settings-footer">
                        <button type="button" id="saveSettings" class="save-button">Save Settings</button>
                    </div>
                </div>

                <!-- Main Chat Interface -->
                <form id="messageForm">
                    <textarea 
                        id="message" 
                        placeholder="Type your message here..."
                        autocomplete="off"
                    ></textarea>
                    
                    <div class="button-container">
                        <button type="submit" id="sendButton">Send Message</button>
                    </div>
                </form>

                <div class="loading" id="loading">Processing...</div>
                <div class="error" id="error"></div>
                <div class="response" id="response"></div>
                <div class="usage-info" id="usageInfo" style="display: none;"></div>
            </div>
        `;
    }

    attachEventListeners() {
        const saveButton = this.shadowRoot.getElementById('saveSettings');
        const settingsButton = this.shadowRoot.getElementById('settingsButton');
        const settingsPanel = this.shadowRoot.getElementById('settingsPanel');
        const modelGroup = this.shadowRoot.getElementById('modelGroup');
        const apiKeyGroup = this.shadowRoot.getElementById('apiKeyGroup');
        const apiKeyInput = this.shadowRoot.getElementById('apiKey');
        const messageForm = this.shadowRoot.getElementById('messageForm');
        const messageInput = this.shadowRoot.getElementById('message');
        const sendButton = this.shadowRoot.getElementById('sendButton');
        const loading = this.shadowRoot.getElementById('loading');
        const error = this.shadowRoot.getElementById('error');
        const response = this.shadowRoot.getElementById('response');

        // Stop propagation for all clicks inside the settings panel
        settingsPanel.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // Toggle settings panel
        settingsButton.addEventListener('click', (e) => {
            e.stopPropagation();
            settingsPanel.classList.toggle('visible');
            settingsButton.classList.toggle('active');
        });

        // Close settings panel when clicking outside
        document.addEventListener('click', () => {
            if (settingsPanel.classList.contains('visible')) {
                settingsPanel.classList.remove('visible');
                settingsButton.classList.remove('active');
            }
        });

        // Model change handler
        this.shadowRoot.getElementById('model')?.addEventListener('change', (e) => {
            if (this.client) {
                this.client.config.model = e.target.value;
            }
        });

        saveButton?.addEventListener('click', () => {
            const apiKeyInput = this.shadowRoot.getElementById('apiKey');
            const modelSelect = this.shadowRoot.getElementById('model');
            const customModelInput = this.shadowRoot.getElementById('customModel');

            // Update client configuration
            if (this.client) {
                this.client.config = {
                    ...this.client.config,
                    apiKey: apiKeyInput?.value || '',
                    model: modelSelect?.value === 'custom' ? 
                        (customModelInput?.value || this.defaultModels.CLAUDE_HAIKU) : 
                        modelSelect?.value
                };
            }

            // Close the settings panel
            this.shadowRoot.getElementById('settingsPanel').classList.remove('visible');
            this.shadowRoot.getElementById('settingsButton').classList.remove('active');
        });

         // API key validation with error handling
         let validateTimeout;
         
         apiKeyInput?.addEventListener('input', (e) => {
             clearTimeout(validateTimeout);
             validateTimeout = setTimeout(async () => {
                 const apiKey = e.target?.value;
                 if (!apiKey || typeof apiKey !== 'string') {
                     e.target?.classList.remove('api-key-valid', 'api-key-invalid');
                     return;
                 }
                 
                 try {
                     const trimmedKey = apiKey.trim();
                     if (!trimmedKey) {
                         e.target.classList.remove('api-key-valid', 'api-key-invalid');
                         return;
                     }
 
                     const isValid = await this.client?.validateApiKey(trimmedKey);
                     e.target.classList.remove('api-key-valid', 'api-key-invalid');
                     e.target.classList.add(isValid ? 'api-key-valid' : 'api-key-invalid');
                 } catch (error) {
                     console.error('Error validating API key:', error);
                     e.target.classList.remove('api-key-valid', 'api-key-invalid');
                     e.target.classList.add('api-key-invalid');
                 }
             }, 500);
         });

        // Form submission
        messageForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const message = messageInput.value.trim();
            const usageInfo = this.shadowRoot.getElementById('usageInfo');
            
            if (!message) return;

            try {
                error.textContent = '';
                response.textContent = '';
                usageInfo.style.display = 'none';
                loading.style.display = 'block';
                sendButton.disabled = true;

                const result = await this.client.sendMessage(message);
                response.textContent = result.text;
                
                // Display usage information if available
                if (result.cost) {
                    usageInfo.innerHTML = `
                        <div>Tokens Used:</div>
                        <div>Prompt: ${result.cost.promptTokens}</div>
                        <div>Response: ${result.cost.responseTokens}</div>
                        <div>Total: ${result.cost.totalTokens}</div>
                    `;
                    usageInfo.style.display = 'block';
                }
            } catch (err) {
                error.textContent = `Error: ${err.message}`;
            } finally {
                loading.style.display = 'none';
                sendButton.disabled = false;
            }
        });
    }
}

// Register the web component
customElements.define('llm-widget', LLMWidget);