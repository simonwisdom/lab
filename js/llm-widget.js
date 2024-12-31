import { LLMClient } from './llm-client.js';

export class LLMWidget extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        this.providers = [
            { id: 'free', name: 'Free (Gemini Flash 1.5)' },
            { id: 'anthropic', name: 'Anthropic (BYO API Key)' },
            { id: 'openai', name: 'OpenAI (BYO API Key)' },
            { id: 'gemini', name: 'Gemini (BYO API Key)' },
            { id: 'togetherai', name: 'Together AI (BYO API Key)' }
        ];

        this.client = new LLMClient();
        this.currentPricingData = [];
    }

    formatTokenPrice(price) {
        const pricePerMillion = price * 1000000;
        return `$${pricePerMillion.toFixed(2)}/M tokens`;
    }

    async updateModelsList() {
        if (!this.client) return;

        const modelSelect = this.shadowRoot.getElementById('model');
        const modelGroup = this.shadowRoot.getElementById('modelGroup');
        const pricingInfo = this.shadowRoot.getElementById('pricingInfo');
        
        if (!modelSelect || !modelGroup || !pricingInfo) return;

        const providerSelect = this.shadowRoot.getElementById('provider');
        const isFreeProxy = providerSelect.value === 'free';

        modelGroup.style.display = isFreeProxy ? 'none' : 'block';
        pricingInfo.style.display = isFreeProxy ? 'none' : 'block';

        if (isFreeProxy) return;

        try {
            const pricingData = await this.client.loadPricingData();
            this.currentPricingData = pricingData;

            modelSelect.innerHTML = pricingData.map(model => `
                <option value="${model.name}">
                    ${model.name} (${this.formatTokenPrice(model.promptCost)} in, 
                    ${this.formatTokenPrice(model.completionCost)} out)
                </option>
            `).join('');

            this.updatePricingInfo();
        } catch (error) {
            console.error('Error updating models list:', error);
        }
    }

    updatePricingInfo() {
        const modelSelect = this.shadowRoot.getElementById('model');
        const pricingInfo = this.shadowRoot.getElementById('pricingInfo');

        if (!modelSelect || !pricingInfo) return;

        const selectedModel = this.currentPricingData.find(
            m => m.name === modelSelect.value
        );

        if (selectedModel) {
            pricingInfo.innerHTML = `
                <div class="pricing-details">
                    <p>Input: ${this.formatTokenPrice(selectedModel.promptCost)}</p>
                    <p>Output: ${this.formatTokenPrice(selectedModel.completionCost)}</p>
                </div>
            `;
        }
    }

    connectedCallback() {
        this.render();
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
                    <div class="settings-group">
                        <label for="provider">Provider</label>
                        <select id="provider">
                            ${this.providers.map(p => `
                                <option value="${p.id}">${p.name}</option>
                            `).join('')}
                        </select>
                    </div>
                    
                    <div class="settings-group" id="modelGroup" style="display: none;">
                        <label for="model">Model</label>
                        <select id="model">
                            <option value="">Loading models...</option>
                        </select>
                        <div id="pricingInfo"></div>
                    </div>
                    
                    <div class="settings-group" id="apiKeyGroup" style="display: none;">
                        <label for="apiKey">API Key</label>
                        <input type="password" id="apiKey" placeholder="Enter your API key">
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
            </div>
        `;
    }

    attachEventListeners() {
        const saveButton = this.shadowRoot.getElementById('saveSettings');
        const settingsButton = this.shadowRoot.getElementById('settingsButton');
        const settingsPanel = this.shadowRoot.getElementById('settingsPanel');
        const providerSelect = this.shadowRoot.getElementById('provider');
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

        // Provider change handler
        providerSelect.addEventListener('change', async () => {
            const isFreeProxy = providerSelect.value === 'free';
            modelGroup.style.display = isFreeProxy ? 'none' : 'block';
            apiKeyGroup.style.display = isFreeProxy ? 'none' : 'block';

            // Update client configuration
            this.client.config = {
                ...this.client.config,
                useOwnKey: !isFreeProxy,
                provider: isFreeProxy ? 'gemini' : providerSelect.value
            };
            this.client.initialized = false;

            if (!isFreeProxy) {
                await this.updateModelsList();
            }
        });

        // Model change handler
        this.shadowRoot.getElementById('model')?.addEventListener('change', (e) => {
            this.updatePricingInfo();
            if (this.client) {
                this.client.config.model = e.target.value;
                this.client.initialized = false;
            }
        });

        saveButton?.addEventListener('click', () => {
            // Save the current settings
            const apiKeyInput = this.shadowRoot.getElementById('apiKey');
            const providerSelect = this.shadowRoot.getElementById('provider');
            const modelSelect = this.shadowRoot.getElementById('model');

            // Update client configuration
            if (this.client) {
                this.client.config = {
                    ...this.client.config,
                    apiKey: apiKeyInput?.value || '',
                    provider: providerSelect?.value || 'free',
                    model: modelSelect?.value || '',
                    useOwnKey: providerSelect?.value !== 'free'
                };
                this.client.initialized = false;
            }

            // Close the settings panel
            settingsPanel.classList.remove('visible');
            settingsButton.classList.remove('active');
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
            
            if (!message) return;

            try {
                error.textContent = '';
                response.textContent = '';
                loading.style.display = 'block';
                sendButton.disabled = true;

                const result = await this.client.sendMessage(message);
                response.textContent = result;
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