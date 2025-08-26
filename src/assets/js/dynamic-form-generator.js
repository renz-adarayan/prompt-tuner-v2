// Dynamic Form Generator for Backend Schema
// Handles rendering forms based on API schema response

class DynamicFormGenerator {
    constructor() {
        this.schema = null;
        this.currentFormData = {};
        this.validationErrors = {};
        this.selectedForms = new Set(); // Track which forms are currently displayed
    }

    // Initialize with schema from backend API
    initialize(schemaData) {
        // Check if this is the new backend schema format
        if (schemaData.schemas && !schemaData.forms) {
            this.schema = this.parseBackendSchema(schemaData);
        } else {
            this.schema = schemaData;
        }
        console.log('Dynamic Form Generator initialized with schema:', this.schema);
    }

    // Normalize form names for better display
    normalizeFormName(name) {
        if (!name) return 'Untitled Form';
        
        console.log('Normalizing form name:', name); // Debug log
        
        // Remove common technical prefixes/suffixes
        let normalized = name
            .replace(/^RootModel_?/i, '')      // Remove "RootModel" or "RootModel_"
            .replace(/^Root_?/i, '')          // Remove "Root" or "Root_"
            .replace(/^Model_?/i, '')         // Remove "Model" or "Model_" prefix
            .replace(/_?Model$/i, '')         // Remove "_Model" or "Model" suffix
            .replace(/_?Schema$/i, '')        // Remove "_Schema" or "Schema" suffix
            .replace(/_?Form$/i, '')          // Remove "_Form" or "Form" suffix
            .replace(/_?Input$/i, '')         // Remove "_Input" or "Input" suffix
            .replace(/_?Data$/i, '')          // Remove "_Data" or "Data" suffix
            .replace(/^Api_?/i, '')           // Remove "Api" or "Api_" prefix
            .replace(/_?Response$/i, '')      // Remove "_Response" or "Response" suffix
            .replace(/_?Request$/i, '');      // Remove "_Request" or "Request" suffix
        
        // Handle empty result after cleanup
        if (!normalized.trim()) {
            return 'Main Form';
        }
        
        // Convert underscores and camelCase to readable format
        normalized = normalized
            // Handle camelCase: "BikeStock" -> "Bike Stock"
            .replace(/([a-z])([A-Z])/g, '$1 $2')
            // Handle numbers: "Item2Data" -> "Item 2 Data"
            .replace(/([a-zA-Z])(\d)/g, '$1 $2')
            .replace(/(\d)([a-zA-Z])/g, '$1 $2')
            // Handle underscores: "bike_stock" -> "bike stock"
            .replace(/_/g, ' ')
            // Handle hyphens: "bike-stock" -> "bike stock"
            .replace(/-/g, ' ')
            // Handle multiple spaces
            .replace(/\s+/g, ' ')
            .trim();
        
        // Capitalize each word
        normalized = normalized
            .split(' ')
            .map(word => {
                // Handle special cases for common abbreviations
                if (word.toLowerCase() === 'id') return 'ID';
                if (word.toLowerCase() === 'api') return 'API';
                if (word.toLowerCase() === 'url') return 'URL';
                if (word.toLowerCase() === 'ui') return 'UI';
                if (word.toLowerCase() === 'db') return 'Database';
                
                return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
            })
            .join(' ');
        
        const result = normalized || 'Form';
        console.log('Normalized result:', result); // Debug log
        return result;
    }

    // Parse the new backend API schema structure
    parseBackendSchema(backendSchema) {
        const parsedSchema = {
            workflow_name: backendSchema.workflow_name,
            forms: {}
        };

        // Find the RootModel which contains the main structure
        let rootModel = null;
        let rootKey = null;
        
        for (const [schemaKey, schemaValue] of Object.entries(backendSchema.schemas)) {
            if (schemaKey === 'RootModel' || schemaValue.model_name === 'RootModel') {
                rootModel = schemaValue;
                rootKey = schemaKey;
                break;
            }
        }

        if (rootModel && rootModel.properties && rootModel.properties.stores) {
            // Find the main array property (could be stores, items, records, etc.)
            const arrayProperty = this.findMainArrayProperty(rootModel.properties);
            
            if (arrayProperty) {
                const arrayPropertyName = arrayProperty.name;
                const arrayTitle = this.normalizeFormName(arrayPropertyName);
                
                // Create a dynamic management form
                parsedSchema.forms['dynamic-management'] = {
                    form_id: 'dynamic-management',
                    title: `${arrayTitle} Management`,
                    originalTitle: `${arrayTitle} Management`,
                    description: `Manage ${arrayTitle.toLowerCase()} information and related data`,
                    fields: this.parseDynamicStructure(backendSchema, arrayProperty),
                    ui_config: {
                        type: 'dynamic_management',
                        nested_structure: true,
                        main_property: arrayPropertyName,
                        item_schema_ref: arrayProperty.items_ref
                    }
                };
            } else {
                // No array property found, fall back to original parsing
                this.parseAsIndividualForms(backendSchema.schemas, parsedSchema);
            }
        } else {
            // Fallback to original parsing if RootModel not found
            this.parseAsIndividualForms(backendSchema.schemas, parsedSchema);
        }

        return parsedSchema;
    }

    // Find the main array property in root model properties
    findMainArrayProperty(properties) {
        for (const [propName, propDef] of Object.entries(properties)) {
            if (propDef.type === 'array' && propDef.items && propDef.items.$ref) {
                return {
                    name: propName,
                    items_ref: propDef.items.$ref,
                    definition: propDef
                };
            }
        }
        return null;
    }

    // Parse as individual forms (fallback method)
    parseAsIndividualForms(schemas, parsedSchema) {
        for (const [schemaKey, schemaValue] of Object.entries(schemas)) {
            const normalizedTitle = this.normalizeFormName(schemaValue.title || schemaValue.model_name || schemaKey);
            
            parsedSchema.forms[schemaKey] = {
                form_id: schemaKey.toLowerCase().replace(/_/g, '-'),
                title: normalizedTitle,
                originalTitle: schemaValue.title || schemaValue.model_name || schemaKey,
                description: schemaValue.description || `Enter ${normalizedTitle.toLowerCase()} information`,
                fields: this.parseSchemaProperties(schemaValue.properties, schemaValue.required || []),
                validation: {
                    required_fields: schemaValue.required || []
                },
                default_values: schemaValue.default_values || {}
            };
        }
    }

    // Parse dynamic structure based on the main array property
    parseDynamicStructure(backendSchema, arrayProperty) {
        const itemSchemaRef = arrayProperty.items_ref;
        const itemSchemaKey = itemSchemaRef.replace('#/$defs/', '');
        const itemSchema = backendSchema.schemas[itemSchemaKey];
        
        if (!itemSchema) {
            console.warn(`Referenced schema not found: ${itemSchemaKey}`);
            return [];
        }

        return [{
            name: arrayProperty.name,
            label: this.normalizeFormName(arrayProperty.name),
            description: `Manage ${arrayProperty.name} and their related information`,
            input_type: 'dynamic_array',
            validation: { min_items: 1 },
            nested_structure: {
                item_fields: this.extractItemFields(itemSchema, backendSchema),
                nested_arrays: this.findNestedArrays(itemSchema, backendSchema),
                dynamic_unions: this.findDynamicUnions(itemSchema, backendSchema)
            }
        }];
    }

    // Extract fields from item schema
    extractItemFields(itemSchema, backendSchema) {
        const fields = [];
        
        for (const [fieldName, fieldDef] of Object.entries(itemSchema.properties || {})) {
            if (fieldDef.type === 'array') {
                // Handle nested arrays separately
                continue;
            } else if (fieldDef.$ref) {
                // Handle nested objects
                const nestedSchemaKey = fieldDef.$ref.replace('#/$defs/', '');
                const nestedSchema = backendSchema.schemas[nestedSchemaKey];
                if (nestedSchema) {
                    fields.push({
                        name: fieldName,
                        label: this.normalizeFormName(fieldName),
                        input_type: 'nested_object',
                        nested_fields: this.extractItemFields(nestedSchema, backendSchema)
                    });
                }
            } else if (fieldDef.anyOf) {
                // Handle union types (like different bike types)
                fields.push({
                    name: fieldName,
                    label: this.normalizeFormName(fieldName),
                    input_type: 'dynamic_union',
                    union_options: this.parseUnionOptions(fieldDef.anyOf, backendSchema)
                });
            } else {
                // Regular field
                fields.push(this.parseFieldDefinition(fieldName, fieldDef));
            }
        }
        
        return fields;
    }

    // Find nested arrays in schema
    findNestedArrays(itemSchema, backendSchema) {
        const nestedArrays = [];
        
        for (const [fieldName, fieldDef] of Object.entries(itemSchema.properties || {})) {
            if (fieldDef.type === 'array' && fieldDef.items && fieldDef.items.$ref) {
                const arrayItemSchemaKey = fieldDef.items.$ref.replace('#/$defs/', '');
                const arrayItemSchema = backendSchema.schemas[arrayItemSchemaKey];
                
                if (arrayItemSchema) {
                    nestedArrays.push({
                        name: fieldName,
                        label: this.normalizeFormName(fieldName),
                        item_schema: arrayItemSchema,
                        fields: this.extractItemFields(arrayItemSchema, backendSchema)
                    });
                }
            }
        }
        
        return nestedArrays;
    }

    // Find dynamic unions (like bike types)
    findDynamicUnions(itemSchema, backendSchema) {
        const dynamicUnions = [];
        
        for (const [fieldName, fieldDef] of Object.entries(itemSchema.properties || {})) {
            if (fieldDef.anyOf) {
                dynamicUnions.push({
                    name: fieldName,
                    label: this.normalizeFormName(fieldName),
                    options: this.parseUnionOptions(fieldDef.anyOf, backendSchema)
                });
            }
        }
        
        return dynamicUnions;
    }

