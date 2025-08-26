// Workflow Process JavaScript with Alpine.js

// API Configuration for workflow process
const WORKFLOW_API_CONFIG = {
    baseUrl: 'http://localhost:8000', // API base URL
    endpoints: {
        allWorkflows: '/api/v1/workflows', // New endpoint for getting all workflows
        workflowDetails: '/api/v1/workflows/{workflowId}',
        workflowAgents: '/api/v1/custom-workflows/agents/{workflow-name}',
        runWorkflow: '/api/v1/workflows/{workflowId}/run',
        editPrompt: '/api/v1/agents/{agentName}/prompt',
        viewLogs: '/api/v1/agents/{agentName}/logs'
    }
};

// Sample API response data for bike-insights workflow
const SAMPLE_API_RESPONSE = {
    "bike-insights": {
        "workflow_name": "bike_insights",
        "normalized_workflow_name": "bike_insights",
        "discovered_from": "source_code_parsing",
        "agent_count": 5,
        "agents": [
            {
                "agent_name": "customer_sentiment_agent",
                "agent_model_name": "gpt-4.1-nano",
                "agent_display_name": "Customer Sentiment",
                "agent_description": "A sample agent.",
                "agent_type": "researcher"
            },
            {
                "agent_name": "fiscal_analysis_agent",
                "agent_model_name": "gpt-4.1-nano",
                "agent_display_name": "Fiscal Analysis",
                "agent_description": "A sample agent.",
                "agent_type": "researcher"
            },
            {
                "agent_name": "summary",
                "agent_model_name": "gpt-4.1-nano",
                "agent_display_name": "Summarizer",
                "agent_description": "A sample agent.",
                "agent_type": "summary"
            },
            {
                "agent_name": "user_proxy",
                "agent_model_name": "gpt-4.1-nano",
                "agent_display_name": "user_proxy_agent",
                "agent_description": "A sample agent.",
                "agent_type": "user_proxy"
            },
            {
                "agent_name": "bike_lookup_agent",
                "agent_model_name": "gpt-4.1-nano",
                "agent_display_name": "bike_lookup_agent",
                "agent_description": "A sample agent.",
                "agent_type": "user_proxy"
            }
        ]
    },
    "restaurant_recommender": {
        "workflow_name": "restaurant_recommender",
        "normalized_workflow_name": "restaurant_recommender", 
        "discovered_from": "source_code_parsing",
        "agent_count": 4,
        "agents": [
            {
                "agent_name": "preference_analysis_agent",
                "agent_model_name": "gpt-4.1-nano",
                "agent_display_name": "Preference Analyzer",
                "agent_description": "A sample agent for analyzing preferences.",
                "agent_type": "researcher"
            },
            {
                "agent_name": "restaurant_matching_agent",
                "agent_model_name": "gpt-4.1-nano",
                "agent_display_name": "Restaurant Matcher",
                "agent_description": "A sample agent for matching restaurants.",
                "agent_type": "researcher"
            },
            {
                "agent_name": "summary",
                "agent_model_name": "gpt-4.1-nano",
                "agent_display_name": "Summarizer",
                "agent_description": "A sample agent for summarizing results.",
                "agent_type": "summary"
            },
            {
                "agent_name": "user_proxy",
                "agent_model_name": "gpt-4.1-nano",
                "agent_display_name": "User Proxy",
                "agent_description": "A sample user proxy agent.",
                "agent_type": "user_proxy"
            }
        ]
    }
};

