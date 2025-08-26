/**
 * Improved Dynamic Form Generator
 * Following the systematic approach from json_schema_to_form.md
 * 
 * This class implements a robust schema-to-form generation system that:
 * 1. Properly analyzes JSON schema structure
 * 2. Handles both RootModel (unified) and multi-model patterns
 * 3. Resolves references accurately
 * 4. Generates consistent Bootstrap 5 forms
 * 5. Provides proper error handling and validation
 */

class ImprovedDynamicFormGenerator {
    constructor() {
        this.rawSchema = null;
        this.processedSchema = null;
        this.formData = {};
        this.validationErrors = {};
        this.generatedForms = new Map();
        this.referenceCache = new Map();
        
        // Configuration
        this.config = {
            debug: true,
            validateReferences: true,
            generateValidation: true,
            responsiveDesign: true
        };
    }

    /**
     * STEP 1: SCHEMA STRUCTURE ANALYSIS
     * Analyzes the incoming schema and determines the generation strategy
     */
    analyzeSchema(schema) {
        this.log('Starting schema analysis...', schema);

        const analysis = {
            workflowName: schema.workflow_name || 'unknown',
            schemaType: this.detectSchemaType(schema),
            models: this.extractModels(schema),
            complexity: this.assessComplexity(schema),
            errors: []
        };

        // Validate schema integrity
        const validation = this.validateSchemaIntegrity(schema);
        if (!validation.isValid) {
            analysis.errors = validation.errors;
            throw new Error(`Invalid schema: ${validation.errors.join(', ')}`);
        }

        this.log('Schema analysis complete:', analysis);
        return analysis;
    }

    /**
     * Detect if this is a RootModel (unified) or multi-model schema
     */
    detectSchemaType(schema) {
        if (!schema.schemas || typeof schema.schemas !== 'object') {
            return { type: 'invalid', reason: 'No schemas object found' };
        }

        const modelKeys = Object.keys(schema.schemas);
        const hasRootModel = modelKeys.includes('RootModel');
        
        if (hasRootModel) {
            const rootModel = schema.schemas.RootModel;
            const hasArrayProperties = this.hasArrayProperties(rootModel);
            
            return {
                type: 'unified',
                pattern: 'RootModel',
                hasArrays: hasArrayProperties,
                complexity: hasArrayProperties ? 'high' : 'medium'
            };
        } else {
            return {
                type: 'multi-model',
                pattern: 'separate',
                modelCount: modelKeys.length,
                complexity: modelKeys.length > 3 ? 'high' : 'medium'
            };
        }
    }

    /**
     * Extract and catalog all models in the schema
     */
    extractModels(schema) {
        const models = new Map();
        
        // Process main schemas
        for (const [modelName, modelDef] of Object.entries(schema.schemas || {})) {
            models.set(modelName, {
                name: modelName,
                title: modelDef.title || modelName,
                description: modelDef.description || '',
                type: modelDef.type || 'object',
                properties: modelDef.properties || {},
                required: modelDef.required || [],
                uiMetadata: modelDef.ui_metadata || {},
                defaultValues: modelDef.default_values || {},
                isRootModel: modelName === 'RootModel'
            });
        }

        // Process definitions if they exist
        if (schema.definitions) {
            for (const [defName, defModel] of Object.entries(schema.definitions)) {
                if (!models.has(defName)) {
                    models.set(defName, {
                        name: defName,
                        title: defModel.title || defName,
                        description: defModel.description || '',
                        type: defModel.type || 'object',
                        properties: defModel.properties || {},
                        required: defModel.required || [],
                        isDefinition: true
                    });
                }
            }
        }

        return models;
    }

    /**
     * Check if a model has array properties (indicates complex form needs)
     */
    hasArrayProperties(model) {
        if (!model.properties) return false;
        
        return Object.values(model.properties).some(prop => 
            prop.type === 'array' || prop.items
        );
    }

