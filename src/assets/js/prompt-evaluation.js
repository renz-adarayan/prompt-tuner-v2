// Prompt Evaluation JavaScript with Alpine.js

// API Configuration
const EVALUATION_API_CONFIG = {
    baseUrl: 'http://localhost:8000',
    endpoints: {
        workflowsList: '/api/v1/workflows/list',
        promptView: '/api/v1/prompts/view'
    }
};

// Sample workflow configurations with dynamic input fields
const WORKFLOW_CONFIGS = {
    bike_insights: {
        id: 'bike_insights',
        name: 'Bike Insights',
        description: 'Comprehensive analysis workflow for bicycle sharing data with predictive analytics and user behavior insights.',
        inputFields: [
            {
                name: 'bike_sales',
                label: 'Bike Sales Data',
                type: 'number',
                placeholder: 'Enter sales figures',
                description: 'Number of bikes sold in the period',
                min: 0,
                max: 10000,
                required: true
            },
            {
                name: 'bike_model',
                label: 'Bike Model',
                type: 'select',
                options: ['Mountain Bike', 'Road Bike', 'Electric Bike', 'Hybrid Bike', 'BMX'],
                description: 'Select the bike model for analysis',
                required: true
            },
            {
                name: 'location',
                label: 'Location',
                type: 'text',
                placeholder: 'e.g., Sydney, Melbourne',
                description: 'Geographic location for the analysis',
                required: true
            },
            {
                name: 'time_period',
                label: 'Time Period',
                type: 'select',
                options: ['Last Week', 'Last Month', 'Last Quarter', 'Last Year'],
                description: 'Analysis time frame',
                required: true
            },
            {
                name: 'customer_segment',
                label: 'Customer Segment',
                type: 'select',
                options: ['Premium', 'Standard', 'Budget', 'All Segments'],
                description: 'Target customer segment',
                required: false
            },
            {
                name: 'additional_notes',
                label: 'Additional Notes',
                type: 'textarea',
                placeholder: 'Any specific requirements or notes...',
                description: 'Optional additional context or requirements',
                required: false
            }
        ],
        agents: [
            {
                agent_name: "customer_sentiment_agent",
                agent_display_name: "Customer Sentiment",
                agent_description: "Analyzes customer feedback and sentiment"
            },
            {
                agent_name: "fiscal_analysis_agent",
                agent_display_name: "Fiscal Analysis",
                agent_description: "Performs financial analysis and cost optimization"
            },
            {
                agent_name: "bike_lookup_agent",
                agent_display_name: "Bike Lookup Agent",
                agent_description: "Handles bike availability lookups"
            },
            {
                agent_name: "bike_summary_agent",
                agent_display_name: "Summary Agent",
                agent_description: "Generates comprehensive analysis summary"
            }
        ]
    },
    restaurant_recommender: {
        id: 'restaurant_recommender',
        name: 'Restaurant Recommender',
        description: 'Intelligent restaurant recommendation system based on user preferences and contextual factors.',
        inputFields: [
            {
                name: 'preference',
                label: 'Food Preference',
                type: 'select',
                options: ['Italian', 'Asian', 'Mexican', 'Mediterranean', 'American', 'French', 'Indian', 'Thai'],
                description: 'Preferred cuisine type',
                required: true
            },
            {
                name: 'location',
                label: 'Location',
                type: 'text',
                placeholder: 'e.g., Sydney CBD, Melbourne',
                description: 'Restaurant location or area',
                required: true
            },
            {
                name: 'budget',
                label: 'Budget Range',
                type: 'select',
                options: ['$10-25', '$25-50', '$50-100', '$100+'],
                description: 'Price range per person',
                required: true
            },
            {
                name: 'dining_style',
                label: 'Dining Style',
                type: 'select',
                options: ['Casual', 'Fine Dining', 'Fast Food', 'Cafe', 'Bar & Grill'],
                description: 'Type of dining experience',
                required: true
            },
            {
                name: 'party_size',
                label: 'Party Size',
                type: 'number',
                placeholder: 'Number of people',
                description: 'Number of diners',
                min: 1,
                max: 20,
                required: true
            },
            {
                name: 'dietary_restrictions',
                label: 'Dietary Restrictions',
                type: 'text',
                placeholder: 'e.g., Vegetarian, Gluten-free, Halal',
                description: 'Any dietary requirements or restrictions',
                required: false
            }
        ],
        agents: [
            {
                agent_name: "preference_analyzer",
                agent_display_name: "Preference Analyzer",
                agent_description: "Analyzes user preferences and requirements"
            },
            {
                agent_name: "location_finder",
                agent_display_name: "Location Finder",
                agent_description: "Finds restaurants in specified locations"
            },
            {
                agent_name: "rating_evaluator",
                agent_display_name: "Rating Evaluator",
                agent_description: "Evaluates restaurant ratings and reviews"
            },
            {
                agent_name: "recommendation_generator",
                agent_display_name: "Recommendation Generator",
                agent_description: "Generates final restaurant recommendations"
            }
        ]
    }
};