// Sample workflows API response (same as used in workflow hub)
const SAMPLE_WORKFLOWS_API = {
    "workflows": [
        {
            "workflow": "bike_insights",
            "description": "Sample domain-specific workflow for bike sales analysis",
            "category": "Minimal Configuration",
            "configured": true,
            "missing_config": [],
            "required_config": [
                "models",
                "chat_service"
            ],
            "external_services": [
                "Azure OpenAI"
            ],
            "ready": true,
            "test_command": "curl -X POST http://localhost:80/api/v1/chat -H \"Content-Type: application/json\" -d '{\"user_prompt\": \"Hello\", \"conversation_flow\": \"bike_insights\"}'",
            "documentation": "See docs/workflows/README.md for detailed setup instructions",
            "supported_names": [
                "bike_insights",
                "bike-insights"
            ]
        },
        {
            "workflow": "classification_agent",
            "description": "Route input to specialized agents based on content",
            "category": "Minimal Configuration",
            "configured": true,
            "missing_config": [],
            "required_config": [
                "models",
                "chat_service"
            ],
            "external_services": [
                "Azure OpenAI"
            ],
            "ready": true,
            "test_command": "curl -X POST http://localhost:80/api/v1/chat -H \"Content-Type: application/json\" -d '{\"user_prompt\": \"Hello\", \"conversation_flow\": \"classification_agent\"}'",
            "documentation": "See docs/workflows/README.md for detailed setup instructions",
            "supported_names": [
                "classification_agent",
                "classification-agent"
            ]
        },
        {
            "workflow": "knowledge_base_agent",
            "description": "Search and retrieve information from knowledge bases using ChromaDB",
            "category": "Minimal Configuration",
            "configured": true,
            "missing_config": [],
            "required_config": [
                "models",
                "chat_service"
            ],
            "external_services": [
                "Azure OpenAI"
            ],
            "ready": true,
            "test_command": "curl -X POST http://localhost:80/api/v1/chat -H \"Content-Type: application/json\" -d '{\"user_prompt\": \"Hello\", \"conversation_flow\": \"knowledge_base_agent\"}'",
            "documentation": "See docs/workflows/README.md for detailed setup instructions",
            "supported_names": [
                "knowledge_base_agent",
                "knowledge-base-agent"
            ]
        },
        {
            "workflow": "restaurant_recommender",
            "description": "Custom Workflow",
            "category": "Custom Workflow",
            "configured": true,
            "missing_config": [],
            "required_config": [
                "models",
                "chat_service"
            ],
            "external_services": [
                "Azure OpenAI"
            ],
            "ready": true,
            "test_command": "curl -X POST http://localhost:80/api/v1/chat -H \"Content-Type: application/json\" -d '{\"user_prompt\": \"Hello\", \"conversation_flow\": \"restaurant_recommender\"}'",
            "documentation": "See docs/workflows/README.md for detailed setup instructions",
            "supported_names": [
                "restaurant_recommender",
                "restaurant-recommender"
            ]
        }
    ]
};