    /**
     * Assess the overall complexity of the schema
     */
    assessComplexity(schema) {
        const modelCount = Object.keys(schema.schemas || {}).length;
        const totalFields = this.countTotalFields(schema);
        const referenceCount = this.countReferences(schema);
        
        let complexity = 'low';
        if (modelCount > 5 || totalFields > 20 || referenceCount > 10) {
            complexity = 'high';
        } else if (modelCount > 2 || totalFields > 10 || referenceCount > 5) {
            complexity = 'medium';
        }

        return {
            level: complexity,
            modelCount,
            totalFields,
            referenceCount,
            metrics: {
                models: modelCount,
                fields: totalFields,
                references: referenceCount
            }
        };
    }

    /**
     * STEP 2: FIELD ANALYSIS & MAPPING
     * Processes each field to extract all necessary information
     */
    analyzeField(fieldName, fieldDef, context = {}) {
        const field = {
            name: fieldName,
            originalDef: fieldDef,
            context: context
        };

        // Basic properties
        field.title = fieldDef.title || this.formatFieldName(fieldName);
        field.type = fieldDef.type || 'string';
        field.description = fieldDef.description || '';
        field.required = context.required?.includes(fieldName) || false;

        // UI component mapping
        field.uiComponent = this.mapUIComponent(fieldDef);
        field.inputType = this.mapInputType(fieldDef);
        field.displayName = fieldDef.display_name || field.title;
        field.alpineModel = fieldDef.alpine_model || `formData.${fieldName}`;

        // Validation rules
        field.validation = this.extractValidation(fieldDef);

        // Special handling for different types
        if (field.type === 'array') {
            field.arrayConfig = this.processArrayConfig(fieldDef);
        } else if (field.type === 'object' || fieldDef.$ref) {
            field.objectConfig = this.processObjectConfig(fieldDef);
        } else if (fieldDef.enum) {
            field.enumOptions = this.processEnumOptions(fieldDef.enum);
        }

        this.log(`Analyzed field ${fieldName}:`, field);
        return field;
    }

    /**
     * Map schema UI component to actual input type
     */
    mapUIComponent(fieldDef) {
        const uiComponent = fieldDef.ui_component;
        const type = fieldDef.type;
        const format = fieldDef.format;

        // Explicit UI component mapping
        const componentMap = {
            'text_input': 'text',
            'number_input': 'number',
            'textarea': 'textarea',
            'select': 'select',
            'checkbox': 'checkbox',
            'radio': 'radio',
            'date_input': 'date',
            'email_input': 'email',
            'url_input': 'url',
            'array': 'dynamic-array',
            'union_select': 'select'
        };

        if (componentMap[uiComponent]) {
            return componentMap[uiComponent];
        }

        // Fallback based on type and format
        if (type === 'string') {
            if (format === 'email') return 'email';
            if (format === 'date') return 'date';
            if (format === 'url') return 'url';
            if (format === 'textarea') return 'textarea';
            return 'text';
        } else if (type === 'number' || type === 'integer') {
            return 'number';
        } else if (type === 'boolean') {
            return 'checkbox';
        } else if (type === 'array') {
            return 'dynamic-array';
        } else if (fieldDef.enum) {
            return 'select';
        }

        return 'text'; // Safe fallback
    }

    /**
     * Map to HTML input type
     */
    mapInputType(fieldDef) {
        const component = this.mapUIComponent(fieldDef);
        
        const inputTypeMap = {
            'text': 'text',
            'number': 'number',
            'email': 'email',
            'date': 'date',
            'url': 'url',
            'checkbox': 'checkbox',
            'radio': 'radio'
        };

        return inputTypeMap[component] || 'text';
    }

    /**
     * Extract validation rules from field definition
     */
    extractValidation(fieldDef) {
        const validation = {
            rules: {},
            messages: {}
        };

        // Basic validation
        if (fieldDef.validation) {
            Object.assign(validation.rules, fieldDef.validation);
        }

        // Type-specific validation
        if (fieldDef.type === 'number' || fieldDef.type === 'integer') {
            if (fieldDef.minimum !== undefined) validation.rules.min = fieldDef.minimum;
            if (fieldDef.maximum !== undefined) validation.rules.max = fieldDef.maximum;
        }

        if (fieldDef.type === 'string') {
            if (fieldDef.minLength !== undefined) validation.rules.minLength = fieldDef.minLength;
            if (fieldDef.maxLength !== undefined) validation.rules.maxLength = fieldDef.maxLength;
            if (fieldDef.pattern) validation.rules.pattern = fieldDef.pattern;
        }

        // Array validation
        if (fieldDef.type === 'array' && fieldDef.array_config) {
            if (fieldDef.array_config.min_items !== undefined) {
                validation.rules.minItems = fieldDef.array_config.min_items;
            }
            if (fieldDef.array_config.max_items !== undefined) {
                validation.rules.maxItems = fieldDef.array_config.max_items;
            }
        }

        return validation;
    }