// Dummy evaluation results generator
function generateDummyResults(workflowId, inputValues) {
    const workflow = WORKFLOW_CONFIGS[workflowId];
    
    // Generate workflow output based on type
    let workflowOutput = '';
    if (workflowId === 'bike_insights') {
        workflowOutput = `
**Bike Insights Analysis Results**

Based on your input parameters:
- Bike Model: ${inputValues.bike_model || 'N/A'}
- Sales Data: ${inputValues.bike_sales || 'N/A'} units
- Location: ${inputValues.location || 'N/A'}
- Time Period: ${inputValues.time_period || 'N/A'}

**Key Findings:**
• Sales performance shows ${Math.random() > 0.5 ? 'positive' : 'moderate'} growth trend
• Customer sentiment analysis reveals ${Math.floor(Math.random() * 20 + 75)}% satisfaction rate
• Fiscal analysis indicates ${Math.random() > 0.6 ? 'profitable' : 'break-even'} performance
• Market demand for ${inputValues.bike_model} is ${Math.random() > 0.5 ? 'high' : 'moderate'}

**Recommendations:**
1. Focus on high-performing models
2. Optimize inventory based on demand patterns
3. Implement targeted marketing strategies
4. Consider seasonal adjustments`;
    } else {
        workflowOutput = `
**Restaurant Recommendation Results**

Based on your preferences:
- Cuisine: ${inputValues.preference || 'N/A'}
- Location: ${inputValues.location || 'N/A'}
- Budget: ${inputValues.budget || 'N/A'}
- Party Size: ${inputValues.party_size || 'N/A'}

**Top Recommendations:**
1. **The Golden Spoon** - ${inputValues.preference} cuisine, 4.8/5 rating
   Located in ${inputValues.location}, perfect for ${inputValues.dining_style}
   
2. **Ocean View Bistro** - Fusion ${inputValues.preference}, 4.6/5 rating
   Great ambiance, matches your budget range
   
3. **Local Favorites** - Traditional ${inputValues.preference}, 4.7/5 rating
   Highly rated by locals, excellent value

**Match Confidence:** ${Math.floor(Math.random() * 15 + 85)}%
**Estimated Wait Time:** ${Math.floor(Math.random() * 45 + 15)} minutes`;
    }
    
    // Generate agent results
    const agentResults = workflow.agents.map(agent => ({
        agentName: agent.agent_name,
        displayName: agent.agent_display_name,
        tokensUsed: Math.floor(Math.random() * 3000 + 500),
        executionTime: Math.floor(Math.random() * 2000 + 300),
        model: 'gpt-4.1-nano',
        output: generateAgentOutput(agent.agent_name, inputValues),
        expanded: false // For controlling the expand/collapse of agent output
    }));
    
    return {
        workflowOutput,
        agentResults
    };
}

function generateAgentOutput(agentName, inputValues) {
    const outputs = {
        customer_sentiment_agent: `SENTIMENT ANALYSIS COMPLETE
        
Overall Sentiment Score: 78% Positive
Confidence Level: 94%

Key Findings:
• Positive sentiment: 78% (Strong satisfaction with product quality)
• Neutral sentiment: 15% (Price-conscious feedback) 
• Negative sentiment: 7% (Minor service issues)

Top Sentiment Drivers:
1. "Excellent build quality" - mentioned 42 times
2. "Great value for money" - mentioned 38 times  
3. "Fast delivery" - mentioned 31 times
4. "Poor customer service" - mentioned 8 times (negative)

Recommendation: Focus on customer service training to address the 7% negative sentiment.`,

        fiscal_analysis_agent: `FINANCIAL ANALYSIS COMPLETE

Revenue Metrics:
• Total Revenue: $${Math.floor(Math.random() * 50000 + 10000).toLocaleString()}
• Profit Margin: ${Math.floor(Math.random() * 25 + 10)}%
• ROI: ${Math.floor(Math.random() * 30 + 15)}%
• Break-even Point: ${Math.floor(Math.random() * 6 + 3)} months

Cost Breakdown:
• Manufacturing: 45% of revenue
• Marketing: 18% of revenue
• Operations: 22% of revenue
• Profit: ${Math.floor(Math.random() * 25 + 10)}% of revenue

Growth Projections:
• Q1 Forecast: +${Math.floor(Math.random() * 15 + 8)}%
• Annual Projection: +${Math.floor(Math.random() * 25 + 15)}%

Risk Assessment: LOW - Stable market conditions with positive trend indicators.`,

        bike_lookup_agent: `INVENTORY LOOKUP COMPLETE

Current Stock Status:
• Available Units: ${Math.floor(Math.random() * 200 + 50)} bikes
• Model: ${inputValues.bike_model || 'Electric Bike'}
• Location: ${inputValues.location || 'Sydney'} warehouse

Inventory Details:
• In Stock: ${Math.floor(Math.random() * 150 + 30)} units
• Reserved: ${Math.floor(Math.random() * 20 + 5)} units  
• On Order: ${Math.floor(Math.random() * 100 + 25)} units (arriving next week)

Popular Models (by sales):
1. Electric Bike - 45% of sales
2. Mountain Bike - 28% of sales
3. Road Bike - 18% of sales
4. Hybrid Bike - 9% of sales

Restocking Recommendations:
• Increase Electric Bike inventory by 30%
• Maintain current levels for Mountain/Road bikes
• Consider seasonal adjustment for Hybrid models`,

        bike_summary_agent: `COMPREHENSIVE BIKE INSIGHTS SUMMARY

Executive Summary:
Based on analysis of ${inputValues.bike_sales || '2,500'} units sold in ${inputValues.location || 'Sydney'} over ${inputValues.time_period || 'Last Quarter'}, the ${inputValues.bike_model || 'Electric Bike'} segment shows strong performance.

Key Performance Indicators:
• Customer Satisfaction: 78% positive sentiment
• Financial Health: ${Math.floor(Math.random() * 25 + 10)}% profit margin  
• Inventory Status: Well-stocked with ${Math.floor(Math.random() * 200 + 50)} units available
• Market Demand: High demand for electric models

Strategic Recommendations:
1. Focus marketing on electric bike segment (highest demand)
2. Improve customer service to address 7% negative sentiment
3. Increase electric bike inventory by 30% for Q4
4. Optimize pricing strategy to maintain ${Math.floor(Math.random() * 25 + 10)}% margins
5. Leverage positive reviews in marketing campaigns

Next Steps:
• Implement customer service training program
• Review supplier contracts for electric bike components
• Launch targeted marketing campaign for Q4 season`,

        preference_analyzer: `PREFERENCE ANALYSIS COMPLETE

User Profile Summary:
• Primary Cuisine: ${inputValues.preference || 'Italian'}
• Budget Sensitivity: Medium-High
• Quality Priority: High (4.5/5 importance)
• Location Preference: ${inputValues.location || 'Sydney CBD'}

Preference Insights:
• Cuisine Flexibility: 72% (open to fusion options)
• Price vs Quality: 68% prefer quality over lower price
• Ambiance Importance: 84% value dining atmosphere
• Service Speed: 56% prefer relaxed dining experience

Dietary Considerations:
• Restrictions: ${inputValues.dietary_restrictions || 'None specified'}
• Party Size Impact: ${inputValues.party_size || '2'} people - intimate setting preferred
• Time Preference: Evening dining (7-9 PM optimal)

Recommendation Engine Input:
Weight factors calculated for restaurant matching algorithm.`,

        location_finder: `LOCATION ANALYSIS COMPLETE

Search Results for: ${inputValues.location || 'Sydney CBD'}
• Total Restaurants Found: ${Math.floor(Math.random() * 25 + 15)}
• ${inputValues.preference || 'Italian'} Restaurants: ${Math.floor(Math.random() * 8 + 5)}
• Budget Match (${inputValues.budget || '$25-50'}): ${Math.floor(Math.random() * 6 + 3)} restaurants

Geographic Distribution:
• Central Business District: 8 restaurants
• Surrounding Areas (2km radius): 7 restaurants  
• Waterfront Locations: 3 restaurants
• Shopping Districts: 6 restaurants

Accessibility Features:
• Wheelchair Accessible: 85% of locations
• Public Transport Access: 92% within 500m
• Parking Available: 76% of locations
• Delivery Available: 68% offer delivery service

Distance Analysis:
• Average distance from center: 1.2km
• Closest option: 0.3km (5-minute walk)
• Furthest option: 2.8km (35-minute walk)`,

        rating_evaluator: `RATING EVALUATION COMPLETE

Overall Rating Analysis:
• Average Rating: 4.${Math.floor(Math.random() * 4 + 5)}/5 stars
• Total Reviews Analyzed: ${Math.floor(Math.random() * 500 + 200).toLocaleString()}
• Review Sentiment: 89% Positive

Rating Distribution:
• 5 Stars: 64% of reviews
• 4 Stars: 25% of reviews  
• 3 Stars: 8% of reviews
• 2 Stars: 2% of reviews
• 1 Star: 1% of reviews

Quality Indicators:
• Food Quality: 4.7/5 average
• Service: 4.4/5 average
• Ambiance: 4.6/5 average
• Value for Money: 4.3/5 average

Recent Trend Analysis:
• Last 30 days: +0.2 rating improvement
• Consistent quality across all time periods
• Peak performance during dinner hours (7-9 PM)

Red Flags: None identified - All restaurants maintain high standards.`,

        recommendation_generator: `FINAL RECOMMENDATIONS GENERATED

Match Confidence: ${Math.floor(Math.random() * 15 + 85)}%

TOP RECOMMENDATION: "The Golden Spoon"
• Cuisine: ${inputValues.preference || 'Italian'} (Authentic)
• Rating: 4.8/5 (312 reviews)
• Price Range: ${inputValues.budget || '$25-50'} per person
• Distance: 0.8km from ${inputValues.location || 'Sydney CBD'}
• Specialty: Handmade pasta, wood-fired pizza
• Best For: ${inputValues.party_size || '2'}-person intimate dining

SECOND CHOICE: "Ocean View Bistro"  
• Cuisine: Modern ${inputValues.preference || 'Italian'} Fusion
• Rating: 4.6/5 (187 reviews)
• Price Range: ${inputValues.budget || '$25-50'} per person
• Distance: 1.2km from ${inputValues.location || 'Sydney CBD'}
• Specialty: Seafood fusion, panoramic views
• Best For: Special occasions, romantic dining

THIRD CHOICE: "Local Favorites"
• Cuisine: Traditional ${inputValues.preference || 'Italian'}
• Rating: 4.7/5 (245 reviews)  
• Price Range: ${inputValues.budget || '$25-50'} per person
• Distance: 0.5km from ${inputValues.location || 'Sydney CBD'}
• Specialty: Family recipes, casual atmosphere
• Best For: Comfort food, group dining

Booking Recommendations:
• Optimal Time: 7:30 PM for best service
• Estimated Wait: ${Math.floor(Math.random() * 30 + 15)} minutes (current)
• Reservation Advised: Yes (especially weekends)`
    };
    
    return outputs[agentName] || `Agent ${agentName} executed successfully with optimized results and comprehensive analysis.`;
}