// Sample data for bike insights and restaurant recommender workflows
const SAMPLE_WORKFLOWS = {
    bike_insights: {
        id: 'bike_insights',
        name: 'Bike Insights',
        description: 'Comprehensive analysis workflow for bicycle sharing data with predictive analytics and user behavior insights.',
        status: 'ready',
        agents: [
            {
                agent_name: "customer_sentiment_agent",
                agent_model_name: "gpt-4.1-nano",
                agent_display_name: "Customer Sentiment",
                agent_description: "Analyzes customer feedback and sentiment from bike sharing reviews and comments.",
                agent_type: "researcher",
                log_to_prompt_tuner: true,
                return_in_response: false,
                prompt_file: "customer_sentiment_agent.md"
            },
            {
                agent_name: "fiscal_analysis_agent",
                agent_model_name: "gpt-4.1-nano",
                agent_display_name: "Fiscal Analysis",
                agent_description: "Performs financial analysis and cost optimization for bike sharing operations.",
                agent_type: "researcher",
                log_to_prompt_tuner: true,
                return_in_response: false,
                prompt_file: "fiscal_analysis_agent.md"
            },
            {
                agent_name: "bike_lookup_agent",
                agent_model_name: "gpt-4.1-nano",
                agent_display_name: "Bike Lookup Agent",
                agent_description: "Handles bike availability lookups and station management queries.",
                agent_type: "user_proxy",
                log_to_prompt_tuner: true,
                return_in_response: false,
                prompt_file: "bike_lookup_agent.md"
            },
            {
                agent_name: "summary",
                agent_model_name: "gpt-4.1-nano",
                agent_display_name: "Summarizer",
                agent_description: "Compiles comprehensive insights and recommendations from all analysis agents.",
                agent_type: "summary",
                log_to_prompt_tuner: true,
                return_in_response: true,
                prompt_file: "summary_agent.md"
            },
            {
                agent_name: "user_proxy",
                agent_model_name: "gpt-4.1-nano",
                agent_display_name: "User Proxy Agent",
                agent_description: "Orchestrates the conversation flow and manages user interactions.",
                agent_type: "user_proxy",
                log_to_prompt_tuner: false,
                return_in_response: false,
                prompt_file: "user_proxy_agent.md"
            }
        ]
    },
    restaurant_recommender: {
        id: 'restaurant_recommender',
        name: 'Restaurant Recommender',
        description: 'Intelligent restaurant recommendation system using location, preferences, and real-time data for personalized suggestions.',
        status: 'ready',
        agents: [
            {
                agent_name: "preference_analysis_agent",
                agent_model_name: "gpt-4.1-nano",
                agent_display_name: "Preference Analyzer",
                agent_description: "Analyzes user preferences and dining requirements including dietary restrictions and cuisine types.",
                agent_type: "researcher",
                log_to_prompt_tuner: true,
                return_in_response: false,
                prompt_file: "preference_analysis_agent.md"
            },
            {
                agent_name: "restaurant_matching_agent",
                agent_model_name: "gpt-4.1-nano",
                agent_display_name: "Restaurant Matcher",
                agent_description: "Matches restaurants to user preferences and requirements using advanced filtering algorithms.",
                agent_type: "researcher",
                log_to_prompt_tuner: true,
                return_in_response: false,
                prompt_file: "restaurant_matching_agent.md"
            },
            {
                agent_name: "review_analysis_agent",
                agent_model_name: "gpt-4.1-nano",
                agent_display_name: "Review Analyzer",
                agent_description: "Analyzes restaurant ratings, reviews, and quality factors from multiple sources.",
                agent_type: "researcher",
                log_to_prompt_tuner: true,
                return_in_response: false,
                prompt_file: "review_analysis_agent.md"
            },
            {
                agent_name: "location_logistics_agent",
                agent_model_name: "gpt-4.1-nano",
                agent_display_name: "Location Analyst",
                agent_description: "Analyzes location convenience, accessibility, and logistics for optimal dining experience.",
                agent_type: "researcher",
                log_to_prompt_tuner: true,
                return_in_response: false,
                prompt_file: "location_logistics_agent.md"
            },
            {
                agent_name: "summary",
                agent_model_name: "gpt-4.1-nano",
                agent_display_name: "Recommendation Summarizer",
                agent_description: "Compiles final restaurant recommendations with detailed explanations and alternatives.",
                agent_type: "summary",
                log_to_prompt_tuner: true,
                return_in_response: true,
                prompt_file: "recommendation_summary_agent.md"
            },
            {
                agent_name: "user_proxy",
                agent_model_name: "gpt-4.1-nano",
                agent_display_name: "User Proxy",
                agent_description: "Orchestrates the restaurant recommendation process and manages user interactions.",
                agent_type: "user_proxy",
                log_to_prompt_tuner: false,
                return_in_response: false,
                prompt_file: "user_proxy_agent.md"
            }
        ]
    }
};