    /**
     * STEP 3: NESTED STRUCTURES HANDLING
     * Process array configurations
     */
    processArrayConfig(fieldDef) {
        const config = {
            itemSchema: null,
            minItems: 0,
            maxItems: null,
            addButtonText: 'Add Item',
            removeButtonText: 'Remove',
            canReorder: true
        };

        if (fieldDef.array_config) {
            config.minItems = fieldDef.array_config.min_items || 0;
            config.maxItems = fieldDef.array_config.max_items || null;
            config.addButtonText = fieldDef.array_config.add_button_text || config.addButtonText;
            config.removeButtonText = fieldDef.array_config.remove_button_text || config.removeButtonText;
        }

        // Resolve item schema
        if (fieldDef.items) {
            if (fieldDef.items.$ref) {
                config.itemSchema = this.resolveReference(fieldDef.items.$ref);
            } else {
                config.itemSchema = fieldDef.items;
            }
        }

        return config;
    }

    /**
     * Process object configurations and references
     */
    processObjectConfig(fieldDef) {
        const config = {
            properties: {},
            required: [],
            nested: false
        };

        if (fieldDef.$ref) {
            const resolved = this.resolveReference(fieldDef.$ref);
            if (resolved) {
                config.properties = resolved.properties || {};
                config.required = resolved.required || [];
                config.nested = true;
                config.referencedModel = fieldDef.$ref;
            }
        } else if (fieldDef.properties) {
            config.properties = fieldDef.properties;
            config.required = fieldDef.required || [];
        }

        return config;
    }

    /**
     * Process enum options for select fields
     */
    processEnumOptions(enumValues) {
        return enumValues.map(value => ({
            value: value,
            label: this.formatEnumLabel(value),
            selected: false
        }));
    }