// Main Alpine.js application
function promptEvaluationApp() {
    return {
        // State variables
        workflow: {},
        inputFields: [], // Now populated from dynamic schema
        // inputSets: [{ values: {}, collapsed: false }], // Deprecated - using dynamic forms
        isRunning: false,
        hasResults: false,
        currentStep: 0,
        results: null,
        selectedPromptVersion: '', // Single prompt version for the entire workflow
        revisions: [], // Store available revisions from API
        loading: false,
        
        // Dynamic Forms Properties
        loadingSchema: false,
        schemaLoaded: false,
        schemaError: null,
        dynamicFormData: {},
        lastLoadedWorkflow: null,
        
        // Application Settings
        settings: {
            auto_load_schema: true,        // Automatically load schema on init
            auto_refresh_schema: false,    // Refresh schema when prompt version changes
            schema_timeout: 10000,         // Timeout for schema API calls (ms)
            fallback_to_sample: true,      // Use sample schema if API fails
            validate_schema: true,         // Validate schema structure before use
            auto_update_fields: true       // Update input fields from schema
        },
        
        // Initialize the application
        async init() {
            // Get workflow ID from URL parameters or default to bike_insights
            const urlParams = new URLSearchParams(window.location.search);
            const workflowId = urlParams.get('workflow') || urlParams.get('id') || 'bike_insights';
            
            this.loadWorkflow(workflowId);
            await this.loadRevisionsFromAPI(workflowId);
            this.initializePromptVersion();
            
            // Auto-load dynamic schema for the current workflow
            if (this.settings.auto_load_schema !== false) {
                console.log('Auto-loading schema for workflow:', workflowId);
                await this.loadDynamicSchema(workflowId);
            }
            
            // Set up watchers for automatic schema reloading
            this.setupAutoSchemaReload();
        },

        // Setup automatic schema reloading when workflow changes
        setupAutoSchemaReload() {
            // Watch for workflow changes and auto-reload schema
            this.$watch('workflow', async (newWorkflow, oldWorkflow) => {
                if (newWorkflow && oldWorkflow && newWorkflow.id !== oldWorkflow.id) {
                    console.log(`Workflow changed from ${oldWorkflow.id} to ${newWorkflow.id}`);
                    if (this.settings.auto_load_schema !== false) {
                        await this.loadDynamicSchema(newWorkflow.id);
                    }
                }
            });
            
            // Watch for prompt version changes that might need schema updates
            this.$watch('selectedPromptVersion', async (newVersion, oldVersion) => {
                if (newVersion && newVersion !== oldVersion && this.settings.auto_refresh_schema) {
                    console.log(`Prompt version changed, refreshing schema...`);
                    await this.loadDynamicSchema(this.workflow?.id);
                }
            });
        },
        
        // Load workflow configuration
        loadWorkflow(workflowId) {
            const config = WORKFLOW_CONFIGS[workflowId];
            if (config) {
                this.workflow = config;
                // Note: inputFields are now dynamically loaded from schema
                // this.inputFields = config.inputFields; // Removed - now comes from schema
                // this.initializeInputSets(); // Removed - using dynamic forms instead
            }
        },

        // Load revisions from API
        async loadRevisionsFromAPI(workflowId) {
            try {
                this.loading = true;
                console.log('Loading revisions for workflow:', workflowId);
                
                // Fetch workflows list from the API
                const response = await fetch(`${EVALUATION_API_CONFIG.baseUrl}${EVALUATION_API_CONFIG.endpoints.workflowsList}`);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                console.log('Workflows API Response:', data);
                
                // Find the specific workflow
                const workflow = data.workflows.find(w => w.workflow === workflowId);
                
                if (workflow && workflow.revision_id) {
                    // Create revisions data (using revision_id)
                    this.revisions = [{
                        id: workflow.revision_id,
                        name: `${workflow.revision_id}`,
                        date: new Date().toISOString().split('T')[0],
                        description: `Revision ${workflow.revision_id}`,
                        author: 'System',
                        status: 'active'
                    }];
                    
                    console.log('Successfully loaded revisions:', this.revisions.length);
                } else {
                    console.log('No revision found, using fallback');
                    await this.loadFallbackRevisions();
                }
                
            } catch (error) {
                console.error('Error loading revisions:', error);
                await this.loadFallbackRevisions();
            } finally {
                this.loading = false;
            }
        },

        // Fallback revisions when API fails
        async loadFallbackRevisions() {
            console.log('Loading fallback revisions...');
            this.revisions = [
                {
                    id: 'v3',
                    name: 'v3',
                    date: '2024-03-10',
                    description: 'Sample revision',
                    author: 'System',
                    status: 'active'
                }
            ];
        },
        
        // Initialize input sets with default values
        initializeInputSets() {
            // Initialize the first input set
            this.inputSets = [{
                values: {},
                collapsed: false,
                enabled: true
            }];
            
            // Initialize values for the first set
            this.inputFields.forEach(field => {
                this.inputSets[0].values[field.name] = '';
            });
        },
        
        // Add new input set
        addInputSet() {
            const newSet = {
                values: {},
                collapsed: false,
                enabled: true
            };
            
            // Initialize values for the new set
            this.inputFields.forEach(field => {
                newSet.values[field.name] = '';
            });
            
            this.inputSets.push(newSet);
        },
        
        // Remove input set
        removeInputSet(index) {
            if (this.inputSets.length > 1) {
                this.inputSets.splice(index, 1);
            }
        },
        
        // Initialize prompt version
        initializePromptVersion() {
            // Default to latest version
            const versions = this.getAvailableVersions();
            if (versions.length > 0) {
                this.selectedPromptVersion = versions[0].id;
            }
        },
        
        // Get available prompt versions for the workflow
        getAvailableVersions() {
            // Use API-loaded revisions if available
            if (this.revisions && this.revisions.length > 0) {
                return this.revisions.map(revision => ({
                    id: revision.id,
                    display: `${revision.name} (${revision.id})`,
                    date: revision.date,
                    status: revision.status,
                    description: revision.description
                }));
            }
            
            // Fallback to sample versions if no API data
            const workflowVersions = [
                { 
                    id: 'v2.1', 
                    display: 'v2.1 (Latest) - Enhanced accuracy & new features', 
                    date: '2025-08-12', 
                    status: 'latest',
                    description: 'Latest improvements across all agents with enhanced accuracy'
                },
                { 
                    id: 'v2.0', 
                    display: 'v2.0 (Production) - Stable release', 
                    date: '2025-08-05', 
                    status: 'production',
                    description: 'Stable, tested version suitable for production use'
                },
                { 
                    id: 'v1.9', 
                    display: 'v1.9 - Previous stable', 
                    date: '2025-07-28', 
                    status: 'stable',
                    description: 'Previous stable release with proven performance'
                },
                { 
                    id: 'v1.8', 
                    display: 'v1.8 - Legacy support', 
                    date: '2025-07-15', 
                    status: 'legacy',
                    description: 'Legacy version for backward compatibility'
                }
            ];
            
            return workflowVersions;
        },
        
        // Get current version display info
        getCurrentVersionDisplay() {
            if (!this.selectedPromptVersion) return 'None selected';
            
            const versions = this.getAvailableVersions();
            const version = versions.find(v => v.id === this.selectedPromptVersion);
            return version ? version.display : 'Unknown version';
        },
        
        // Select latest version
        selectLatestVersion() {
            const versions = this.getAvailableVersions();
            const latestVersion = versions.find(v => v.status === 'latest');
            if (latestVersion) {
                this.selectedPromptVersion = latestVersion.id;
            }
        },
        
        // Select production version
        selectProductionVersion() {
            const versions = this.getAvailableVersions();
            const productionVersion = versions.find(v => v.status === 'production');
            if (productionVersion) {
                this.selectedPromptVersion = productionVersion.id;
            }
        },
        
        // Get summary for collapsed input set
        getInputSetSummary(inputSet) {
            const filledFields = Object.entries(inputSet.values)
                .filter(([key, value]) => value && value.toString().trim() !== '')
                .length;
            const totalFields = this.inputFields.length;
            return `${filledFields}/${totalFields} fields completed`;
        },
        
        // Validate form inputs
        isFormValid() {
            // Check if at least one enabled input set has all required fields filled
            return this.inputSets.some(inputSet => {
                if (!inputSet.enabled) return false; // Skip disabled sets
                
                const requiredFields = this.inputFields.filter(field => field.required);
                return requiredFields.every(field => 
                    inputSet.values[field.name] && 
                    inputSet.values[field.name].toString().trim() !== ''
                );
            });
        },
        
        // Run evaluation with dynamic form data
        async runEvaluationWithDynamicData() {
            this.isRunning = true;
            this.hasResults = false;
            
            try {
                // Collect data from dynamic forms
                const dynamicFormData = this.collectDynamicFormData();
                console.log('Running evaluation with dynamic data:', dynamicFormData);
                
                // Simulate processing time
                await new Promise(resolve => setTimeout(resolve, 3000));
                
                // Generate results using the dynamic form data
                this.results = generateDummyResults(this.workflow.id, dynamicFormData);
                
                this.isRunning = false;
                this.hasResults = true;
                
            } catch (error) {
                console.error('Error running evaluation:', error);
                this.isRunning = false;
                
                // Show error message to user
                alert('Error running evaluation: ' + error.message);
            }
        },

        // Collect data from all dynamic forms
        collectDynamicFormData() {
            const formData = {};
            
            // Primary method: Get data from the dynamic form generator
            if (window.dynamicFormGenerator && typeof window.dynamicFormGenerator.getFlattenedData === 'function') {
                try {
                    const dynamicData = window.dynamicFormGenerator.getFlattenedData();
                    Object.assign(formData, dynamicData);
                    console.log('Collected data from dynamic forms:', dynamicData);
                } catch (error) {
                    console.warn('Error collecting data from dynamic form generator:', error);
                }
            }
            
            // Fallback method: try to collect data from form elements directly
            if (Object.keys(formData).length === 0) {
                console.log('Fallback: collecting data from form elements directly');
                const container = document.getElementById('dynamicFormsContainer');
                if (container) {
                    const inputs = container.querySelectorAll('input, select, textarea');
                    inputs.forEach(input => {
                        if (input.name || input.id) {
                            const key = input.name || input.id.replace(/^field_/, '').replace(/^.*_/, '');
                            let value = input.value;
                            
                            // Handle different input types
                            if (input.type === 'checkbox') {
                                value = input.checked;
                            } else if (input.type === 'number') {
                                value = input.value ? parseFloat(input.value) : null;
                            } else if (input.type === 'radio' && input.checked) {
                                value = input.value;
                            } else if (input.type === 'radio' && !input.checked) {
                                return; // Skip unchecked radio buttons
                            }
                            
                            if (value !== null && value !== '' && value !== undefined) {
                                formData[key] = value;
                            }
                        }
                    });
                }
            }
            
            // Add metadata
            formData._workflow = this.workflow?.id || 'unknown';
            formData._workflow_name = this.workflow?.name || 'Unknown Workflow';
            formData._timestamp = new Date().toISOString();
            formData._schema_loaded = this.schemaLoaded;
            
            console.log('Final collected form data:', formData);
            return formData;
        },

        // Legacy run evaluation method (kept for compatibility)
        async runEvaluation() {
            // Redirect to the new dynamic method
            return this.runEvaluationWithDynamicData();
        },
        
        // Reset evaluation
        resetEvaluation() {
            this.isRunning = false;
            this.hasResults = false;
            this.currentStep = 0;
            this.results = null;
            this.initializeInputValues();
        },
        
        // Download results
        downloadResults() {
            if (!this.results) return;
            
            const resultsData = {
                workflow: this.workflow.name,
                timestamp: new Date().toISOString(),
                inputParameters: this.inputValues,
                workflowOutput: this.results.workflowOutput,
                agentResults: this.results.agentResults
            };
            
            const dataStr = JSON.stringify(resultsData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${this.workflow.name.replace(/\s+/g, '_')}_evaluation_results.json`;
            link.click();
            URL.revokeObjectURL(url);
        },
        
        // Format workflow output for display
        formatWorkflowOutput(output) {
            return output.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        },
        
        // Get status badge class
        getStatusBadgeClass() {
            if (this.isRunning) return 'bg-warning';
            if (this.hasResults) return 'bg-success';
            return 'bg-info';
        },
        
        // Get status text
        getStatusText() {
            if (this.isRunning) return 'Running';
            if (this.hasResults) return 'Completed';
            return 'Ready';
        },
        
        // Get agent status class
        getAgentStatusClass(status) {
            switch (status.toLowerCase()) {
                case 'success':
                    return 'bg-success';
                case 'warning':
                    return 'bg-warning';
                case 'error':
                    return 'bg-danger';
                default:
                    return 'bg-info';
            }
        },

        // Get agent description from workflow config
        getAgentDescription(agentName) {
            const agent = this.workflow.agents?.find(a => a.agent_name === agentName);
            return agent ? agent.agent_description : 'Specialized workflow agent';
        },

        // Copy agent output to clipboard
        async copyAgentOutput(output) {
            try {
                await navigator.clipboard.writeText(output);
                // You could add a toast notification here
                console.log('Agent output copied to clipboard');
            } catch (err) {
                console.error('Failed to copy to clipboard:', err);
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = output;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
            }
        },
        
        // Dynamic Forms Methods
        async loadDynamicSchema(workflowId = null) {
            this.loadingSchema = true;
            this.schemaError = null;
            
            try {
                // Get the workflow ID/name from parameter, current workflow, or use default
                const workflowName = workflowId || this.workflow?.id || this.workflow?.name || 'bike-insights';
                console.log(`Loading dynamic schema for workflow: ${workflowName}`);
                
                // Try multiple API endpoints for flexibility
                const apiEndpoints = [
                    `${EVALUATION_API_CONFIG.baseUrl}/api/v1/custom-workflows/schema/${workflowName}`,
                    `${EVALUATION_API_CONFIG.baseUrl}/api/v1/workflows/${workflowName}/schema`,
                    `${EVALUATION_API_CONFIG.baseUrl}/api/v1/schema/${workflowName}`
                ];
                
                let backendSchema = null;
                let lastError = null;
                
                // Try each endpoint until one succeeds
                for (const endpoint of apiEndpoints) {
                    try {
                        console.log(`Attempting to load schema from: ${endpoint}`);
                        const response = await fetch(endpoint, {
                            headers: {
                                'Accept': 'application/json',
                                'Content-Type': 'application/json',
                            },
                            // Add timeout to prevent hanging
                            signal: AbortSignal.timeout(10000) // 10 second timeout
                        });
                        
                        if (response.ok) {
                            backendSchema = await response.json();
                            console.log('Backend schema loaded successfully from:', endpoint);
                            break;
                        } else {
                            lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
                        }
                    } catch (error) {
                        lastError = error;
                        console.warn(`Failed to load from ${endpoint}:`, error.message);
                        continue;
                    }
                }
                
                if (!backendSchema) {
                    throw lastError || new Error('All API endpoints failed');
                }
                
                // Validate and process the schema
                if (!this.validateSchemaStructure(backendSchema)) {
                    throw new Error('Invalid schema structure received from API');
                }
                
                console.log('Processing backend schema:', backendSchema);
                
                // Initialize the dynamic form generator with backend schema
                dynamicFormGenerator.initialize(backendSchema);
                
                // Ensure global access for data collection
                window.dynamicFormGenerator = dynamicFormGenerator;
                
                // Render form selector in the container
                dynamicFormGenerator.renderFormSelector('dynamicFormsContainer');
                
                // Update input fields from schema if available
                this.updateInputFieldsFromSchema(backendSchema);
                
                this.schemaLoaded = true;
                this.lastLoadedWorkflow = workflowName;
                console.log('Dynamic schema loaded successfully for workflow:', workflowName);
                
                // Trigger event for other components that might need to know
                document.dispatchEvent(new CustomEvent('schemaLoaded', {
                    detail: { workflowName, schema: backendSchema }
                }));
                
            } catch (error) {
                console.error('Error loading dynamic schema:', error);
                this.schemaError = `Failed to load schema for workflow: ${error.message}`;
                
                // Fallback to sample schema if API fails
                console.log('Falling back to sample schema...');
                this.loadSampleSchema();
            } finally {
                this.loadingSchema = false;
            }
        },

        // Validate schema structure to ensure it's usable
        validateSchemaStructure(schema) {
            if (!schema || typeof schema !== 'object') {
                console.error('Schema is not an object');
                return false;
            }
            
            // Check for expected structure patterns
            const hasSchemas = schema.schemas && typeof schema.schemas === 'object';
            const hasForms = schema.forms && typeof schema.forms === 'object';
            const hasProperties = schema.properties && typeof schema.properties === 'object';
            
            if (!hasSchemas && !hasForms && !hasProperties) {
                console.error('Schema does not contain expected structure (schemas/forms/properties)');
                return false;
            }
            
            return true;
        },

        // Update static input fields based on dynamic schema
        updateInputFieldsFromSchema(schema) {
            try {
                // Extract field definitions from the schema
                let schemaFields = [];
                
                if (schema.schemas) {
                    // Handle backend Pydantic schema format
                    for (const [schemaKey, schemaValue] of Object.entries(schema.schemas)) {
                        if (schemaValue.properties) {
                            const fields = this.extractFieldsFromProperties(schemaValue.properties, schemaValue.required || []);
                            schemaFields = schemaFields.concat(fields);
                        }
                    }
                } else if (schema.forms) {
                    // Handle processed form format
                    for (const form of Object.values(schema.forms)) {
                        if (form.fields) {
                            schemaFields = schemaFields.concat(form.fields);
                        }
                    }
                } else if (schema.properties) {
                    // Handle direct properties format
                    schemaFields = this.extractFieldsFromProperties(schema.properties, schema.required || []);
                }
                
                // Update the current workflow's input fields if we found any
                if (schemaFields.length > 0 && this.workflow) {
                    console.log('Updating workflow input fields from schema:', schemaFields);
                    this.workflow.inputFields = schemaFields;
                    
                    // Update existing input sets to match new fields
                    this.updateInputSetsForNewFields(schemaFields);
                }
                
            } catch (error) {
                console.warn('Failed to update input fields from schema:', error);
            }
        },

        // Extract field definitions from schema properties
        extractFieldsFromProperties(properties, requiredFields = []) {
            const fields = [];
            
            for (const [fieldName, fieldDef] of Object.entries(properties)) {
                const field = {
                    name: fieldName,
                    label: fieldDef.display_name || fieldDef.title || this.formatFieldLabel(fieldName),
                    type: this.mapSchemaTypeToFieldType(fieldDef),
                    required: requiredFields.includes(fieldName),
                    description: fieldDef.description || `Enter ${fieldDef.title || fieldName}`,
                    placeholder: fieldDef.placeholder || `Enter ${fieldDef.title || fieldName}...`
                };
                
                // Add type-specific properties
                if (fieldDef.type === 'number' || fieldDef.type === 'integer') {
                    if (fieldDef.number_config) {
                        field.min = fieldDef.number_config.min;
                        field.max = fieldDef.number_config.max;
                        field.step = fieldDef.number_config.step || (fieldDef.type === 'integer' ? 1 : 0.01);
                    }
                }
                
                // Handle select options
                if (fieldDef.enum || fieldDef.union_options) {
                    field.type = 'select';
                    field.options = fieldDef.enum || fieldDef.union_options || [];
                }
                
                fields.push(field);
            }
            
            return fields;
        },

        // Map schema types to our field types
        mapSchemaTypeToFieldType(fieldDef) {
            switch (fieldDef.ui_component) {
                case 'text_input': return 'text';
                case 'number_input': return 'number';
                case 'textarea': return 'textarea';
                case 'union_select': return 'select';
                default:
                    // Fallback based on type
                    switch (fieldDef.type) {
                        case 'string': return 'text';
                        case 'number':
                        case 'integer': return 'number';
                        case 'array': return 'textarea'; // For simplicity, represent arrays as textarea
                        default: return 'text';
                    }
            }
        },

        // Format field names into readable labels
        formatFieldLabel(fieldName) {
            return fieldName
                .replace(/_/g, ' ')
                .replace(/\b\w/g, l => l.toUpperCase());
        },

        // Update existing input sets when fields change
        updateInputSetsForNewFields(newFields) {
            this.inputSets.forEach(inputSet => {
                // Preserve existing values where field names match
                const existingValues = { ...inputSet.values };
                inputSet.values = {};
                
                newFields.forEach(field => {
                    inputSet.values[field.name] = existingValues[field.name] || '';
                });
            });
        },

        // Auto-load schema when workflow changes
        async autoLoadSchemaForWorkflow() {
            if (this.workflow && this.lastLoadedWorkflow !== this.workflow.id) {
                console.log(`Workflow changed to ${this.workflow.id}, auto-loading schema...`);
                await this.loadDynamicSchema(this.workflow.id);
            }
        },
        
        loadSampleSchema() {
            // Use the actual complex backend API response structure
            const complexBackendSchema = {
                "workflow_name": "bike-insights",
                "schemas": {
                    "RootModel": {
                        "model_name": "RootModel",
                        "title": "RootModel",
                        "description": "Main root model with stores array",
                        "type": "object",
                        "properties": {
                            "stores": {
                                "items": {
                                    "$ref": "#/$defs/RootModel_Store"
                                },
                                "title": "Stores",
                                "type": "array",
                                "ui_component": "array",
                                "validation": {},
                                "alpine_model": "formData.stores",
                                "display_name": "Stores",
                                "array_config": {
                                    "min_items": 0,
                                    "max_items": null,
                                    "item_schema": {
                                        "$ref": "#/$defs/RootModel_Store"
                                    },
                                    "add_button_text": "Add Store",
                                    "remove_button_text": "Remove"
                                }
                            }
                        },
                        "required": ["stores"],
                        "default_values": {
                            "stores": []
                        }
                    },
                    "RootModel_Bike": {
                        "model_name": "RootModel_Bike",
                        "title": "RootModel_Bike",
                        "description": "Bike information with brand, model, year and price",
                        "type": "object",
                        "properties": {
                            "brand": {
                                "title": "Brand",
                                "type": "string",
                                "ui_component": "text_input",
                                "validation": {},
                                "alpine_model": "formData.brand",
                                "display_name": "Brand"
                            },
                            "model": {
                                "title": "Model",
                                "type": "string",
                                "ui_component": "text_input",
                                "validation": {},
                                "alpine_model": "formData.model",
                                "display_name": "Model"
                            },
                            "year": {
                                "title": "Year",
                                "type": "integer",
                                "ui_component": "number_input",
                                "validation": {},
                                "alpine_model": "formData.year",
                                "display_name": "Year",
                                "number_config": {
                                    "min": 1950,
                                    "max": 2025,
                                    "step": 1
                                }
                            },
                            "price": {
                                "title": "Price",
                                "type": "number",
                                "ui_component": "number_input",
                                "validation": {},
                                "alpine_model": "formData.price",
                                "display_name": "Price",
                                "number_config": {
                                    "min": 0,
                                    "max": 50000,
                                    "step": 0.01
                                }
                            }
                        },
                        "required": ["brand", "model", "year", "price"],
                        "default_values": {
                            "brand": "",
                            "model": "",
                            "year": 0,
                            "price": 0
                        }
                    },
                    "RootModel_BikeStock": {
                        "model_name": "RootModel_BikeStock",
                        "title": "RootModel_BikeStock",
                        "description": "Bike stock with bike type selection and quantity",
                        "type": "object",
                        "properties": {
                            "bike": {
                                "anyOf": [
                                    {"$ref": "#/$defs/RootModel_MountainBike"},
                                    {"$ref": "#/$defs/RootModel_RoadBike"},
                                    {"$ref": "#/$defs/RootModel_ElectricBike"}
                                ],
                                "title": "Bike",
                                "ui_component": "union_select",
                                "validation": {},
                                "alpine_model": "formData.bike",
                                "display_name": "Bike Type",
                                "union_options": [
                                    {
                                        "value": "mountain",
                                        "label": "Mountain Bike",
                                        "schema_ref": "#/$defs/RootModel_MountainBike",
                                        "discriminator": "RootModel_MountainBike"
                                    },
                                    {
                                        "value": "road",
                                        "label": "Road Bike",
                                        "schema_ref": "#/$defs/RootModel_RoadBike",
                                        "discriminator": "RootModel_RoadBike"
                                    },
                                    {
                                        "value": "electric",
                                        "label": "Electric Bike",
                                        "schema_ref": "#/$defs/RootModel_ElectricBike",
                                        "discriminator": "RootModel_ElectricBike"
                                    }
                                ]
                            },
                            "quantity": {
                                "title": "Quantity",
                                "type": "integer",
                                "ui_component": "number_input",
                                "validation": {},
                                "alpine_model": "formData.quantity",
                                "display_name": "Quantity",
                                "number_config": {
                                    "min": 0,
                                    "max": 1000,
                                    "step": 1
                                }
                            }
                        },
                        "required": ["bike", "quantity"],
                        "default_values": {
                            "bike": null,
                            "quantity": 0
                        }
                    },
                    "RootModel_BikeSale": {
                        "model_name": "RootModel_BikeSale",
                        "title": "RootModel_BikeSale",
                        "description": "Bike sale record with product details and customer review",
                        "type": "object",
                        "properties": {
                            "product_code": {
                                "title": "Product Code",
                                "type": "string",
                                "ui_component": "text_input",
                                "validation": {},
                                "alpine_model": "formData.product_code",
                                "display_name": "Product Code"
                            },
                            "quantity_sold": {
                                "title": "Quantity Sold",
                                "type": "integer",
                                "ui_component": "number_input",
                                "validation": {},
                                "alpine_model": "formData.quantity_sold",
                                "display_name": "Quantity Sold",
                                "number_config": {
                                    "min": 1,
                                    "max": 100,
                                    "step": 1
                                }
                            },
                            "sale_date": {
                                "title": "Sale Date",
                                "type": "string",
                                "ui_component": "text_input",
                                "validation": {},
                                "alpine_model": "formData.sale_date",
                                "display_name": "Sale Date",
                                "description": "Date in YYYY-MM-DD format"
                            },
                            "year": {
                                "title": "Year",
                                "type": "integer",
                                "ui_component": "number_input",
                                "validation": {},
                                "alpine_model": "formData.year",
                                "display_name": "Year",
                                "number_config": {
                                    "min": 2020,
                                    "max": 2025,
                                    "step": 1
                                }
                            },
                            "month": {
                                "title": "Month",
                                "type": "string",
                                "ui_component": "text_input",
                                "validation": {},
                                "alpine_model": "formData.month",
                                "display_name": "Month"
                            }
                        },
                        "required": ["product_code", "quantity_sold", "sale_date", "year", "month"],
                        "default_values": {
                            "product_code": "",
                            "quantity_sold": 0,
                            "sale_date": "",
                            "year": 2024,
                            "month": ""
                        }
                    },
                    "RootModel_CustomerReview": {
                        "model_name": "RootModel_CustomerReview",
                        "title": "RootModel_CustomerReview",
                        "description": "Customer review with rating and comment",
                        "type": "object",
                        "properties": {
                            "rating": {
                                "title": "Rating",
                                "type": "number",
                                "ui_component": "number_input",
                                "validation": {},
                                "alpine_model": "formData.rating",
                                "display_name": "Rating (1-5)",
                                "description": "Rate from 1 (poor) to 5 (excellent)",
                                "number_config": {
                                    "min": 1,
                                    "max": 5,
                                    "step": 0.1
                                }
                            },
                            "comment": {
                                "title": "Comment",
                                "type": "string",
                                "ui_component": "textarea",
                                "validation": {
                                    "min_length": 10,
                                    "max_length": 500
                                },
                                "alpine_model": "formData.comment",
                                "display_name": "Review Comment",
                                "description": "Your detailed review"
                            }
                        },
                        "required": ["rating", "comment"],
                        "default_values": {
                            "rating": 5,
                            "comment": ""
                        }
                    }
                },
                "metadata": {
                    "generated_at": new Date().toISOString(),
                    "total_models": 6,
                    "alpine_version": "3.x",
                    "features": {
                        "validation": true,
                        "nested_objects": true,
                        "arrays": true,
                        "unions": true,
                        "conditional_fields": true
                    }
                }
            };
            
            // Initialize with complex backend schema (will auto-convert from backend format)
            dynamicFormGenerator.initialize(complexBackendSchema);
            
            // Ensure global access for data collection
            window.dynamicFormGenerator = dynamicFormGenerator;
            
            dynamicFormGenerator.renderFormSelector('dynamicFormsContainer');
            
            this.schemaLoaded = true;
            this.schemaError = null;
            console.log('Complex backend schema loaded with multiple form types');
        },
        
        // Method to test with real backend schema format
        async loadRealBackendSchema() {
            try {
                // Load the test file with real backend response
                const response = await fetch('../../test_real_backend_schema.json');
                const realBackendSchema = await response.json();
                
                // Initialize with real backend schema
                dynamicFormGenerator.initialize(realBackendSchema);
                dynamicFormGenerator.renderFormSelector('dynamicFormsContainer');
                
                this.schemaLoaded = true;
                this.schemaError = null;
                console.log('Real backend schema loaded for testing');
                
            } catch (error) {
                console.error('Error loading real backend schema:', error);
                this.schemaError = `Failed to load test schema: ${error.message}`;
            }
        },

        // Manually refresh input fields from current schema
        refreshInputFieldsFromSchema() {
            if (!this.schemaLoaded || !dynamicFormGenerator.schema) {
                console.warn('No schema loaded to refresh from');
                return;
            }
            
            try {
                console.log('Refreshing input fields from loaded schema...');
                this.updateInputFieldsFromSchema(dynamicFormGenerator.schema);
                
                // Show user feedback
                const alertContainer = document.getElementById('dynamicFormsContainer');
                if (alertContainer) {
                    const successAlert = document.createElement('div');
                    successAlert.className = 'alert alert-success alert-dismissible fade show mt-2';
                    successAlert.innerHTML = `
                        <i class="bi bi-check-circle me-2"></i>
                        <strong>Success:</strong> Input parameters updated from schema.
                        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                    `;
                    alertContainer.appendChild(successAlert);
                    
                    // Auto-remove after 3 seconds
                    setTimeout(() => {
                        if (successAlert.parentNode) {
                            successAlert.remove();
                        }
                    }, 3000);
                }
            } catch (error) {
                console.error('Failed to refresh input fields:', error);
            }
        },

        // Get schema loading status for UI
        getSchemaStatus() {
            if (this.loadingSchema) return { type: 'loading', message: 'Loading schema...' };
            if (this.schemaError) return { type: 'error', message: 'Schema error (using fallback)' };
            if (this.schemaLoaded) return { type: 'success', message: `Schema loaded for ${this.lastLoadedWorkflow || this.workflow?.id}` };
            return { type: 'none', message: 'No schema loaded' };
        }
    };
}

// Dynamic Forms Integration
document.addEventListener('DOMContentLoaded', function() {
    // Listen for dynamic form submissions
    document.addEventListener('dynamicFormSubmitted', function(event) {
        const { formId, data } = event.detail;
        console.log('Dynamic form submitted:', formId, data);
        
        // Get the Alpine.js app instance
        const appElement = document.querySelector('[x-data="promptEvaluationApp()"]');
        if (appElement && appElement._x_dataStack) {
            const app = appElement._x_dataStack[0];
            
            // Store the dynamic form data in the app
            app.dynamicFormData[formId] = data;
            
            // Optionally trigger evaluation with the dynamic data
            if (app.settings.auto_evaluate) {
                app.runEvaluation();
            }
        }
    });
    
    // Listen for form validation errors
    document.addEventListener('dynamicFormValidationError', function(event) {
        const { formId, errors } = event.detail;
        console.warn('Dynamic form validation errors:', formId, errors);
        
        // Show user-friendly error message
        const alertContainer = document.getElementById('dynamicFormsContainer');
        if (alertContainer) {
            const errorAlert = document.createElement('div');
            errorAlert.className = 'alert alert-warning alert-dismissible fade show mt-3';
            errorAlert.innerHTML = `
                <strong>Validation Error:</strong> Please check the form fields and try again.
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            `;
            alertContainer.appendChild(errorAlert);
            
            // Auto-remove after 5 seconds
            setTimeout(() => {
                if (errorAlert.parentNode) {
                    errorAlert.remove();
                }
            }, 5000);
        }
    });
});