// Alpine.js data for workflow process page
function workflowProcessApp() {
    return {
        workflow: {
            id: '',
            name: 'Loading...',
            description: 'Loading workflow details...',
            status: 'loading',
            agents: []
        },
        currentStep: -1, // Start with no active step
        loading: false,
        error: null,
        
        // Initialize the application
        async init() {
            const workflowId = this.getWorkflowIdFromUrl();
            if (workflowId) {
                await this.loadWorkflowDetails(workflowId);
            } else {
                this.error = 'No workflow ID specified';
                console.error('No workflow ID found in URL');
            }
        },
        
        // Get workflow ID from URL parameters
        getWorkflowIdFromUrl() {
            const urlParams = new URLSearchParams(window.location.search);
            return urlParams.get('id') || urlParams.get('workflow');
        },
        
        // Load workflow details
        async loadWorkflowDetails(workflowId) {
            this.loading = true;
            
            try {
                // First, get the workflow name and description from the workflows API
                const workflowInfo = await this.getWorkflowInfo(workflowId);
                
                if (workflowInfo) {
                    this.workflow.name = workflowInfo.workflow.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    this.workflow.description = workflowInfo.description;
                    this.workflow.status = workflowInfo.ready ? 'ready' : 'development';
                }
                
                // Then load workflow agents from the agents API endpoint
                await this.loadWorkflowAgents(workflowId);
                
            } catch (error) {
                console.error('Error loading workflow details:', error);
                this.error = error.message;
                // Fallback to sample data if available
                if (SAMPLE_WORKFLOWS[workflowId]) {
                    this.workflow = SAMPLE_WORKFLOWS[workflowId];
                }
            } finally {
                this.loading = false;
            }
        },
        
        // Get workflow info from the workflows API (same as used in workflow hub)
        async getWorkflowInfo(workflowId) {
            try {
                const response = await fetch(`${WORKFLOW_API_CONFIG.baseUrl}${WORKFLOW_API_CONFIG.endpoints.allWorkflows}`);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                
                // Find the workflow by ID, supporting both formats (bike_insights and bike-insights)
                const workflow = data.workflows.find(w => 
                    w.workflow === workflowId || 
                    w.supported_names?.includes(workflowId) ||
                    w.workflow.replace(/-/g, '_') === workflowId ||
                    w.workflow.replace(/_/g, '-') === workflowId
                );
                
                if (workflow) {
                    console.log('Found workflow info from API:', workflow);
                    return workflow;
                } else {
                    throw new Error(`Workflow '${workflowId}' not found in workflows API`);
                }
                
            } catch (error) {
                console.error('Error fetching workflow info from API:', error);
                // Fallback to sample workflows API data
                const workflow = SAMPLE_WORKFLOWS_API.workflows.find(w => 
                    w.workflow === workflowId || 
                    w.supported_names?.includes(workflowId) ||
                    w.workflow.replace(/-/g, '_') === workflowId ||
                    w.workflow.replace(/_/g, '-') === workflowId
                );
                
                if (workflow) {
                    console.log('Using sample workflow info:', workflow);
                    return workflow;
                }
                
                throw error;
            }
        },
        
        // Load workflow agents from API
        async loadWorkflowAgents(workflowName) {
            try {
                const apiUrl = `${WORKFLOW_API_CONFIG.baseUrl}${WORKFLOW_API_CONFIG.endpoints.workflowAgents.replace('{workflow-name}', workflowName)}`;
                console.log('Attempting to fetch agents from:', apiUrl);
                
                const response = await fetch(apiUrl);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                
                // Update workflow with agents data only (preserve name/description from workflows API)
                this.workflow.id = data.workflow_name;
                this.workflow.agents = data.agents || []; // Ensure agents is always an array
                
                console.log('Loaded workflow agents from API:', data);
                
                // Log if no agents were found
                if (!data.agents || data.agents.length === 0) {
                    console.warn('No agents found for workflow:', workflowName);
                }
                
            } catch (error) {
                console.error('Error loading workflow agents from API:', error);
                // No fallback data - just set empty agents array to show "not found" message
                this.workflow.agents = [];
                console.warn('No agents data available for workflow:', workflowName);
            }
        },
        
        // Get status badge class
        getStatusBadgeClass(status) {
            const statusClasses = {
                'ready': 'bg-success',
                'development': 'bg-warning',
                'maintenance': 'bg-secondary',
                'error': 'bg-danger',
                'running': 'bg-primary'
            };
            return statusClasses[status] || 'bg-secondary';
        },
        
        // Format status text
        formatStatus(status) {
            return status.charAt(0).toUpperCase() + status.slice(1);
        },
        
        // Run evaluation
        async runEvaluation() {
            if (!this.workflow.id || this.workflow.agents.length === 0) return;
            
            // Redirect to prompt evaluation page with workflow parameter
            window.location.href = `prompt-evaluation.html?workflow=${this.workflow.id}`;
        },
        
        // Simulate workflow execution with progress
        async simulateWorkflowExecution() {
            const steps = this.workflow.agents.length;
            
            for (let i = 0; i < steps; i++) {
                this.currentStep = i;
                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between steps
            }
            
            alert('Workflow execution completed successfully!');
            this.currentStep = -1; // Reset to no active step
        },
        
        // Manage prompts
        managePrompts() {
            if (!this.workflow.id || this.workflow.agents.length === 0) return;
            
            console.log('Manage prompts for workflow:', this.workflow.id);
            
            // Redirect to manage prompts page with workflow information
            const params = new URLSearchParams({
                workflowId: this.workflow.id,
                workflowName: this.workflow.name
            });
            
            window.location.href = `manage-prompts.html?${params.toString()}`;
        }
    };
}

// Export for use in HTML
window.workflowProcessApp = workflowProcessApp;