    /**
     * STEP 4: REFERENCE RESOLUTION
     * Resolve $ref references to actual schema definitions
     */
    resolveReference(ref) {
        if (this.referenceCache.has(ref)) {
            return this.referenceCache.get(ref);
        }

        this.log(`Resolving reference: ${ref}`);

        // Handle different reference patterns
        let resolvedSchema = null;

        if (ref.startsWith('#/$defs/')) {
            const defName = ref.replace('#/$defs/', '');
            resolvedSchema = this.findInDefinitions(defName);
        } else if (ref.startsWith('#/definitions/')) {
            const defName = ref.replace('#/definitions/', '');
            resolvedSchema = this.findInDefinitions(defName);
        } else if (ref.startsWith('#/schemas/')) {
            const schemaName = ref.replace('#/schemas/', '');
            resolvedSchema = this.rawSchema.schemas?.[schemaName];
        } else {
            // Try direct schema lookup
            const refName = ref.replace(/^#\/.*\//, '');
            resolvedSchema = this.rawSchema.schemas?.[refName] || this.findInDefinitions(refName);
        }

        if (resolvedSchema) {
            this.referenceCache.set(ref, resolvedSchema);
            this.log(`Successfully resolved reference ${ref}:`, resolvedSchema);
        } else {
            this.log(`Failed to resolve reference: ${ref}`, 'error');
        }

        return resolvedSchema;
    }

    /**
     * Find schema in definitions sections
     */
    findInDefinitions(defName) {
        // Check main definitions
        if (this.rawSchema.definitions?.[defName]) {
            return this.rawSchema.definitions[defName];
        }

        // Check if it's in schemas (common pattern)
        if (this.rawSchema.schemas?.[defName]) {
            return this.rawSchema.schemas[defName];
        }

        // Check for variations in naming
        const variations = [
            defName,
            `RootModel_${defName}`,
            defName.replace('RootModel_', ''),
            this.camelToSnake(defName),
            this.snakeToCamel(defName)
        ];

        for (const variation of variations) {
            if (this.rawSchema.schemas?.[variation]) {
                return this.rawSchema.schemas[variation];
            }
            if (this.rawSchema.definitions?.[variation]) {
                return this.rawSchema.definitions[variation];
            }
        }

        return null;
    }

    /**
     * STEP 5: FORM GENERATION
     * Main form generation method
     */
    generateForm(schema) {
        try {
            this.rawSchema = schema;
            
            // Step 1: Analyze schema structure
            const analysis = this.analyzeSchema(schema);
            
            // Step 2: Generate based on schema type
            let formHTML = '';
            if (analysis.schemaType.type === 'unified') {
                formHTML = this.generateUnifiedForm(analysis);
            } else if (analysis.schemaType.type === 'multi-model') {
                formHTML = this.generateMultiModelForm(analysis);
            } else {
                throw new Error(`Unsupported schema type: ${analysis.schemaType.type}`);
            }

            // Step 3: Add wrapper and metadata
            const completeForm = this.wrapFormWithContainer(formHTML, analysis);
            
            this.log('Form generation complete');
            return {
                html: completeForm,
                analysis: analysis,
                success: true
            };

        } catch (error) {
            this.log(`Form generation failed: ${error.message}`, 'error');
            return {
                html: this.generateErrorForm(error.message),
                analysis: null,
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Generate unified form for RootModel schemas (like bike-insights)
     */
    generateUnifiedForm(analysis) {
        const rootModel = analysis.models.get('RootModel');
        if (!rootModel) {
            throw new Error('RootModel not found in unified schema');
        }

        const sections = this.identifyFormSections(rootModel);
        
        if (sections.length <= 1) {
            // Simple single-section form
            return this.generateSingleSectionForm(rootModel, analysis);
        } else {
            // Multi-section tabbed form
            return this.generateTabbedForm(rootModel, sections, analysis);
        }
    }

    /**
     * Generate tabbed form for complex unified schemas
     */
    generateTabbedForm(rootModel, sections, analysis) {
        const tabId = `form-tabs-${Date.now()}`;
        
        // Generate tab navigation
        const tabNav = sections.map((section, index) => `
            <li class="nav-item" role="presentation">
                <button class="nav-link ${index === 0 ? 'active' : ''}" 
                        id="${tabId}-${section.id}-tab" 
                        data-bs-toggle="tab" 
                        data-bs-target="#${tabId}-${section.id}" 
                        type="button" 
                        role="tab">
                    <i class="${section.icon}"></i> ${section.title}
                </button>
            </li>
        `).join('');

        // Generate tab content
        const tabContent = sections.map((section, index) => `
            <div class="tab-pane fade ${index === 0 ? 'show active' : ''}" 
                 id="${tabId}-${section.id}" 
                 role="tabpanel">
                <div class="mt-3">
                    ${this.generateSectionFields(section, analysis)}
                </div>
            </div>
        `).join('');

        return `
            <div class="unified-form-container">
                <div class="form-header mb-4">
                    <h4><i class="bi bi-gear"></i> ${analysis.workflowName} Management</h4>
                    <p class="text-muted">Configure and manage your ${analysis.workflowName} workflow data</p>
                </div>
                
                <ul class="nav nav-tabs" id="${tabId}" role="tablist">
                    ${tabNav}
                </ul>
                
                <div class="tab-content" id="${tabId}Content">
                    ${tabContent}
                </div>
            </div>
        `;
    }

    /**
     * Generate simple single-section form
     */
    generateSingleSectionForm(rootModel, analysis) {
        const fields = this.generateModelFields(rootModel, analysis);
        
        return `
            <div class="single-form-container">
                <div class="form-header mb-4">
                    <h4><i class="bi bi-form"></i> ${rootModel.title}</h4>
                    <p class="text-muted">${rootModel.description || 'Please fill out the form below'}</p>
                </div>
                
                <form class="needs-validation" novalidate>
                    ${fields}
                    
                    <div class="form-actions mt-4">
                        <button type="submit" class="btn btn-primary">
                            <i class="bi bi-check-circle"></i> Submit
                        </button>
                        <button type="reset" class="btn btn-outline-secondary ms-2">
                            <i class="bi bi-arrow-clockwise"></i> Reset
                        </button>
                    </div>
                </form>
            </div>
        `;
    }

    /**
     * Generate multi-model form for separate schemas (like restaurant-recommender)
     */
    generateMultiModelForm(analysis) {
        const modelCards = Array.from(analysis.models.values())
            .filter(model => !model.isDefinition) // Skip definition models
            .map(model => this.generateModelCard(model, analysis))
            .join('');

        return `
            <div class="multi-model-container">
                <div class="form-header mb-4">
                    <h4><i class="bi bi-collection"></i> ${analysis.workflowName} Configuration</h4>
                    <p class="text-muted">Configure each component of your ${analysis.workflowName} workflow</p>
                </div>
                
                <div class="model-cards">
                    ${modelCards}
                </div>
            </div>
        `;
    }

    /**
     * Generate individual model card
     */
    generateModelCard(model, analysis) {
        const fields = this.generateModelFields(model, analysis);
        const cardId = `model-${model.name.toLowerCase()}`;
        
        return `
            <div class="card mb-4" id="${cardId}">
                <div class="card-header bg-primary text-white">
                    <h5 class="card-title mb-0">
                        <i class="${this.getModelIcon(model.name)}"></i> ${model.title}
                    </h5>
                    ${model.description ? `<small>${model.description}</small>` : ''}
                </div>
                <div class="card-body">
                    <form class="needs-validation" novalidate>
                        ${fields}
                        
                        <div class="form-actions mt-3">
                            <button type="submit" class="btn btn-primary btn-sm">
                                <i class="bi bi-check-circle"></i> Save ${model.title}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }

    /**
     * STEP 6: FIELD GENERATION
     * Generate HTML for model fields
     */
    generateModelFields(model, analysis) {
        const fields = [];
        const displayOrder = model.uiMetadata?.display_order || Object.keys(model.properties);
        
        for (const fieldName of displayOrder) {
            const fieldDef = model.properties[fieldName];
            if (!fieldDef) continue;
            
            const analyzedField = this.analyzeField(fieldName, fieldDef, {
                required: model.required,
                model: model.name
            });
            
            const fieldHTML = this.generateFieldHTML(analyzedField);
            fields.push(fieldHTML);
        }
        
        return fields.join('\n');
    }

    /**
     * Generate HTML for individual field
     */
    generateFieldHTML(field) {
        const fieldId = `field_${field.name}_${Date.now()}`;
        const wrapperClass = this.getFieldWrapperClass(field);
        
        let fieldHTML = '';
        
        switch (field.uiComponent) {
            case 'text':
            case 'email':
            case 'url':
            case 'number':
            case 'date':
                fieldHTML = this.generateInputField(field, fieldId);
                break;
            case 'textarea':
                fieldHTML = this.generateTextareaField(field, fieldId);
                break;
            case 'select':
                fieldHTML = this.generateSelectField(field, fieldId);
                break;
            case 'checkbox':
                fieldHTML = this.generateCheckboxField(field, fieldId);
                break;
            case 'dynamic-array':
                fieldHTML = this.generateArrayField(field, fieldId);
                break;
            default:
                fieldHTML = this.generateInputField(field, fieldId); // Fallback
        }
        
        return `
            <div class="${wrapperClass}" data-field="${field.name}">
                ${fieldHTML}
            </div>
        `;
    }

    /**
     * Generate standard input field
     */
    generateInputField(field, fieldId) {
        const validation = this.generateValidationAttributes(field);
        const helpText = field.description ? `<div class="form-text">${field.description}</div>` : '';
        
        return `
            <label for="${fieldId}" class="form-label">
                ${field.displayName}
                ${field.required ? '<span class="text-danger">*</span>' : ''}
            </label>
            <input type="${field.inputType}" 
                   class="form-control" 
                   id="${fieldId}" 
                   name="${field.name}"
                   placeholder="${field.description || `Enter ${field.displayName.toLowerCase()}`}"
                   x-model="${field.alpineModel}"
                   ${validation}
                   ${field.required ? 'required' : ''}>
            ${helpText}
            <div class="invalid-feedback">
                Please provide a valid ${field.displayName.toLowerCase()}.
            </div>
        `;
    }

    /**
     * Generate textarea field
     */
    generateTextareaField(field, fieldId) {
        const validation = this.generateValidationAttributes(field);
        const helpText = field.description ? `<div class="form-text">${field.description}</div>` : '';
        
        return `
            <label for="${fieldId}" class="form-label">
                ${field.displayName}
                ${field.required ? '<span class="text-danger">*</span>' : ''}
            </label>
            <textarea class="form-control" 
                      id="${fieldId}" 
                      name="${field.name}"
                      rows="3"
                      placeholder="${field.description || `Enter ${field.displayName.toLowerCase()}`}"
                      x-model="${field.alpineModel}"
                      ${validation}
                      ${field.required ? 'required' : ''}></textarea>
            ${helpText}
            <div class="invalid-feedback">
                Please provide a valid ${field.displayName.toLowerCase()}.
            </div>
        `;
    }

    /**
     * Generate select field
     */
    generateSelectField(field, fieldId) {
        const options = field.enumOptions || [];
        const optionsHTML = options.map(option => 
            `<option value="${option.value}">${option.label}</option>`
        ).join('');
        
        const helpText = field.description ? `<div class="form-text">${field.description}</div>` : '';
        
        return `
            <label for="${fieldId}" class="form-label">
                ${field.displayName}
                ${field.required ? '<span class="text-danger">*</span>' : ''}
            </label>
            <select class="form-select" 
                    id="${fieldId}" 
                    name="${field.name}"
                    x-model="${field.alpineModel}"
                    ${field.required ? 'required' : ''}>
                <option value="">Choose ${field.displayName.toLowerCase()}...</option>
                ${optionsHTML}
            </select>
            ${helpText}
            <div class="invalid-feedback">
                Please select a valid ${field.displayName.toLowerCase()}.
            </div>
        `;
    }

    /**
     * Generate checkbox field
     */
    generateCheckboxField(field, fieldId) {
        const helpText = field.description ? `<div class="form-text">${field.description}</div>` : '';
        
        return `
            <div class="form-check">
                <input class="form-check-input" 
                       type="checkbox" 
                       id="${fieldId}" 
                       name="${field.name}"
                       x-model="${field.alpineModel}">
                <label class="form-check-label" for="${fieldId}">
                    ${field.displayName}
                    ${field.required ? '<span class="text-danger">*</span>' : ''}
                </label>
                ${helpText}
            </div>
        `;
    }

    /**
     * Generate dynamic array field
     */
    generateArrayField(field, fieldId) {
        const arrayId = `array_${field.name}_${Date.now()}`;
        const config = field.arrayConfig || {};
        
        return `
            <div class="array-field">
                <label class="form-label">
                    ${field.displayName}
                    ${field.required ? '<span class="text-danger">*</span>' : ''}
                </label>
                ${field.description ? `<div class="form-text">${field.description}</div>` : ''}
                
                <div id="${arrayId}" class="array-container border rounded p-3 bg-light">
                    <div class="array-items" x-data="arrayManager('${field.name}')">
                        <template x-for="(item, index) in items" :key="index">
                            <div class="array-item card mb-2">
                                <div class="card-body">
                                    <div class="d-flex justify-content-between align-items-center mb-2">
                                        <h6 class="card-title mb-0">Item <span x-text="index + 1"></span></h6>
                                        <button type="button" 
                                                class="btn btn-outline-danger btn-sm" 
                                                @click="removeItem(index)"
                                                x-show="items.length > ${config.minItems || 0}">
                                            <i class="bi bi-trash"></i> ${config.removeButtonText}
                                        </button>
                                    </div>
                                    ${this.generateArrayItemFields(config.itemSchema)}
                                </div>
                            </div>
                        </template>
                        
                        <button type="button" 
                                class="btn btn-outline-success btn-sm" 
                                @click="addItem()"
                                x-show="!maxItemsReached">
                            <i class="bi bi-plus"></i> ${config.addButtonText}
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * UTILITY METHODS
     */

    /**
     * Generate validation attributes for HTML5 validation
     */
    generateValidationAttributes(field) {
        const attrs = [];
        const validation = field.validation?.rules || {};
        
        if (validation.min !== undefined) attrs.push(`min="${validation.min}"`);
        if (validation.max !== undefined) attrs.push(`max="${validation.max}"`);
        if (validation.minLength !== undefined) attrs.push(`minlength="${validation.minLength}"`);
        if (validation.maxLength !== undefined) attrs.push(`maxlength="${validation.maxLength}"`);
        if (validation.pattern) attrs.push(`pattern="${validation.pattern}"`);
        
        return attrs.join(' ');
    }

    /**
     * Get appropriate wrapper class for field
     */
    getFieldWrapperClass(field) {
        const baseClasses = ['mb-3'];
        
        if (field.uiComponent === 'checkbox') {
            baseClasses.push('form-check-wrapper');
        }
        
        // Add responsive classes based on field type
        if (['text', 'email', 'number'].includes(field.uiComponent)) {
            baseClasses.push('col-md-6');
        } else if (field.uiComponent === 'textarea') {
            baseClasses.push('col-12');
        } else if (field.uiComponent === 'dynamic-array') {
            baseClasses.push('col-12');
        }
        
        return baseClasses.join(' ');
    }

    /**
     * Get icon for model type
     */
    getModelIcon(modelName) {
        const iconMap = {
            'Restaurant': 'bi bi-shop',
            'Cuisine': 'bi bi-egg-fried',
            'Review': 'bi bi-star',
            'User': 'bi bi-person',
            'Store': 'bi bi-building',
            'Bike': 'bi bi-bicycle',
            'Sale': 'bi bi-cart',
            'Stock': 'bi bi-boxes'
        };
        
        return iconMap[modelName] || 'bi bi-collection';
    }

    /**
     * Identify form sections for tabbed interface
     */
    identifyFormSections(rootModel) {
        const sections = [];
        
        for (const [fieldName, fieldDef] of Object.entries(rootModel.properties)) {
            if (fieldDef.type === 'array') {
                sections.push({
                    id: fieldName,
                    title: fieldDef.display_name || this.formatFieldName(fieldName),
                    icon: this.getSectionIcon(fieldName),
                    fields: [fieldName]
                });
            }
        }
        
        // If no array fields, create a single section
        if (sections.length === 0) {
            sections.push({
                id: 'general',
                title: 'General Information',
                icon: 'bi bi-info-circle',
                fields: Object.keys(rootModel.properties)
            });
        }
        
        return sections;
    }

    /**
     * Get section icon based on field name
     */
    getSectionIcon(fieldName) {
        const iconMap = {
            'stores': 'bi bi-building',
            'sales': 'bi bi-cart',
            'stock': 'bi bi-boxes',
            'reviews': 'bi bi-star',
            'restaurants': 'bi bi-shop',
            'users': 'bi bi-people'
        };
        
        return iconMap[fieldName] || 'bi bi-folder';
    }

    /**
     * Format field names to readable labels
     */
    formatFieldName(fieldName) {
        return fieldName
            .replace(/_/g, ' ')
            .replace(/([a-z])([A-Z])/g, '$1 $2')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }

    /**
     * Format enum labels
     */
    formatEnumLabel(value) {
        if (typeof value === 'string') {
            return this.formatFieldName(value);
        }
        return String(value);
    }

    /**
     * Validate schema integrity
     */
    validateSchemaIntegrity(schema) {
        const errors = [];
        
        if (!schema || typeof schema !== 'object') {
            errors.push('Schema must be a valid object');
            return { isValid: false, errors };
        }
        
        if (!schema.workflow_name) {
            errors.push('Schema must have a workflow_name');
        }
        
        if (!schema.schemas || typeof schema.schemas !== 'object') {
            errors.push('Schema must have a schemas object');
        } else if (Object.keys(schema.schemas).length === 0) {
            errors.push('Schema must contain at least one model definition');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Count total fields across all models
     */
    countTotalFields(schema) {
        let count = 0;
        for (const model of Object.values(schema.schemas || {})) {
            if (model.properties) {
                count += Object.keys(model.properties).length;
            }
        }
        return count;
    }

    /**
     * Count total references in schema
     */
    countReferences(schema) {
        let count = 0;
        const countInObject = (obj) => {
            if (typeof obj !== 'object' || obj === null) return;
            
            for (const [key, value] of Object.entries(obj)) {
                if (key === '$ref') {
                    count++;
                } else if (typeof value === 'object') {
                    countInObject(value);
                }
            }
        };
        
        countInObject(schema);
        return count;
    }

    /**
     * Case conversion utilities
     */
    camelToSnake(str) {
        return str.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
    }

    snakeToCamel(str) {
        return str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
    }

    /**
     * Logging utility
     */
    log(message, data = null, level = 'info') {
        if (!this.config.debug) return;
        
        const timestamp = new Date().toISOString();
        const prefix = `[DynamicFormGenerator ${timestamp}]`;
        
        if (level === 'error') {
            console.error(prefix, message, data);
        } else if (level === 'warn') {
            console.warn(prefix, message, data);
        } else {
            console.log(prefix, message, data);
        }
    }

    /**
     * Wrap generated form with container
     */
    wrapFormWithContainer(formHTML, analysis) {
        return `
            <div class="dynamic-form-generator" data-workflow="${analysis.workflowName}">
                ${formHTML}
            </div>
            
            <style>
                .dynamic-form-generator {
                    max-width: 1200px;
                    margin: 0 auto;
                }
                
                .unified-form-container .nav-tabs .nav-link {
                    border-bottom: 2px solid transparent;
                }
                
                .unified-form-container .nav-tabs .nav-link.active {
                    border-bottom-color: var(--bs-primary);
                    background-color: transparent;
                }
                
                .array-field .array-container {
                    min-height: 100px;
                }
                
                .array-item {
                    transition: all 0.3s ease;
                }
                
                .array-item:hover {
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }
                
                .form-actions {
                    border-top: 1px solid #dee2e6;
                    padding-top: 1rem;
                }
                
                .model-cards .card {
                    transition: transform 0.2s ease;
                }
                
                .model-cards .card:hover {
                    transform: translateY(-2px);
                }
            </style>
        `;
    }

    /**
     * Generate error form for failed schema processing
     */
    generateErrorForm(errorMessage) {
        return `
            <div class="alert alert-danger">
                <h5><i class="bi bi-exclamation-triangle"></i> Form Generation Failed</h5>
                <p>Unable to generate form from the provided schema:</p>
                <pre class="mb-0">${errorMessage}</pre>
            </div>
        `;
    }

    /**
     * PUBLIC API METHODS
     */

    /**
     * Initialize the form generator with a schema
     */
    initialize(schema) {
        this.log('Initializing with schema:', schema);
        return this.generateForm(schema);
    }

    /**
     * Render form to a specific container
     */
    renderToContainer(containerId, schema) {
        const container = document.getElementById(containerId);
        if (!container) {
            throw new Error(`Container with ID '${containerId}' not found`);
        }

        const result = this.initialize(schema);
        container.innerHTML = result.html;

        // Initialize any dynamic behaviors
        this.initializeDynamicBehaviors(container);

        return result;
    }

    /**
     * Initialize dynamic behaviors for the generated form
     */
    initializeDynamicBehaviors(container) {
        // Initialize Bootstrap tabs
        const tabs = container.querySelectorAll('[data-bs-toggle="tab"]');
        tabs.forEach(tab => {
            new bootstrap.Tab(tab);
        });

        // Initialize form validation
        const forms = container.querySelectorAll('.needs-validation');
        forms.forEach(form => {
            form.addEventListener('submit', (event) => {
                if (!form.checkValidity()) {
                    event.preventDefault();
                    event.stopPropagation();
                }
                form.classList.add('was-validated');
            });
        });
    }

    /**
     * Collect form data from generated form
     */
    collectFormData(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            throw new Error(`Container with ID '${containerId}' not found`);
        }

        const formData = {};
        const inputs = container.querySelectorAll('input, select, textarea');
        
        inputs.forEach(input => {
            const name = input.name || input.id;
            if (name) {
                if (input.type === 'checkbox') {
                    formData[name] = input.checked;
                } else if (input.type === 'radio' && input.checked) {
                    formData[name] = input.value;
                } else if (input.type !== 'radio') {
                    formData[name] = input.value;
                }
            }
        });

        this.log('Collected form data:', formData);
        return formData;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ImprovedDynamicFormGenerator;
} else if (typeof window !== 'undefined') {
    window.ImprovedDynamicFormGenerator = ImprovedDynamicFormGenerator;
}