    // Parse union options (like different bike types)
    parseUnionOptions(anyOfArray, backendSchema) {
        const options = {};
        
        anyOfArray.forEach(option => {
            if (option.$ref) {
                const optionSchemaKey = option.$ref.replace('#/$defs/', '');
                const optionSchema = backendSchema.schemas[optionSchemaKey];
                
                if (optionSchema) {
                    // Try to infer the type from schema name
                    let optionType = optionSchemaKey.toLowerCase();
                    if (optionType.includes('electric')) optionType = 'electric';
                    else if (optionType.includes('mountain')) optionType = 'mountain';
                    else if (optionType.includes('road')) optionType = 'road';
                    else {
                        // Extract type from schema name
                        optionType = optionSchemaKey.replace(/^.*_/, '').toLowerCase();
                    }
                    
                    options[optionType] = {
                        label: this.normalizeFormName(optionSchema.title || optionSchemaKey),
                        fields: this.extractItemFields(optionSchema, backendSchema)
                    };
                }
            }
        });
        
        return options;
    }

    // Parse store structure for hierarchical form
    parseStoreStructure(backendSchema) {
        // This will create a single array field for stores with nested bike_sales and bike_stock
        return [{
            name: 'stores',
            label: 'Stores',
            description: 'Manage store locations and their inventory',
            input_type: 'store_array',
            validation: { min_items: 1 },
            nested_structure: {
                store_fields: [
                    { name: 'name', label: 'Store Name', input_type: 'text', required: true },
                    { name: 'location', label: 'Location', input_type: 'text', required: true }
                ],
                bike_sales_fields: this.extractBikeSalesFields(backendSchema),
                bike_stock_fields: this.extractBikeStockFields(backendSchema)
            }
        }];
    }

    // Extract bike sales field structure
    extractBikeSalesFields(backendSchema) {
        const bikeSaleSchema = backendSchema.schemas['RootModel_BikeSale'];
        if (!bikeSaleSchema) return [];

        const fields = [];
        for (const [fieldName, fieldDef] of Object.entries(bikeSaleSchema.properties)) {
            if (fieldName === 'customer_review') {
                // Handle nested customer review
                fields.push({
                    name: 'customer_review',
                    label: 'Customer Review',
                    input_type: 'nested_object',
                    nested_fields: this.extractCustomerReviewFields(backendSchema)
                });
            } else {
                fields.push(this.parseFieldDefinition(fieldName, fieldDef));
            }
        }
        return fields;
    }

    // Extract customer review fields
    extractCustomerReviewFields(backendSchema) {
        const reviewSchema = backendSchema.schemas['RootModel_CustomerReview'];
        if (!reviewSchema) return [];

        const fields = [];
        for (const [fieldName, fieldDef] of Object.entries(reviewSchema.properties)) {
            fields.push(this.parseFieldDefinition(fieldName, fieldDef));
        }
        return fields;
    }

    // Extract bike stock field structure
    extractBikeStockFields(backendSchema) {
        const bikeStockSchema = backendSchema.schemas['RootModel_BikeStock'];
        if (!bikeStockSchema) return [];

        return [
            { name: 'quantity', label: 'Quantity', input_type: 'number', required: true },
            {
                name: 'bike',
                label: 'Bike Details',
                input_type: 'bike_selector',
                bike_types: {
                    electric: this.extractBikeTypeFields(backendSchema, 'RootModel_ElectricBike'),
                    mountain: this.extractBikeTypeFields(backendSchema, 'RootModel_MountainBike'),
                    road: this.extractBikeTypeFields(backendSchema, 'RootModel_RoadBike')
                }
            }
        ];
    }

    // Extract specific bike type fields
    extractBikeTypeFields(backendSchema, schemaKey) {
        const bikeSchema = backendSchema.schemas[schemaKey];
        if (!bikeSchema) return [];

        const fields = [];
        for (const [fieldName, fieldDef] of Object.entries(bikeSchema.properties)) {
            fields.push(this.parseFieldDefinition(fieldName, fieldDef));
        }
        return fields;
    }

    // Parse individual field definition
    parseFieldDefinition(fieldName, fieldDef) {
        const field = {
            name: fieldName,
            label: fieldDef.title || this.formatFieldName(fieldName),
            description: fieldDef.description || '',
            required: false // Will be set based on schema requirements
        };

        // Determine input type based on field definition
        if (fieldDef.type === 'string') {
            field.input_type = fieldDef.format === 'textarea' ? 'textarea' : 'text';
        } else if (fieldDef.type === 'number' || fieldDef.type === 'integer') {
            field.input_type = 'number';
            field.step = fieldDef.type === 'integer' ? '1' : '0.01';
        } else if (fieldDef.enum) {
            field.input_type = 'select';
            field.options = fieldDef.enum.map(value => ({ value, label: value }));
        } else if (fieldDef.type === 'array') {
            field.input_type = 'array';
        } else {
            field.input_type = 'text';
        }

        // Add validation rules
        field.validation = {};
        if (fieldDef.minimum !== undefined) field.validation.min = fieldDef.minimum;
        if (fieldDef.maximum !== undefined) field.validation.max = fieldDef.maximum;
        if (fieldDef.minLength !== undefined) field.validation.min_length = fieldDef.minLength;
        if (fieldDef.maxLength !== undefined) field.validation.max_length = fieldDef.maxLength;

        return field;
    }

    parseSchemaProperties(properties, requiredFields = []) {
        const fields = [];
        
        for (const [fieldName, fieldDef] of Object.entries(properties)) {
            const field = {
                name: fieldName,
                label: fieldDef.display_name || fieldDef.title || fieldName,
                type: fieldDef.type,
                required: requiredFields.includes(fieldName),
                description: fieldDef.description || `Enter ${fieldDef.title || fieldName}`,
                validation: fieldDef.validation || {}
            };

            // Map UI components to input types
            switch (fieldDef.ui_component) {
                case 'text_input':
                    field.input_type = 'text';
                    if (fieldDef.type === 'string') {
                        field.placeholder = `Enter ${field.label.toLowerCase()}`;
                    }
                    break;
                case 'number_input':
                    field.input_type = 'number';
                    if (fieldDef.number_config) {
                        field.step = fieldDef.number_config.step || (fieldDef.type === 'integer' ? 1 : 0.01);
                        if (fieldDef.number_config.min !== null) field.validation.minimum = fieldDef.number_config.min;
                        if (fieldDef.number_config.max !== null) field.validation.maximum = fieldDef.number_config.max;
                    }
                    break;
                case 'textarea':
                    field.input_type = 'textarea';
                    field.placeholder = `Enter ${field.label.toLowerCase()}...`;
                    break;
                case 'array':
                    field.input_type = 'array';
                    field.array_config = fieldDef.array_config;
                    break;
                case 'union_select':
                    field.input_type = 'select';
                    field.options = fieldDef.union_options || [];
                    break;
                default:
                    // Fallback for fields without ui_component
                    if (fieldDef.type === 'string') {
                        field.input_type = 'text';
                    } else if (fieldDef.type === 'number' || fieldDef.type === 'integer') {
                        field.input_type = 'number';
                        field.step = fieldDef.type === 'integer' ? 1 : 0.01;
                    } else if (fieldDef.type === 'array') {
                        field.input_type = 'array';
                    } else {
                        field.input_type = 'text';
                    }
            }

            fields.push(field);
        }

        return fields;
    }

    // Get all available forms
    getAvailableForms() {
        if (!this.schema || !this.schema.forms) return [];
        
        return Object.keys(this.schema.forms).map(formKey => ({
            id: formKey,
            title: this.schema.forms[formKey].title,
            description: this.schema.forms[formKey].description,
            form_id: this.schema.forms[formKey].form_id
        }));
    }

    // Generate HTML for a specific form
    generateFormHTML(formId) {
        if (!this.schema || !this.schema.forms[formId]) {
            return '<div class="alert alert-warning">Form not found</div>';
        }

        const form = this.schema.forms[formId];
        
        // Check if this is the new dynamic management form
        if (form.ui_config && form.ui_config.type === 'dynamic_management') {
            return this.generateDynamicManagementHTML(form);
        }
        
        // Check if this is the old store management form (for backward compatibility)
        if (form.ui_config && form.ui_config.type === 'store_management') {
            return this.generateStoreManagementHTML(form);
        }
        
        // Default form generation
        let html = `
            <div class="p-3">
                <form class="needs-validation" novalidate>
                    <div class="row g-3">
        `;

        // Generate fields
        form.fields.forEach(field => {
            html += this.generateFieldHTML(field, formId);
        });

        html += `
                    </div>
                </form>
            </div>
        `;

        return html;
    }

    // Generate dynamic management HTML with truly dynamic structure
    generateDynamicManagementHTML(form) {
        const mainProperty = form.ui_config.main_property;
        
        return `
            <div class="p-3">
                <div class="dynamic-management-container">
                    <!-- Add Item Button -->
                    <div class="d-flex justify-content-end align-items-center mb-3">
                        <button type="button" class="btn btn-success btn-sm" onclick="dynamicFormGenerator.addDynamicItem('${mainProperty}')">
                            <i class="bi bi-plus"></i> Add ${this.normalizeFormName(mainProperty.slice(0, -1))}
                        </button>
                    </div>
                    
                    <!-- Items Container -->
                    <div id="${mainProperty}-container">
                        <!-- Dynamic items will be added here -->
                    </div>
                </div>
            </div>
        `;
    }

    // Generate store management HTML with nested structure
    generateStoreManagementHTML(form) {
        return `
            <div class="p-3">
                <div class="store-management-container">
                    <!-- Add Store Button -->
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h5>Store Management</h5>
                        <button type="button" class="btn btn-success btn-sm" onclick="dynamicFormGenerator.addStore()">
                            <i class="bi bi-plus"></i> Add Store
                        </button>
                    </div>
                    
                    <!-- Stores Container -->
                    <div id="stores-container">
                        <!-- Stores will be dynamically added here -->
                    </div>
                </div>
            </div>
        `;
    }

