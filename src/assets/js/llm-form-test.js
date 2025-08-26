// LLM Form Generation Test Script
class LLMFormTest {
    constructor() {
        this.backendUrl = '';
        this.currentSchema = null;
        this.generatedFormData = null;
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.setupSchemaUrls();
    }

    bindEvents() {
        // Schema selection change
        document.getElementById('schemaSelect').addEventListener('change', (e) => {
            this.handleSchemaChange(e.target.value);
        });

        // Generate form button
        document.getElementById('generateFormBtn').addEventListener('click', () => {
            this.generateForm();
        });

        // Clear form button
        document.getElementById('clearFormBtn').addEventListener('click', () => {
            this.clearForm();
        });

        // Add test mode button
        document.getElementById('testModeBtn').addEventListener('click', () => {
            this.testWithSampleResponse();
        });
    }

    setupSchemaUrls() {
        this.schemaUrls = {
            'bike-insights': './sample_bike_insights_json_schema.json',
            'restaurant-recommender': './sample_rr.json'
        };
        
        // Sample LLM responses for testing without backend
        this.sampleResponses = {
            'bike-insights': './sample_llm_responses/bike_insights_response.json',
            'restaurant-recommender': './sample_llm_responses/restaurant_response.json',
            'error': './sample_llm_responses/error_response.json'
        };
    }

    handleSchemaChange(schemaType) {
        const customUrlContainer = document.getElementById('customUrlContainer');
        
        if (schemaType === 'custom') {
            customUrlContainer.style.display = 'block';
        } else {
            customUrlContainer.style.display = 'none';
        }
    }