    // Add a new store to the management interface
    addStore() {
        const storesContainer = document.getElementById('stores-container');
        if (!storesContainer) return;

        const storeIndex = storesContainer.children.length;
        const storeId = `store-${storeIndex}`;

        const storeHTML = this.generateStoreCardHTML(storeId, storeIndex);
        storesContainer.insertAdjacentHTML('beforeend', storeHTML);
    }

    // Generate HTML for individual store card
    generateStoreCardHTML(storeId, storeIndex) {
        return `
            <div class="card mb-4 store-card" data-store-id="${storeId}">
                <div class="card-header">
                    <div class="d-flex justify-content-between align-items-center">
                        <h6 class="mb-0">Store ${storeIndex + 1}</h6>
                        <button type="button" class="btn btn-outline-danger btn-sm" onclick="dynamicFormGenerator.removeStore('${storeId}')">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <!-- Store Basic Info -->
                    <div class="row g-3 mb-4">
                        <div class="col-md-6">
                            <label for="${storeId}_name" class="form-label">Store Name <span class="text-danger">*</span></label>
                            <input type="text" class="form-control" id="${storeId}_name" name="name" placeholder="Enter store name" required>
                        </div>
                        <div class="col-md-6">
                            <label for="${storeId}_location" class="form-label">Location <span class="text-danger">*</span></label>
                            <input type="text" class="form-control" id="${storeId}_location" name="location" placeholder="Enter location" required>
                        </div>
                    </div>

                    <!-- Tabs for Bike Sales and Stock -->
                    <ul class="nav nav-tabs" id="${storeId}-tabs" role="tablist">
                        <li class="nav-item" role="presentation">
                            <button class="nav-link active" id="${storeId}-sales-tab" data-bs-toggle="tab" data-bs-target="#${storeId}-sales" type="button" role="tab">
                                Bike Sales
                            </button>
                        </li>
                        <li class="nav-item" role="presentation">
                            <button class="nav-link" id="${storeId}-stock-tab" data-bs-toggle="tab" data-bs-target="#${storeId}-stock" type="button" role="tab">
                                Bike Stock
                            </button>
                        </li>
                    </ul>

                    <div class="tab-content mt-3" id="${storeId}-tabContent">
                        <!-- Bike Sales Tab -->
                        <div class="tab-pane fade show active" id="${storeId}-sales" role="tabpanel">
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <h6>Bike Sales</h6>
                                <button type="button" class="btn btn-outline-success btn-sm" onclick="dynamicFormGenerator.addBikeSale('${storeId}')">
                                    <i class="bi bi-plus"></i> Add Sale
                                </button>
                            </div>
                            <div id="${storeId}-bike-sales-container">
                                <!-- Bike sales will be added here -->
                            </div>
                        </div>

                        <!-- Bike Stock Tab -->
                        <div class="tab-pane fade" id="${storeId}-stock" role="tabpanel">
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <h6>Bike Inventory</h6>
                                <button type="button" class="btn btn-outline-success btn-sm" onclick="dynamicFormGenerator.addBikeStock('${storeId}')">
                                    <i class="bi bi-plus"></i> Add Bike
                                </button>
                            </div>
                            <div id="${storeId}-bike-stock-container">
                                <!-- Bike stock will be added here -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Remove a store
    removeStore(storeId) {
        const storeCard = document.querySelector(`[data-store-id="${storeId}"]`);
        if (storeCard) {
            storeCard.remove();
        }
    }

    // Add bike sale to a store
    addBikeSale(storeId) {
        const salesContainer = document.getElementById(`${storeId}-bike-sales-container`);
        if (!salesContainer) return;

        const saleIndex = salesContainer.children.length;
        const saleId = `${storeId}-sale-${saleIndex}`;

        const saleHTML = this.generateBikeSaleHTML(saleId, storeId, saleIndex);
        salesContainer.insertAdjacentHTML('beforeend', saleHTML);
    }

    // Generate bike sale HTML
    generateBikeSaleHTML(saleId, storeId, saleIndex) {
        return `
            <div class="card mb-3 bike-sale-card" data-sale-id="${saleId}">
                <div class="card-header py-2">
                    <div class="d-flex justify-content-between align-items-center">
                        <small class="text-muted">Sale ${saleIndex + 1}</small>
                        <button type="button" class="btn btn-outline-danger btn-sm" onclick="dynamicFormGenerator.removeBikeSale('${saleId}')">
                            <i class="bi bi-x"></i>
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <div class="row g-3">
                        <div class="col-md-6">
                            <label for="${saleId}_product_code" class="form-label">Product Code <span class="text-danger">*</span></label>
                            <input type="text" class="form-control" id="${saleId}_product_code" name="product_code" placeholder="e.g., EB-SPECIALIZED-2023-TV" required>
                        </div>
                        <div class="col-md-6">
                            <label for="${saleId}_quantity_sold" class="form-label">Quantity Sold <span class="text-danger">*</span></label>
                            <input type="number" class="form-control" id="${saleId}_quantity_sold" name="quantity_sold" min="1" step="1" required>
                        </div>
                        <div class="col-md-6">
                            <label for="${saleId}_sale_date" class="form-label">Sale Date <span class="text-danger">*</span></label>
                            <input type="date" class="form-control" id="${saleId}_sale_date" name="sale_date" required>
                        </div>
                        <div class="col-md-3">
                            <label for="${saleId}_year" class="form-label">Year <span class="text-danger">*</span></label>
                            <input type="number" class="form-control" id="${saleId}_year" name="year" min="2020" max="2030" required>
                        </div>
                        <div class="col-md-3">
                            <label for="${saleId}_month" class="form-label">Month <span class="text-danger">*</span></label>
                            <select class="form-control" id="${saleId}_month" name="month" required>
                                <option value="">Select month</option>
                                <option value="January">January</option>
                                <option value="February">February</option>
                                <option value="March">March</option>
                                <option value="April">April</option>
                                <option value="May">May</option>
                                <option value="June">June</option>
                                <option value="July">July</option>
                                <option value="August">August</option>
                                <option value="September">September</option>
                                <option value="October">October</option>
                                <option value="November">November</option>
                                <option value="December">December</option>
                            </select>
                        </div>
                    </div>

                    <!-- Customer Review Section -->
                    <div class="mt-3">
                        <h6 class="border-bottom pb-2">Customer Review</h6>
                        <div class="row g-3">
                            <div class="col-md-6">
                                <label for="${saleId}_rating" class="form-label">Rating <span class="text-danger">*</span></label>
                                <select class="form-control" id="${saleId}_rating" name="rating" required>
                                    <option value="">Select rating</option>
                                    <option value="1">1 - Poor</option>
                                    <option value="1.5">1.5</option>
                                    <option value="2">2 - Fair</option>
                                    <option value="2.5">2.5</option>
                                    <option value="3">3 - Good</option>
                                    <option value="3.5">3.5</option>
                                    <option value="4">4 - Very Good</option>
                                    <option value="4.5">4.5</option>
                                    <option value="5">5 - Excellent</option>
                                </select>
                            </div>
                            <div class="col-12">
                                <label for="${saleId}_comment" class="form-label">Comment <span class="text-danger">*</span></label>
                                <textarea class="form-control" id="${saleId}_comment" name="comment" rows="3" placeholder="Customer feedback and comments" required></textarea>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Remove bike sale
    removeBikeSale(saleId) {
        const saleCard = document.querySelector(`[data-sale-id="${saleId}"]`);
        if (saleCard) {
            saleCard.remove();
        }
    }

    // Add bike stock to a store
    addBikeStock(storeId) {
        const stockContainer = document.getElementById(`${storeId}-bike-stock-container`);
        if (!stockContainer) return;

        const stockIndex = stockContainer.children.length;
        const stockId = `${storeId}-stock-${stockIndex}`;

        const stockHTML = this.generateBikeStockHTML(stockId, storeId, stockIndex);
        stockContainer.insertAdjacentHTML('beforeend', stockHTML);
    }

    // Generate bike stock HTML
    generateBikeStockHTML(stockId, storeId, stockIndex) {
        return `
            <div class="card mb-3 bike-stock-card" data-stock-id="${stockId}">
                <div class="card-header py-2">
                    <div class="d-flex justify-content-between align-items-center">
                        <small class="text-muted">Bike ${stockIndex + 1}</small>
                        <button type="button" class="btn btn-outline-danger btn-sm" onclick="dynamicFormGenerator.removeBikeStock('${stockId}')">
                            <i class="bi bi-x"></i>
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <div class="row g-3">
                        <div class="col-md-6">
                            <label for="${stockId}_quantity" class="form-label">Quantity in Stock <span class="text-danger">*</span></label>
                            <input type="number" class="form-control" id="${stockId}_quantity" name="quantity" min="0" step="1" required>
                        </div>
                        <div class="col-md-6">
                            <label for="${stockId}_bike_type" class="form-label">Bike Type <span class="text-danger">*</span></label>
                            <select class="form-control" id="${stockId}_bike_type" name="bike_type" onchange="dynamicFormGenerator.handleBikeTypeChange('${stockId}', this.value)" required>
                                <option value="">Select bike type</option>
                                <option value="electric">Electric Bike</option>
                                <option value="mountain">Mountain Bike</option>
                                <option value="road">Road Bike</option>
                            </select>
                        </div>
                    </div>

                    <!-- Common bike fields -->
                    <div class="mt-3">
                        <h6 class="border-bottom pb-2">Bike Details</h6>
                        <div class="row g-3">
                            <div class="col-md-6">
                                <label for="${stockId}_brand" class="form-label">Brand <span class="text-danger">*</span></label>
                                <input type="text" class="form-control" id="${stockId}_brand" name="brand" placeholder="e.g., Specialized, Trek" required>
                            </div>
                            <div class="col-md-6">
                                <label for="${stockId}_model" class="form-label">Model <span class="text-danger">*</span></label>
                                <input type="text" class="form-control" id="${stockId}_model" name="model" placeholder="e.g., Turbo Vado" required>
                            </div>
                            <div class="col-md-6">
                                <label for="${stockId}_year" class="form-label">Year <span class="text-danger">*</span></label>
                                <input type="number" class="form-control" id="${stockId}_year" name="year" min="2020" max="2030" required>
                            </div>
                            <div class="col-md-6">
                                <label for="${stockId}_price" class="form-label">Price <span class="text-danger">*</span></label>
                                <input type="number" class="form-control" id="${stockId}_price" name="price" step="0.01" min="0" required>
                            </div>
                        </div>
                    </div>

                    <!-- Dynamic fields based on bike type -->
                    <div id="${stockId}_dynamic_fields" class="mt-3" style="display: none;">
                        <!-- Dynamic fields will be added here based on bike type selection -->
                    </div>
                </div>
            </div>
        `;
    }

    // Handle bike type change to show additional fields
    handleBikeTypeChange(stockId, bikeType) {
        const dynamicFieldsContainer = document.getElementById(`${stockId}_dynamic_fields`);
        if (!dynamicFieldsContainer) return;

        // Clear existing dynamic fields
        dynamicFieldsContainer.innerHTML = '';
        dynamicFieldsContainer.style.display = 'none';

        if (!bikeType) return;

        let additionalFieldsHTML = '';

        switch (bikeType) {
            case 'electric':
                additionalFieldsHTML = `
                    <h6 class="border-bottom pb-2">Electric Bike Specifications</h6>
                    <div class="row g-3">
                        <div class="col-md-6">
                            <label for="${stockId}_battery_capacity" class="form-label">Battery Capacity (kWh) <span class="text-danger">*</span></label>
                            <input type="number" class="form-control" id="${stockId}_battery_capacity" name="battery_capacity" step="0.1" min="0" required>
                            <div class="form-text">Battery capacity in kilowatt-hours</div>
                        </div>
                        <div class="col-md-6">
                            <label for="${stockId}_motor_power" class="form-label">Motor Power (Watts) <span class="text-danger">*</span></label>
                            <input type="number" class="form-control" id="${stockId}_motor_power" name="motor_power" step="1" min="0" required>
                            <div class="form-text">Motor power in watts</div>
                        </div>
                    </div>
                `;
                break;
            case 'mountain':
                additionalFieldsHTML = `
                    <h6 class="border-bottom pb-2">Mountain Bike Specifications</h6>
                    <div class="row g-3">
                        <div class="col-md-6">
                            <label for="${stockId}_suspension" class="form-label">Suspension <span class="text-danger">*</span></label>
                            <select class="form-control" id="${stockId}_suspension" name="suspension" required>
                                <option value="">Select suspension type</option>
                                <option value="hardtail">Hardtail</option>
                                <option value="full">Full Suspension</option>
                                <option value="rigid">Rigid</option>
                            </select>
                        </div>
                    </div>
                `;
                break;
            case 'road':
                additionalFieldsHTML = `
                    <h6 class="border-bottom pb-2">Road Bike Specifications</h6>
                    <div class="row g-3">
                        <div class="col-md-6">
                            <label for="${stockId}_frame_material" class="form-label">Frame Material <span class="text-danger">*</span></label>
                            <select class="form-control" id="${stockId}_frame_material" name="frame_material" required>
                                <option value="">Select frame material</option>
                                <option value="carbon">Carbon</option>
                                <option value="aluminum">Aluminum</option>
                                <option value="steel">Steel</option>
                                <option value="titanium">Titanium</option>
                            </select>
                        </div>
                    </div>
                `;
                break;
        }

        if (additionalFieldsHTML) {
            dynamicFieldsContainer.innerHTML = additionalFieldsHTML;
            dynamicFieldsContainer.style.display = 'block';
        }
    }

    // Remove bike stock
    removeBikeStock(stockId) {
        const stockCard = document.querySelector(`[data-stock-id="${stockId}"]`);
        if (stockCard) {
            stockCard.remove();
        }
    }

    // Dynamic item management methods
    addDynamicItem(propertyName) {
        const container = document.getElementById(`${propertyName}-container`);
        if (!container) return;

        const itemIndex = container.children.length;
        const itemId = `${propertyName}-item-${itemIndex}`;

        // Get the current form to access its configuration
        const formId = 'dynamic-management';
        const form = this.schema.forms[formId];
        if (!form || !form.ui_config) return;

        const itemHTML = this.generateDynamicItemHTML(itemId, propertyName, itemIndex, form);
        container.insertAdjacentHTML('beforeend', itemHTML);
    }

    // Generate HTML for a dynamic item based on schema
    generateDynamicItemHTML(itemId, propertyName, itemIndex, form) {
        const itemTitle = this.normalizeFormName(propertyName.slice(0, -1));
        const field = form.fields[0]; // Get the dynamic array field
        const nestedStructure = field.nested_structure;

        let html = `
            <div class="card mb-4 dynamic-item-card" data-item-id="${itemId}">
                <div class="card-header">
                    <div class="d-flex justify-content-between align-items-center">
                        <h6 class="mb-0">${itemTitle} ${itemIndex + 1}</h6>
                        <button type="button" class="btn btn-outline-danger btn-sm" onclick="dynamicFormGenerator.removeDynamicItem('${itemId}')">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="card-body">
        `;

        // Generate basic item fields
        if (nestedStructure.item_fields) {
            html += '<div class="row g-3 mb-4">';
            nestedStructure.item_fields.forEach(field => {
                html += this.generateDynamicFieldHTML(field, itemId);
            });
            html += '</div>';
        }

        // Generate tabs for nested arrays
        if (nestedStructure.nested_arrays && nestedStructure.nested_arrays.length > 0) {
            html += '<ul class="nav nav-tabs" role="tablist">';
            nestedStructure.nested_arrays.forEach((nestedArray, index) => {
                const isActive = index === 0 ? 'active' : '';
                html += `
                    <li class="nav-item" role="presentation">
                        <button class="nav-link ${isActive}" data-bs-toggle="tab" data-bs-target="#${itemId}-${nestedArray.name}" type="button" role="tab">
                            ${nestedArray.label}
                        </button>
                    </li>
                `;
            });
            html += '</ul>';

            html += '<div class="tab-content mt-3">';
            nestedStructure.nested_arrays.forEach((nestedArray, index) => {
                const isActive = index === 0 ? 'show active' : '';
                html += `
                    <div class="tab-pane fade ${isActive}" id="${itemId}-${nestedArray.name}" role="tabpanel">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <h6>${nestedArray.label}</h6>
                            <button type="button" class="btn btn-outline-success btn-sm" onclick="dynamicFormGenerator.addNestedItem('${itemId}', '${nestedArray.name}')">
                                <i class="bi bi-plus"></i> Add ${nestedArray.label.slice(0, -1)}
                            </button>
                        </div>
                        <div id="${itemId}-${nestedArray.name}-container">
                            <!-- Nested items will be added here -->
                        </div>
                    </div>
                `;
            });
            html += '</div>';
        }

        html += '</div></div>';
        return html;
    }

    // Generate field HTML for dynamic fields
    generateDynamicFieldHTML(field, parentId) {
        const fieldId = `${parentId}_${field.name}`;
        const isRequired = field.required;
        const requiredAttr = isRequired ? 'required' : '';
        const colSize = field.input_type === 'textarea' ? 'col-12' : 'col-md-6';

        let html = `<div class="${colSize}"><div class="mb-3">`;
        
        html += `
            <label for="${fieldId}" class="form-label">
                ${field.label}
                ${isRequired ? '<span class="text-danger">*</span>' : ''}
            </label>
        `;

        if (field.description) {
            html += `<div class="form-text text-muted mb-2">${field.description}</div>`;
        }

        switch (field.input_type) {
            case 'text':
                html += `<input type="text" class="form-control" id="${fieldId}" name="${field.name}" placeholder="Enter ${field.label.toLowerCase()}" ${requiredAttr}>`;
                break;
            case 'number':
                const step = field.type === 'integer' ? '1' : '0.01';
                html += `<input type="number" class="form-control" id="${fieldId}" name="${field.name}" step="${step}" placeholder="Enter ${field.label.toLowerCase()}" ${requiredAttr}>`;
                break;
            case 'date':
                html += `<input type="date" class="form-control" id="${fieldId}" name="${field.name}" ${requiredAttr}>`;
                break;
            case 'select':
                html += `<select class="form-control" id="${fieldId}" name="${field.name}" ${requiredAttr}>`;
                html += `<option value="">Select ${field.label.toLowerCase()}</option>`;
                if (field.options) {
                    field.options.forEach(option => {
                        html += `<option value="${option.value}">${option.label}</option>`;
                    });
                }
                html += `</select>`;
                break;
            case 'dynamic_union':
                html += `<select class="form-control" id="${fieldId}" name="${field.name}" onchange="dynamicFormGenerator.handleDynamicUnionChange('${parentId}', '${field.name}', this.value)" ${requiredAttr}>`;
                html += `<option value="">Select ${field.label.toLowerCase()}</option>`;
                if (field.union_options) {
                    Object.keys(field.union_options).forEach(optionKey => {
                        const option = field.union_options[optionKey];
                        html += `<option value="${optionKey}">${option.label}</option>`;
                    });
                }
                html += `</select>`;
                break;
            case 'textarea':
                html += `<textarea class="form-control" id="${fieldId}" name="${field.name}" rows="3" placeholder="Enter ${field.label.toLowerCase()}" ${requiredAttr}></textarea>`;
                break;
            default:
                html += `<input type="text" class="form-control" id="${fieldId}" name="${field.name}" placeholder="Enter ${field.label.toLowerCase()}" ${requiredAttr}>`;
        }

        html += '</div></div>';
        return html;
    }

    // Handle dynamic union changes (like bike type selection)
    handleDynamicUnionChange(parentId, fieldName, selectedType) {
        const dynamicFieldsContainer = document.getElementById(`${parentId}_${fieldName}_dynamic_fields`);
        if (!dynamicFieldsContainer) {
            // Create dynamic fields container if it doesn't exist
            const parentCard = document.querySelector(`[data-item-id="${parentId}"]`);
            if (parentCard) {
                const cardBody = parentCard.querySelector('.card-body');
                const dynamicDiv = document.createElement('div');
                dynamicDiv.id = `${parentId}_${fieldName}_dynamic_fields`;
                dynamicDiv.className = 'mt-3';
                dynamicDiv.style.display = 'none';
                cardBody.appendChild(dynamicDiv);
            } else {
                return;
            }
        }

        const container = document.getElementById(`${parentId}_${fieldName}_dynamic_fields`);
        if (!container) return;

        // Clear existing dynamic fields
        container.innerHTML = '';
        container.style.display = 'none';

        if (!selectedType) return;

        // Get the union options from the current form
        const formId = 'dynamic-management';
        const form = this.schema.forms[formId];
        const field = form.fields[0];
        const unionField = field.nested_structure.dynamic_unions.find(u => u.name === fieldName);
        
        if (unionField && unionField.options[selectedType]) {
            const unionOption = unionField.options[selectedType];
            let additionalFieldsHTML = `<h6 class="border-bottom pb-2">${unionOption.label} Specifications</h6><div class="row g-3">`;
            
            unionOption.fields.forEach(unionFieldDef => {
                additionalFieldsHTML += this.generateDynamicFieldHTML(unionFieldDef, parentId);
            });
            
            additionalFieldsHTML += '</div>';
            
            container.innerHTML = additionalFieldsHTML;
            container.style.display = 'block';
        }
    }

    // Add nested item (like bike sales or bike stock)
    addNestedItem(parentId, nestedArrayName) {
        const container = document.getElementById(`${parentId}-${nestedArrayName}-container`);
        if (!container) return;

        const itemIndex = container.children.length;
        const nestedItemId = `${parentId}-${nestedArrayName}-${itemIndex}`;

        // Get nested array configuration
        const formId = 'dynamic-management';
        const form = this.schema.forms[formId];
        const field = form.fields[0];
        const nestedArray = field.nested_structure.nested_arrays.find(na => na.name === nestedArrayName);

        if (nestedArray) {
            const itemHTML = this.generateNestedItemHTML(nestedItemId, nestedArray, itemIndex);
            container.insertAdjacentHTML('beforeend', itemHTML);
        }
    }

    // Generate nested item HTML
    generateNestedItemHTML(itemId, nestedArrayConfig, itemIndex) {
        const itemTitle = nestedArrayConfig.label.slice(0, -1); // Remove 's' from plural
        
        let html = `
            <div class="card mb-3 nested-item-card" data-nested-id="${itemId}">
                <div class="card-header py-2">
                    <div class="d-flex justify-content-between align-items-center">
                        <small class="text-muted">${itemTitle} ${itemIndex + 1}</small>
                        <button type="button" class="btn btn-outline-danger btn-sm" onclick="dynamicFormGenerator.removeNestedItem('${itemId}')">
                            <i class="bi bi-x"></i>
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <div class="row g-3">
        `;

        nestedArrayConfig.fields.forEach(field => {
            html += this.generateDynamicFieldHTML(field, itemId);
        });

        html += '</div></div></div>';
        return html;
    }

    // Remove dynamic item
    removeDynamicItem(itemId) {
        const itemCard = document.querySelector(`[data-item-id="${itemId}"]`);
        if (itemCard) {
            itemCard.remove();
        }
    }

    // Remove nested item
    removeNestedItem(nestedId) {
        const nestedCard = document.querySelector(`[data-nested-id="${nestedId}"]`);
        if (nestedCard) {
            nestedCard.remove();
        }
    }

    // Generate HTML for individual field
    generateFieldHTML(field, formId) {
        const fieldId = `${formId}_${field.name}`;
        const isRequired = this.isFieldRequired(field.name, formId);
        const requiredClass = isRequired ? 'required' : '';
        const requiredAttr = isRequired ? 'required' : '';

        // Determine column size based on field type
        const colSize = field.input_type === 'textarea' || field.input_type === 'array' ? 'col-12' : 'col-md-6';

        let fieldHTML = `<div class="${colSize}"><div class="mb-3 field-group ${requiredClass}">`;
        
        // Field label
        fieldHTML += `
            <label for="${fieldId}" class="form-label">
                ${field.label}
                ${isRequired ? '<span class="text-danger">*</span>' : ''}
            </label>
        `;

        // Field description
        if (field.description) {
            fieldHTML += `<div class="form-text text-muted mb-2">${field.description}</div>`;
        }

        // Generate input based on field type
        switch (field.input_type) {
            case 'text':
                fieldHTML += this.generateTextInput(field, fieldId, requiredAttr);
                break;
            case 'number':
                fieldHTML += this.generateNumberInput(field, fieldId, requiredAttr);
                break;
            case 'array':
                fieldHTML += this.generateArrayInput(field, fieldId, requiredAttr);
                break;
            case 'select':
                fieldHTML += this.generateSelectInput(field, fieldId, requiredAttr);
                break;
            case 'textarea':
                fieldHTML += this.generateTextareaInput(field, fieldId, requiredAttr);
                break;
            default:
                fieldHTML += this.generateTextInput(field, fieldId, requiredAttr);
        }

        // Validation feedback
        fieldHTML += `
            <div class="invalid-feedback" id="${fieldId}_error"></div>
        `;

        fieldHTML += `</div></div>`; // Close field-group and column div
        return fieldHTML;
    }

    // Generate text input
    generateTextInput(field, fieldId, requiredAttr) {
        const placeholder = field.placeholder || `Enter ${field.label.toLowerCase()}`;
        const validation = field.validation || {};
        
        let attributes = `
            id="${fieldId}" 
            name="${field.name}" 
            class="form-control" 
            placeholder="${placeholder}"
            ${requiredAttr}
        `;

        if (validation.min_length) attributes += ` minlength="${validation.min_length}"`;
        if (validation.max_length) attributes += ` maxlength="${validation.max_length}"`;
        if (validation.pattern) attributes += ` pattern="${validation.pattern}"`;

        return `<input type="text" ${attributes} onchange="dynamicFormGenerator.validateField('${fieldId}')" oninput="dynamicFormGenerator.updateCompletionBadges()">`;
    }

    // Generate number input
    generateNumberInput(field, fieldId, requiredAttr) {
        const placeholder = field.placeholder || `Enter ${field.label.toLowerCase()}`;
        const validation = field.validation || {};
        const step = field.step || (field.type === 'integer' ? '1' : '0.01');
        
        let attributes = `
            id="${fieldId}" 
            name="${field.name}" 
            class="form-control" 
            placeholder="${placeholder}"
            step="${step}"
            ${requiredAttr}
        `;

        if (validation.minimum !== null) attributes += ` min="${validation.minimum}"`;
        if (validation.maximum !== null) attributes += ` max="${validation.maximum}"`;

        return `<input type="number" ${attributes} onchange="dynamicFormGenerator.validateField('${fieldId}')" oninput="dynamicFormGenerator.updateCompletionBadges()">`;
    }

    // Generate array input (tags-like input)
    generateArrayInput(field, fieldId, requiredAttr) {
        const arrayConfig = field.array_config || {};
        const addButtonText = arrayConfig.add_button_text || `Add ${field.label}`;
        const removeButtonText = arrayConfig.remove_button_text || 'Remove';
        
        // For simple arrays (no complex item schema), use comma-separated input
        if (!arrayConfig.item_schema || !arrayConfig.item_schema.$ref) {
            return `
                <div class="array-input-container">
                    <input type="text" 
                           id="${fieldId}" 
                           name="${field.name}" 
                           class="form-control" 
                           placeholder="Enter items separated by commas"
                           ${requiredAttr}
                           onchange="dynamicFormGenerator.validateField('${fieldId}')"
                           oninput="dynamicFormGenerator.updateCompletionBadges()"
                           data-array="true">
                    <div class="form-text">Enter multiple values separated by commas</div>
                </div>
            `;
        }
        
        // For complex arrays with references to other schemas
        return `
            <div class="complex-array-container" id="${fieldId}_container">
                <div class="array-items" id="${fieldId}_items">
                    <div class="text-muted mb-2">No items added yet</div>
                </div>
                <button type="button" 
                        class="btn btn-outline-primary btn-sm" 
                        onclick="dynamicFormGenerator.addArrayItem('${fieldId}', '${field.name}')">
                    <i class="bi bi-plus-circle me-1"></i>${addButtonText}
                </button>
                <input type="hidden" 
                       id="${fieldId}" 
                       name="${field.name}" 
                       value="[]"
                       ${requiredAttr}>
            </div>
        `;
    }

    // Method to add array items dynamically
    addArrayItem(fieldId, fieldName) {
        const container = document.getElementById(`${fieldId}_items`);
        const itemCount = container.children.length;
        const itemId = `${fieldId}_item_${itemCount}`;
        
        // Clear the "no items" message
        if (container.children.length === 1 && container.children[0].classList.contains('text-muted')) {
            container.innerHTML = '';
        }
        
        const itemHTML = `
            <div class="array-item border rounded p-3 mb-2" id="${itemId}">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <h6 class="mb-0">Item ${itemCount + 1}</h6>
                    <button type="button" 
                            class="btn btn-outline-danger btn-sm" 
                            onclick="dynamicFormGenerator.removeArrayItem('${itemId}', '${fieldId}')">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
                <div class="row">
                    <div class="col-md-6">
                        <label class="form-label">Name</label>
                        <input type="text" class="form-control" placeholder="Enter name">
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">Value</label>
                        <input type="text" class="form-control" placeholder="Enter value">
                    </div>
                </div>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', itemHTML);
        this.updateArrayValue(fieldId);
    }

    // Method to remove array items
    removeArrayItem(itemId, fieldId) {
        const item = document.getElementById(itemId);
        if (item) {
            item.remove();
            this.updateArrayValue(fieldId);
            
            // Show "no items" message if empty
            const container = document.getElementById(`${fieldId}_items`);
            if (container.children.length === 0) {
                container.innerHTML = '<div class="text-muted mb-2">No items added yet</div>';
            }
        }
    }

    // Update the hidden input value with array data
    updateArrayValue(fieldId) {
        const container = document.getElementById(`${fieldId}_items`);
        const items = [];
        
        container.querySelectorAll('.array-item').forEach(item => {
            const inputs = item.querySelectorAll('input');
            if (inputs.length >= 2) {
                items.push({
                    name: inputs[0].value,
                    value: inputs[1].value
                });
            }
        });
        
        const hiddenInput = document.getElementById(fieldId);
        if (hiddenInput) {
            hiddenInput.value = JSON.stringify(items);
        }
    }

    // Generate textarea input
    generateTextareaInput(field, fieldId, requiredAttr) {
        const placeholder = field.placeholder || `Enter ${field.label.toLowerCase()}`;
        
        return `
            <textarea id="${fieldId}" 
                     name="${field.name}" 
                     class="form-control" 
                     placeholder="${placeholder}"
                     rows="3"
                     ${requiredAttr}
                     onchange="dynamicFormGenerator.validateField('${fieldId}')"
                     oninput="dynamicFormGenerator.updateCompletionBadges()"></textarea>
        `;
    }

    // Generate select input
    generateSelectInput(field, fieldId, requiredAttr) {
        let html = `
            <select id="${fieldId}" 
                   name="${field.name}" 
                   class="form-select" 
                   ${requiredAttr}
                   onchange="dynamicFormGenerator.validateField('${fieldId}'); dynamicFormGenerator.updateCompletionBadges();">
                <option value="">Select ${field.label}</option>
        `;

        // Add options if available
        if (field.options) {
            field.options.forEach(option => {
                html += `<option value="${option.value}">${option.label}</option>`;
            });
        }

        html += `</select>`;
        return html;
    }

    // Check if field is required
    isFieldRequired(fieldName, formId) {
        if (!this.schema || !this.schema.forms[formId]) return false;
        
        const form = this.schema.forms[formId];
        return form.validation.required_fields.includes(fieldName);
    }

    // Validate individual field
    validateField(fieldId) {
        const field = document.getElementById(fieldId);
        if (!field) return true;

        const isValid = field.checkValidity();
        const errorDiv = document.getElementById(`${fieldId}_error`);

        if (isValid) {
            field.classList.remove('is-invalid');
            field.classList.add('is-valid');
            if (errorDiv) errorDiv.textContent = '';
        } else {
            field.classList.remove('is-valid');
            field.classList.add('is-invalid');
            if (errorDiv) errorDiv.textContent = field.validationMessage;
        }

        // Update completion badge for this form
        this.updateCompletionBadges();

        return isValid;
    }

    // Update completion badges for all selected forms
    updateCompletionBadges() {
        this.selectedForms.forEach(formId => {
            const formCard = document.querySelector(`[data-form-id="${formId}"]`);
            if (!formCard) return;

            const form = this.schema.forms[formId];
            if (!form) return;

            // Get current form data to show completion status
            const formData = this.getFormData(formId);
            const completedFields = Object.keys(formData).length;
            const totalFields = form.fields.length;
            const isComplete = completedFields > 0;

            // Find and update the badge
            const badgeContainer = formCard.querySelector('.card-header .ms-3');
            if (badgeContainer) {
                badgeContainer.innerHTML = isComplete ? 
                    `<span class="badge bg-success">${completedFields}/${totalFields}</span>` :
                    `<span class="badge bg-warning">Empty</span>`;
            }
        });
    }

    // Collect form data
    collectFormData(formId) {
        // Check if this is dynamic management form
        const form = this.schema.forms[formId];
        if (form && form.ui_config && form.ui_config.type === 'dynamic_management') {
            return this.collectDynamicManagementData(form);
        }
        
        // Check if this is store management form
        if (form && form.ui_config && form.ui_config.type === 'store_management') {
            return this.collectStoreManagementData();
        }

        // Default form data collection
        const formElement = document.querySelector(`[data-form-id="${formId}"] form`);
        if (!formElement) return null;

        const formData = {};
        const inputs = formElement.querySelectorAll('input, select, textarea');

        inputs.forEach(input => {
            const name = input.name;
            let value = input.value;

            // Handle complex array inputs (JSON stored in hidden inputs)
            if (input.type === 'hidden' && name && value.startsWith('[')) {
                try {
                    value = JSON.parse(value);
                } catch (e) {
                    console.warn('Failed to parse array JSON:', value);
                    value = [];
                }
            }
            // Handle simple array inputs (comma-separated)
            else if (input.dataset.array === 'true') {
                value = value.split(',').map(item => item.trim()).filter(item => item.length > 0);
            }
            // Handle number inputs
            else if (input.type === 'number' && value !== '') {
                value = input.step && input.step.includes('.') ? parseFloat(value) : parseInt(value);
            }
            // Handle boolean checkboxes
            else if (input.type === 'checkbox') {
                value = input.checked;
            }

            // Only add to formData if the input has a name and isn't empty (unless it's a valid falsy value)
            if (name && (value !== '' || typeof value === 'boolean' || Array.isArray(value))) {
                formData[name] = value;
            }
        });

        console.log('Collected form data:', formData);
        return formData;
    }

    // Collect store management data in the proper nested structure
    collectStoreManagementData() {
        const storesData = [];
        const storeCards = document.querySelectorAll('.store-card');

        storeCards.forEach(storeCard => {
            const storeId = storeCard.dataset.storeId;
            
            // Collect store basic info
            const storeData = {
                name: storeCard.querySelector(`#${storeId}_name`)?.value || '',
                location: storeCard.querySelector(`#${storeId}_location`)?.value || '',
                bike_sales: [],
                bike_stock: []
            };

            // Collect bike sales
            const salesCards = storeCard.querySelectorAll('.bike-sale-card');
            salesCards.forEach(saleCard => {
                const saleId = saleCard.dataset.saleId;
                const saleData = {
                    product_code: saleCard.querySelector(`#${saleId}_product_code`)?.value || '',
                    quantity_sold: parseInt(saleCard.querySelector(`#${saleId}_quantity_sold`)?.value) || 0,
                    sale_date: saleCard.querySelector(`#${saleId}_sale_date`)?.value || '',
                    year: parseInt(saleCard.querySelector(`#${saleId}_year`)?.value) || 0,
                    month: saleCard.querySelector(`#${saleId}_month`)?.value || '',
                    customer_review: {
                        rating: parseFloat(saleCard.querySelector(`#${saleId}_rating`)?.value) || 0,
                        comment: saleCard.querySelector(`#${saleId}_comment`)?.value || ''
                    }
                };
                
                if (saleData.product_code && saleData.quantity_sold > 0) {
                    storeData.bike_sales.push(saleData);
                }
            });

            // Collect bike stock
            const stockCards = storeCard.querySelectorAll('.bike-stock-card');
            stockCards.forEach(stockCard => {
                const stockId = stockCard.dataset.stockId;
                const bikeType = stockCard.querySelector(`#${stockId}_bike_type`)?.value;
                
                const stockData = {
                    quantity: parseInt(stockCard.querySelector(`#${stockId}_quantity`)?.value) || 0,
                    bike: {
                        brand: stockCard.querySelector(`#${stockId}_brand`)?.value || '',
                        model: stockCard.querySelector(`#${stockId}_model`)?.value || '',
                        year: parseInt(stockCard.querySelector(`#${stockId}_year`)?.value) || 0,
                        price: parseFloat(stockCard.querySelector(`#${stockId}_price`)?.value) || 0
                    }
                };

                // Add bike type specific fields
                if (bikeType === 'electric') {
                    stockData.bike.battery_capacity = parseFloat(stockCard.querySelector(`#${stockId}_battery_capacity`)?.value) || 0;
                    stockData.bike.motor_power = parseFloat(stockCard.querySelector(`#${stockId}_motor_power`)?.value) || 0;
                } else if (bikeType === 'mountain') {
                    stockData.bike.suspension = stockCard.querySelector(`#${stockId}_suspension`)?.value || '';
                } else if (bikeType === 'road') {
                    stockData.bike.frame_material = stockCard.querySelector(`#${stockId}_frame_material`)?.value || '';
                }

                if (stockData.quantity >= 0 && stockData.bike.brand && stockData.bike.model) {
                    storeData.bike_stock.push(stockData);
                }
            });

            // Only add store if it has basic info
            if (storeData.name && storeData.location) {
                storesData.push(storeData);
            }
        });

        console.log('Collected store management data:', { stores: storesData });
        return { stores: storesData };
    }

    // Collect dynamic management data in the proper nested structure
    collectDynamicManagementData(form) {
        const mainProperty = form.ui_config.main_property;
        const itemsData = [];
        const itemCards = document.querySelectorAll('.dynamic-item-card');

        itemCards.forEach(itemCard => {
            const itemId = itemCard.dataset.itemId;
            
            // Collect basic item data
            const itemData = {};
            const basicInputs = itemCard.querySelectorAll('input, select, textarea');
            
            basicInputs.forEach(input => {
                if (input.name && input.value !== '') {
                    let value = input.value;
                    
                    // Handle different input types
                    if (input.type === 'number') {
                        value = input.step && input.step.includes('.') ? parseFloat(value) : parseInt(value);
                    } else if (input.type === 'date') {
                        value = input.value;
                    }
                    
                    // Handle nested object structure
                    if (input.name.includes('_')) {
                        const parts = input.name.split('_');
                        if (parts.length === 2) {
                            const [parentField, childField] = parts;
                            if (!itemData[parentField]) {
                                itemData[parentField] = {};
                            }
                            itemData[parentField][childField] = value;
                        }
                    } else {
                        itemData[input.name] = value;
                    }
                }
            });

            // Collect nested arrays data
            const field = form.fields[0];
            if (field.nested_structure && field.nested_structure.nested_arrays) {
                field.nested_structure.nested_arrays.forEach(nestedArray => {
                    const nestedArrayName = nestedArray.name;
                    itemData[nestedArrayName] = [];
                    
                    const nestedCards = itemCard.querySelectorAll(`[data-nested-id^="${itemId}-${nestedArrayName}"]`);
                    nestedCards.forEach(nestedCard => {
                        const nestedData = {};
                        const nestedInputs = nestedCard.querySelectorAll('input, select, textarea');
                        
                        nestedInputs.forEach(input => {
                            if (input.name && input.value !== '') {
                                let value = input.value;
                                
                                if (input.type === 'number') {
                                    value = input.step && input.step.includes('.') ? parseFloat(value) : parseInt(value);
                                }
                                
                                // Handle nested object structure (like customer_review.rating)
                                if (input.name.includes('_') && nestedArray.name === 'bike_sales' && input.name.startsWith('customer_review')) {
                                    if (!nestedData.customer_review) {
                                        nestedData.customer_review = {};
                                    }
                                    const fieldName = input.name.replace('customer_review_', '');
                                    nestedData.customer_review[fieldName] = value;
                                } else {
                                    nestedData[input.name] = value;
                                }
                            }
                        });
                        
                        if (Object.keys(nestedData).length > 0) {
                            itemData[nestedArrayName].push(nestedData);
                        }
                    });
                });
            }

            // Only add item if it has some data
            if (Object.keys(itemData).length > 0) {
                itemsData.push(itemData);
            }
        });

        const result = {};
        result[mainProperty] = itemsData;
        
        console.log('Collected dynamic management data:', result);
        return result;
    }

    // Load data into store management form
    loadStoreManagementData(data) {
        if (!data || !data.stores || !Array.isArray(data.stores)) return;

        // Clear existing stores
        const storesContainer = document.getElementById('stores-container');
        if (!storesContainer) return;
        storesContainer.innerHTML = '';

        // Add each store
        data.stores.forEach((store, storeIndex) => {
            this.addStore();
            const storeId = `store-${storeIndex}`;
            const storeCard = document.querySelector(`[data-store-id="${storeId}"]`);
            if (!storeCard) return;

            // Fill store basic info
            const nameInput = storeCard.querySelector(`#${storeId}_name`);
            const locationInput = storeCard.querySelector(`#${storeId}_location`);
            if (nameInput) nameInput.value = store.name || '';
            if (locationInput) locationInput.value = store.location || '';

            // Add bike sales
            if (store.bike_sales && Array.isArray(store.bike_sales)) {
                store.bike_sales.forEach((sale, saleIndex) => {
                    this.addBikeSale(storeId);
                    const saleId = `${storeId}-sale-${saleIndex}`;
                    const saleCard = document.querySelector(`[data-sale-id="${saleId}"]`);
                    if (!saleCard) return;

                    // Fill sale data
                    this.setInputValue(saleCard, `${saleId}_product_code`, sale.product_code);
                    this.setInputValue(saleCard, `${saleId}_quantity_sold`, sale.quantity_sold);
                    this.setInputValue(saleCard, `${saleId}_sale_date`, sale.sale_date);
                    this.setInputValue(saleCard, `${saleId}_year`, sale.year);
                    this.setInputValue(saleCard, `${saleId}_month`, sale.month);

                    // Fill customer review
                    if (sale.customer_review) {
                        this.setInputValue(saleCard, `${saleId}_rating`, sale.customer_review.rating);
                        this.setInputValue(saleCard, `${saleId}_comment`, sale.customer_review.comment);
                    }
                });
            }

            // Add bike stock
            if (store.bike_stock && Array.isArray(store.bike_stock)) {
                store.bike_stock.forEach((stock, stockIndex) => {
                    this.addBikeStock(storeId);
                    const stockId = `${storeId}-stock-${stockIndex}`;
                    const stockCard = document.querySelector(`[data-stock-id="${stockId}"]`);
                    if (!stockCard) return;

                    // Fill stock data
                    this.setInputValue(stockCard, `${stockId}_quantity`, stock.quantity);

                    // Fill bike data
                    if (stock.bike) {
                        this.setInputValue(stockCard, `${stockId}_brand`, stock.bike.brand);
                        this.setInputValue(stockCard, `${stockId}_model`, stock.bike.model);
                        this.setInputValue(stockCard, `${stockId}_year`, stock.bike.year);
                        this.setInputValue(stockCard, `${stockId}_price`, stock.bike.price);

                        // Determine bike type and set specific fields
                        let bikeType = '';
                        if (stock.bike.battery_capacity !== undefined || stock.bike.motor_power !== undefined) {
                            bikeType = 'electric';
                        } else if (stock.bike.suspension !== undefined) {
                            bikeType = 'mountain';
                        } else if (stock.bike.frame_material !== undefined) {
                            bikeType = 'road';
                        }

                        if (bikeType) {
                            this.setInputValue(stockCard, `${stockId}_bike_type`, bikeType);
                            // Trigger change event to show type-specific fields
                            const bikeTypeSelect = stockCard.querySelector(`#${stockId}_bike_type`);
                            if (bikeTypeSelect) {
                                this.handleBikeTypeChange(stockId, bikeType);
                                
                                // Set type-specific values after fields are created
                                setTimeout(() => {
                                    if (bikeType === 'electric') {
                                        this.setInputValue(stockCard, `${stockId}_battery_capacity`, stock.bike.battery_capacity);
                                        this.setInputValue(stockCard, `${stockId}_motor_power`, stock.bike.motor_power);
                                    } else if (bikeType === 'mountain') {
                                        this.setInputValue(stockCard, `${stockId}_suspension`, stock.bike.suspension);
                                    } else if (bikeType === 'road') {
                                        this.setInputValue(stockCard, `${stockId}_frame_material`, stock.bike.frame_material);
                                    }
                                }, 100);
                            }
                        }
                    }
                });
            }
        });
    }

    // Helper method to set input value safely
    setInputValue(container, inputId, value) {
        const input = container.querySelector(`#${inputId}`);
        if (input && value !== undefined && value !== null) {
            input.value = value;
        }
    }

    // Validate entire form
    validateForm(formId) {
        const formElement = document.querySelector(`[data-form-id="${formId}"] form`);
        if (!formElement) return false;

        let isValid = true;
        const inputs = formElement.querySelectorAll('input, select, textarea');

        inputs.forEach(input => {
            if (!this.validateField(input.id)) {
                isValid = false;
            }
        });

        return isValid;
    }

    // Submit form (programmatic use - no UI button since forms are submitted via main evaluation button)
    submitForm(formId) {
        console.log('Submitting form:', formId);

        if (!this.validateForm(formId)) {
            alert('Please fix validation errors before submitting');
            return;
        }

        const formData = this.collectFormData(formId);
        console.log('Form data collected:', formData);

        // Trigger custom event for form submission
        const event = new CustomEvent('dynamicFormSubmitted', {
            detail: {
                formId: formId,
                formData: formData,
                schema: this.schema.forms[formId]
            }
        });
        document.dispatchEvent(event);

        // Show success message
        this.showMessage('Form submitted successfully!', 'success');
    }

    // Reset form
    resetForm(formId) {
        const formElement = document.querySelector(`[data-form-id="${formId}"] form`);
        if (!formElement) return;

        formElement.reset();
        
        // Remove validation classes
        const inputs = formElement.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.classList.remove('is-valid', 'is-invalid');
        });

        this.showMessage('Form reset successfully!', 'info');
    }

    // Show message
    showMessage(message, type = 'info') {
        // Create toast notification
        const toastHTML = `
            <div class="toast align-items-center text-white bg-${type === 'success' ? 'success' : type === 'error' ? 'danger' : 'info'} border-0" role="alert">
                <div class="d-flex">
                    <div class="toast-body">${message}</div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                </div>
            </div>
        `;

        // Add to toast container or create one
        let toastContainer = document.querySelector('.toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
            document.body.appendChild(toastContainer);
        }

        toastContainer.insertAdjacentHTML('beforeend', toastHTML);
        
        // Show toast
        const toastElement = toastContainer.lastElementChild;
        const toast = new bootstrap.Toast(toastElement);
        toast.show();

        // Remove after hiding
        toastElement.addEventListener('hidden.bs.toast', () => {
            toastElement.remove();
        });
    }

    // Render form selector
    renderFormSelector(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Preserve existing form data before re-rendering
        const preservedData = {};
        this.selectedForms.forEach(formId => {
            preservedData[formId] = this.getFormData(formId);
        });

        const allForms = this.getAvailableForms();
        const availableForms = allForms.filter(form => !this.selectedForms.has(form.id));
        
        // Auto-select single dynamic management forms
        if (this.selectedForms.size === 0 && allForms.length === 1 && 
            this.schema.forms[allForms[0].id]?.ui_config?.type === 'dynamic_management') {
            this.selectedForms.add(allForms[0].id);
            // Auto-add first item after a brief delay
            setTimeout(() => {
                const form = this.schema.forms[allForms[0].id];
                const mainProperty = form.ui_config.main_property;
                this.addDynamicItem(mainProperty);
            }, 100);
        }
        
        let html = '';

        // Show selected forms first (if any)
        if (this.selectedForms.size > 0) {
            html += `
                <div class="selected-forms-section mb-4">
                    <div id="selectedFormsContainer">
                        ${this.renderSelectedForms()}
                    </div>
                </div>
            `;
        }

        // Show form selector for remaining forms only if there are multiple forms or non-dynamic management forms
        const shouldShowSelector = availableForms.length > 0 && 
            !(allForms.length === 1 && this.schema.forms[allForms[0].id]?.ui_config?.type === 'dynamic_management');
            
        if (shouldShowSelector) {
            html += `
                <div class="form-selector mb-4">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h5 class="mb-0">
                            <i class="bi bi-plus-circle text-primary me-2"></i>
                            Add Form Section
                        </h5>
                        <small class="text-muted">Select forms to add input data</small>
                    </div>
                    <div class="row">
            `;

            availableForms.forEach(form => {
                html += `
                    <div class="col-md-6 col-lg-4 mb-3">
                        <div class="card form-card h-100" style="cursor: pointer;" onclick="dynamicFormGenerator.selectForm('${form.id}')">
                            <div class="card-body">
                                <div class="d-flex justify-content-between align-items-start mb-2">
                                    <h6 class="card-title mb-0">${form.title}</h6>
                                    <i class="bi bi-plus-circle text-primary"></i>
                                </div>
                                <p class="card-text text-muted small">${form.description}</p>
                            </div>
                        </div>
                    </div>
                `;
            });

            html += `
                    </div>
                </div>
            `;
        } else if (availableForms.length === 0 && this.selectedForms.size > 1) {
            // All forms selected (only show when multiple forms)
            html += `
                <div class="alert alert-success">
                    <i class="bi bi-check-circle-fill me-2"></i>
                    <strong>All Available Forms Selected!</strong> 
                    You can now run the evaluation with all form data.
                </div>
            `;
        }

        container.innerHTML = html;
        
        // Restore form data after re-rendering
        setTimeout(() => {
            this.restoreFormData(preservedData);
            this.updateCompletionBadges();
        }, 10);
    }
    
    // Restore form data to recreated form elements
    restoreFormData(preservedData) {
        for (const [formId, formData] of Object.entries(preservedData)) {
            for (const [fieldName, value] of Object.entries(formData)) {
                if (value === null || value === '' || value === undefined) continue;
                
                // Try different selector strategies to find the field
                const selectors = [
                    `#${formId}_${fieldName}`,
                    `input[name="${fieldName}"]`,
                    `select[name="${fieldName}"]`,
                    `textarea[name="${fieldName}"]`,
                    `[data-field="${fieldName}"]`
                ];
                
                let fieldElement = null;
                for (const selector of selectors) {
                    fieldElement = document.querySelector(selector);
                    if (fieldElement) break;
                }
                
                if (fieldElement) {
                    // Restore value based on field type
                    if (fieldElement.type === 'checkbox') {
                        fieldElement.checked = value;
                    } else if (fieldElement.type === 'radio') {
                        if (fieldElement.value === value) {
                            fieldElement.checked = true;
                        }
                    } else {
                        fieldElement.value = value;
                    }
                }
            }
        }
    }

    // Render currently selected forms
    renderSelectedForms() {
        let html = '';
        
        // Check if we have only one form with dynamic management type
        const formsArray = Array.from(this.selectedForms);
        const singleDynamicManagement = formsArray.length === 1 && 
            this.schema.forms[formsArray[0]]?.ui_config?.type === 'dynamic_management';
        
        this.selectedForms.forEach(formId => {
            const form = this.schema.forms[formId];
            if (!form) return;

            // For single dynamic management forms, skip the card wrapper and make always visible
            if (singleDynamicManagement) {
                html += `
                    <div class="selected-form-card mb-3" data-form-id="${formId}">
                        <div id="form-content-${formId}">
                            ${this.generateFormHTML(formId)}
                        </div>
                    </div>
                `;
                return;
            }

            // Standard card layout for multiple forms or non-dynamic management forms
            const formData = this.getFormData(formId);
            const completedFields = Object.keys(formData).length;
            const totalFields = form.fields.length;
            const isComplete = completedFields > 0;

            html += `
                <div class="selected-form-card mb-3" data-form-id="${formId}">
                    <div class="card">
                        <div class="card-header py-2">
                            <div class="d-flex justify-content-between align-items-center">
                                <div class="d-flex align-items-center">
                                    <h6 class="mb-0">${form.title}</h6>
                                    <div class="ms-3">
                                        ${isComplete ? 
                                            `<span class="badge bg-success">${completedFields}/${totalFields}</span>` :
                                            `<span class="badge bg-warning">Empty</span>`
                                        }
                                    </div>
                                </div>
                                <div class="btn-group btn-group-sm">
                                    <button type="button" 
                                            class="btn btn-outline-primary btn-sm" 
                                            onclick="dynamicFormGenerator.toggleFormVisibility('${formId}')"
                                            title="Toggle form visibility">
                                        <i class="bi bi-eye${this.isFormVisible(formId) ? '-slash' : ''}"></i>
                                    </button>
                                    <button type="button" 
                                            class="btn btn-outline-danger btn-sm" 
                                            onclick="dynamicFormGenerator.removeForm('${formId}')"
                                            title="Remove this form">
                                        <i class="bi bi-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div class="card-body p-0" id="form-content-${formId}" ${this.isFormVisible(formId) ? '' : 'style="display: none;"'}>
                            ${this.generateFormHTML(formId)}
                        </div>
                    </div>
                </div>
            `;
        });

        return html;
    }

    // Select and add a form to the selected forms section
    selectForm(formId) {
        if (this.selectedForms.has(formId)) {
            console.log('Form already selected:', formId);
            return;
        }

        // Add to selected forms
        this.selectedForms.add(formId);
        
        // Re-render the entire selector to update both sections
        this.renderFormSelector('dynamicFormsContainer');
        
        // For single dynamic management forms, automatically add the first item
        const form = this.schema.forms[formId];
        const formsArray = Array.from(this.selectedForms);
        const singleDynamicManagement = formsArray.length === 1 && 
            form?.ui_config?.type === 'dynamic_management';
        
        if (singleDynamicManagement) {
            setTimeout(() => {
                const mainProperty = form.ui_config.main_property;
                this.addDynamicItem(mainProperty);
            }, 100);
        }
        
        // Scroll to the newly added form
        setTimeout(() => {
            const formElement = document.querySelector(`[data-form-id="${formId}"]`);
            if (formElement) {
                formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);
    }

    // Remove a form from selected forms
    removeForm(formId) {
        if (!this.selectedForms.has(formId)) return;

        // Confirm removal if form has data
        const formData = this.getFormData(formId);
        if (Object.keys(formData).length > 0) {
            if (!confirm('This form contains data. Are you sure you want to remove it?')) {
                return;
            }
        }

        // Remove from selected forms
        this.selectedForms.delete(formId);
        
        // Clear any stored data for this form
        delete this.currentFormData[formId];
        
        // Re-render the selector
        this.renderFormSelector('dynamicFormsContainer');
    }

    // Toggle form visibility (collapse/expand)
    toggleFormVisibility(formId) {
        const formContent = document.getElementById(`form-content-${formId}`);
        if (!formContent) return;

        const isVisible = formContent.style.display !== 'none';
        formContent.style.display = isVisible ? 'none' : '';
        
        // Update the eye icon
        const toggleBtn = document.querySelector(`button[onclick="dynamicFormGenerator.toggleFormVisibility('${formId}')"] i`);
        if (toggleBtn) {
            toggleBtn.className = isVisible ? 'bi bi-eye' : 'bi bi-eye-slash';
        }
    }

    // Check if form is currently visible
    isFormVisible(formId) {
        // For single dynamic management forms, always visible
        const formsArray = Array.from(this.selectedForms);
        const singleDynamicManagement = formsArray.length === 1 && 
            this.schema.forms[formsArray[0]]?.ui_config?.type === 'dynamic_management';
        
        if (singleDynamicManagement && formId === formsArray[0]) {
            return true;
        }
        
        const formContent = document.getElementById(`form-content-${formId}`);
        return formContent ? formContent.style.display !== 'none' : true;
    }

    // Reset all selected forms
    resetAllForms() {
        this.selectedForms.clear();
        this.currentFormData = {};
        this.renderFormSelector('dynamicFormsContainer');
    }

    // Get data from all rendered forms
    getAllFormsData() {
        const allData = {};
        
        if (!this.schema || !this.schema.forms) {
            console.warn('No schema loaded, cannot collect form data');
            return allData;
        }
        
        // Only collect data from selected forms
        this.selectedForms.forEach(formId => {
            const formData = this.getFormData(formId);
            if (Object.keys(formData).length > 0) {
                allData[formId] = formData;
            }
        });
        
        console.log('Collected data from selected forms:', allData);
        return allData;
    }

    // Get data from a specific form
    getFormData(formId) {
        const formData = {};
        
        if (!this.schema?.forms?.[formId]) {
            console.warn(`Form ${formId} not found in schema`);
            return formData;
        }
        
        const formConfig = this.schema.forms[formId];
        
        // Collect data for each field in the form
        for (const field of formConfig.fields) {
            const fieldName = field.name;
            let value = null;
            
            // Try different selector strategies to find the field
            const selectors = [
                `#${formId}_${fieldName}`,
                `input[name="${fieldName}"]`,
                `select[name="${fieldName}"]`,
                `textarea[name="${fieldName}"]`,
                `[data-field="${fieldName}"]`
            ];
            
            let fieldElement = null;
            for (const selector of selectors) {
                fieldElement = document.querySelector(selector);
                if (fieldElement) break;
            }
            
            if (fieldElement) {
                // Get value based on field type
                if (fieldElement.type === 'checkbox') {
                    value = fieldElement.checked;
                } else if (fieldElement.type === 'number') {
                    value = fieldElement.value ? parseFloat(fieldElement.value) : null;
                } else if (fieldElement.type === 'radio') {
                    const checkedRadio = document.querySelector(`input[name="${fieldName}"]:checked`);
                    value = checkedRadio ? checkedRadio.value : null;
                } else {
                    value = fieldElement.value;
                }
                
                // Only include non-empty values
                if (value !== null && value !== '' && value !== undefined) {
                    formData[fieldName] = value;
                }
            }
        }
        
        return formData;
    }

    // Get flattened data from all forms (for simpler access)
    getFlattenedData() {
        const allData = this.getAllFormsData();
        const flattened = {};
        
        for (const [formId, formData] of Object.entries(allData)) {
            for (const [fieldName, value] of Object.entries(formData)) {
                // Use fieldName directly, or prefix with formId if there are conflicts
                const key = flattened[fieldName] ? `${formId}_${fieldName}` : fieldName;
                flattened[key] = value;
            }
        }
        
        return flattened;
    }
}

// Create global instance
const dynamicFormGenerator = new DynamicFormGenerator();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DynamicFormGenerator;
}