    async generateForm() {
        const schemaSelect = document.getElementById('schemaSelect');
        const customUrl = document.getElementById('customSchemaUrl').value;
        const backendUrl = document.getElementById('backendUrl').value;

        // Validation
        if (!schemaSelect.value) {
            this.showError('Please select a schema first.');
            return;
        }

        if (!backendUrl) {
            this.showError('Please provide the backend API URL.');
            return;
        }

        if (schemaSelect.value === 'custom' && !customUrl) {
            this.showError('Please provide a custom schema URL.');
            return;
        }

        try {
            this.showLoading(true);
            
            // Step 1: Fetch the schema
            const schemaUrl = schemaSelect.value === 'custom' 
                ? customUrl 
                : this.schemaUrls[schemaSelect.value];
                
            console.log('Fetching schema from:', schemaUrl);
            const schemaResponse = await fetch(schemaUrl);
            
            if (!schemaResponse.ok) {
                throw new Error(`Failed to fetch schema: ${schemaResponse.statusText}`);
            }
            
            const schema = await schemaResponse.json();
            this.currentSchema = schema;
            
            // Step 2: Send schema to backend for LLM processing
            console.log('Sending schema to backend:', backendUrl);
            const llmResponse = await fetch(backendUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ schema })
            });

            if (!llmResponse.ok) {
                throw new Error(`Backend error: ${llmResponse.status} ${llmResponse.statusText}`);
            }

            const formData = await llmResponse.json();
            this.generatedFormData = formData;
            
            // Step 3: Render the generated form
            this.renderGeneratedForm(formData);
            this.updateResponseInfo(formData);
            
            console.log('Form generated successfully:', formData);
            
        } catch (error) {
            console.error('Form generation failed:', error);
            this.showError(`Form generation failed: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
    }

    renderGeneratedForm(formData) {
        const container = document.getElementById('formContainer');
        
        if (!formData.success) {
            this.showError(formData.error || 'Unknown error from backend');
            return;
        }

        // Clear previous content
        container.innerHTML = '';
        container.classList.add('has-content');

        try {
            // Create form wrapper
            const formWrapper = document.createElement('div');
            formWrapper.className = 'generated-form-wrapper';
            
            // Add response metadata
            if (formData.metadata) {
                const infoDiv = document.createElement('div');
                infoDiv.className = 'response-info';
                infoDiv.innerHTML = `
                    <h6><i class="bi bi-info-circle me-2"></i>Generated Form Details</h6>
                    <div class="row">
                        <div class="col-md-6">
                            <strong>Workflow:</strong> ${formData.workflow_name || 'Unknown'}<br>
                            <strong>Form Type:</strong> ${formData.form_type || 'Unknown'}<br>
                            <strong>Generated At:</strong> ${new Date(formData.metadata?.generated_at || Date.now()).toLocaleString()}
                        </div>
                        <div class="col-md-6">
                            <strong>Total Forms:</strong> ${formData.forms?.length || formData.metadata?.total_forms || 1}<br>
                            <strong>LLM Model:</strong> ${formData.metadata?.llm_model || 'Unknown'}<br>
                            <strong>Fields:</strong> ${formData.metadata?.estimated_fields || 'Unknown'}
                        </div>
                    </div>
                `;
                formWrapper.appendChild(infoDiv);
            }

            // Inject HTML content
            if (formData.html) {
                const htmlDiv = document.createElement('div');
                htmlDiv.innerHTML = formData.html;
                formWrapper.appendChild(htmlDiv);
            } else if (formData.forms && Array.isArray(formData.forms)) {
                // Handle multiple forms
                formData.forms.forEach(form => {
                    const formDiv = document.createElement('div');
                    formDiv.innerHTML = form.html;
                    formWrapper.appendChild(formDiv);
                });
            }

            container.appendChild(formWrapper);

            // Inject CSS if provided
            if (formData.css) {
                this.injectCSS(formData.css);
            }

            // Execute JavaScript if provided
            if (formData.javascript) {
                this.executeJavaScript(formData);
            }

        } catch (error) {
            console.error('Error rendering form:', error);
            this.showError(`Error rendering form: ${error.message}`);
        }
    }

    injectCSS(css) {
        // Remove previous injected CSS
        const existingStyle = document.getElementById('llm-generated-css');
        if (existingStyle) {
            existingStyle.remove();
        }

        // Inject new CSS
        const style = document.createElement('style');
        style.id = 'llm-generated-css';
        style.textContent = css;
        document.head.appendChild(style);
        
        console.log('CSS injected successfully');
    }

    executeJavaScript(formData) {
        try {
            // Create a safe execution context
            const scriptContext = {
                formData: formData,
                templates: formData.templates || {},
                console: console // Allow console for debugging
            };

            // Execute handlers
            if (formData.javascript.handlers) {
                const handlerScript = new Function('context', `
                    with(context) {
                        ${formData.javascript.handlers}
                    }
                `);
                handlerScript(scriptContext);
            }

            // Execute validation logic
            if (formData.javascript.validation) {
                const validationScript = new Function('context', `
                    with(context) {
                        ${formData.javascript.validation}
                    }
                `);
                validationScript(scriptContext);
            }

            // Execute data collection logic
            if (formData.javascript.data_collection) {
                const dataScript = new Function('context', `
                    with(context) {
                        ${formData.javascript.data_collection}
                    }
                `);
                dataScript(scriptContext);
            }

            console.log('JavaScript executed successfully');

        } catch (error) {
            console.error('Error executing JavaScript:', error);
            this.showError(`JavaScript execution error: ${error.message}`);
        }
    }

    updateResponseInfo(formData) {
        const responseInfo = document.getElementById('responseInfo');
        const responseDetails = document.getElementById('responseDetails');
        
        const details = `
            Response Size: ${JSON.stringify(formData).length} bytes | 
            Forms: ${formData.forms?.length || 1} | 
            Has CSS: ${formData.css ? 'Yes' : 'No'} | 
            Has JS: ${formData.javascript ? 'Yes' : 'No'}
        `;
        
        responseDetails.textContent = details;
        responseInfo.style.display = 'block';
    }

    clearForm() {
        const container = document.getElementById('formContainer');
        container.classList.remove('has-content');
        container.innerHTML = `
            <div class="text-center text-muted">
                <i class="bi bi-file-code display-1 mb-3"></i>
                <h5>No Form Generated Yet</h5>
                <p>Select a schema and click "Generate Form with LLM" to see the backend-generated form here.</p>
            </div>
        `;

        // Clear response info
        document.getElementById('responseInfo').style.display = 'none';

        // Remove injected CSS
        const existingStyle = document.getElementById('llm-generated-css');
        if (existingStyle) {
            existingStyle.remove();
        }

        // Clear data
        this.currentSchema = null;
        this.generatedFormData = null;
        
        console.log('Form cleared');
    }

    async testWithSampleResponse() {
        const schemaSelect = document.getElementById('schemaSelect');
        
        if (!schemaSelect.value) {
            this.showError('Please select a schema first.');
            return;
        }

        try {
            this.showLoading(true);
            
            // Load sample response instead of calling backend
            const responseUrl = this.sampleResponses[schemaSelect.value];
            console.log('Loading sample response from:', responseUrl);
            
            const response = await fetch(responseUrl);
            if (!response.ok) {
                throw new Error(`Failed to load sample response: ${response.statusText}`);
            }
            
            const formData = await response.json();
            this.generatedFormData = formData;
            
            // Render the sample form
            this.renderGeneratedForm(formData);
            this.updateResponseInfo(formData);
            
            console.log('Sample form loaded successfully:', formData);
            
        } catch (error) {
            console.error('Sample form loading failed:', error);
            this.showError(`Sample form loading failed: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
    }

    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        overlay.style.display = show ? 'flex' : 'none';
    }

    showError(message) {
        const container = document.getElementById('formContainer');
        container.classList.remove('has-content');
        container.innerHTML = `
            <div class="error-container">
                <h5><i class="bi bi-exclamation-triangle me-2"></i>Error</h5>
                <p>${message}</p>
                <button class="btn btn-outline-danger btn-sm" onclick="llmFormTest.clearForm()">
                    Clear and Try Again
                </button>
            </div>
        `;
    }
}

// Initialize the test application
const llmFormTest = new LLMFormTest();

// Global functions for LLM-generated forms to use
window.llmFormTest = llmFormTest;

// Export for debugging
window.LLMFormTest = LLMFormTest;
