-- ============================================================================
-- MEP INVENTORY SYSTEM - CATEGORY SPECIFIC EXTENSION TABLES
-- ============================================================================
-- Purpose: Store category-specific technical specifications
-- These tables extend the base materials table with specialized attributes
-- ============================================================================

-- ============================================================================
-- PIPES & FITTINGS SPECIFICATIONS
-- ============================================================================

CREATE TABLE material_pipe_specs (
    material_id VARCHAR(50) PRIMARY KEY,
    
    -- Material composition
    material_type VARCHAR(100),        -- 'Black Steel', 'Galvanized', 'Stainless Steel', 'PVC', 'CPVC', 'HDPE'
    material_grade VARCHAR(50),        -- 'Grade A', 'Grade B', 'Grade 304', 'Grade 316'
    
    -- Manufacturing
    manufacturing_method VARCHAR(50),  -- 'ERW', 'Seamless', 'Cast', 'Forged'
    schedule VARCHAR(50),              -- 'Sch 40', 'Sch 80', 'Sch 160'
    
    -- Dimensions
    nominal_size VARCHAR(50),          -- '1/2"', '3/4"', '1"'
    outer_diameter_mm DECIMAL(10,3),
    inner_diameter_mm DECIMAL(10,3),
    wall_thickness_mm DECIMAL(10,3),
    
    -- Pressure ratings
    pressure_rating VARCHAR(50),       -- 'PN10', 'PN16', 'PN25', 'Class 150', 'Class 300'
    max_working_pressure_bar DECIMAL(10,2),
    test_pressure_bar DECIMAL(10,2),
    
    -- Temperature ratings
    min_temp_celsius DECIMAL(10,2),
    max_temp_celsius DECIMAL(10,2),
    
    -- Surface treatment
    coating VARCHAR(100),              -- 'Black Paint', 'Galvanized', 'Epoxy Coated'
    coating_thickness_micron DECIMAL(10,2),
    
    -- Standards compliance
    standard_compliance VARCHAR(200),  -- 'ASTM A53', 'BS 1387', 'DIN 2440', 'JIS G3452'
    certification VARCHAR(200),        -- 'ISO 9001', 'API', 'CE'
    
    -- Connection type
    end_connection VARCHAR(100),       -- 'Threaded', 'Flanged', 'Welded', 'Socket', 'Grooved'
    thread_type VARCHAR(50),           -- 'NPT', 'BSP', 'BSPT'
    
    -- Additional properties
    is_seamless BOOLEAN DEFAULT false,
    is_galvanized BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE
);

-- ============================================================================
-- PUMP SPECIFICATIONS
-- ============================================================================

CREATE TABLE material_pump_specs (
    material_id VARCHAR(50) PRIMARY KEY,
    
    -- Pump classification
    pump_type VARCHAR(100),            -- 'Centrifugal', 'End Suction', 'Submersible', 'Booster', 'Circulator'
    pump_application VARCHAR(100),     -- 'Water Supply', 'Sewage', 'Fire Fighting', 'HVAC'
    
    -- Motor specifications
    motor_type VARCHAR(50),            -- 'Electric', 'Diesel', 'Pneumatic'
    motor_hp DECIMAL(10,2),
    motor_kw DECIMAL(10,2),
    motor_rpm INT,
    
    -- Electrical
    voltage VARCHAR(50),               -- '220V', '380V', '220/380V', '415V'
    phase VARCHAR(20),                 -- '1-phase', '3-phase'
    frequency VARCHAR(20),             -- '50Hz', '60Hz', '50/60Hz'
    rated_current_amp DECIMAL(10,2),
    power_factor DECIMAL(4,2),
    
    -- Performance
    head_pressure_m DECIMAL(10,2),     -- Maximum head in meters
    flow_rate_lpm DECIMAL(10,2),       -- Liters per minute
    flow_rate_m3h DECIMAL(10,2),       -- Cubic meters per hour
    max_flow_rate DECIMAL(10,2),
    min_flow_rate DECIMAL(10,2),
    
    -- Efficiency
    motor_efficiency_pct DECIMAL(5,2),
    pump_efficiency_pct DECIMAL(5,2),
    
    -- Connections
    suction_size VARCHAR(50),          -- '1-1/2"', '50mm'
    discharge_size VARCHAR(50),        -- '1"', '25mm'
    connection_type VARCHAR(50),       -- 'Flanged', 'Threaded', 'Victaulic'
    
    -- Materials of construction
    casing_material VARCHAR(100),      -- 'Cast Iron', 'Stainless Steel', 'Bronze'
    impeller_material VARCHAR(100),    -- 'Cast Iron', 'Stainless Steel', 'Bronze', 'Plastic'
    shaft_material VARCHAR(100),
    
    -- Sealing
    shaft_seal_type VARCHAR(100),      -- 'Mechanical Seal', 'Gland Packing', 'Cartridge Seal'
    seal_material VARCHAR(100),
    
    -- Operating limits
    max_liquid_temp_celsius DECIMAL(10,2),
    max_ambient_temp_celsius DECIMAL(10,2),
    max_suction_lift_m DECIMAL(10,2),
    
    -- Protection
    ip_rating VARCHAR(20),             -- 'IP54', 'IP55', 'IP68'
    insulation_class VARCHAR(20),      -- 'Class B', 'Class F', 'Class H'
    thermal_protection BOOLEAN,
    
    -- Standards
    standard_compliance VARCHAR(200),  -- 'ISO 9906', 'ASME B73.1', 'EN 733'
    certification VARCHAR(200),
    
    -- Installation
    installation_type VARCHAR(50),     -- 'Vertical', 'Horizontal', 'Inline', 'Submerged'
    mounting_type VARCHAR(50),         -- 'Floor', 'Base Plate', 'Rail'
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE
);

-- ============================================================================
-- ELECTRICAL EQUIPMENT SPECIFICATIONS
-- ============================================================================

CREATE TABLE material_electrical_specs (
    material_id VARCHAR(50) PRIMARY KEY,
    
    -- Equipment classification
    equipment_type VARCHAR(100),       -- 'Generator', 'Panel', 'Cable', 'Breaker', 'Transformer'
    equipment_application VARCHAR(100),
    
    -- Electrical ratings
    voltage VARCHAR(50),               -- '220V', '380V', '11kV', '22kV'
    voltage_type VARCHAR(20),          -- 'AC', 'DC'
    current_rating_amp DECIMAL(10,2),
    
    -- Power ratings
    power_kva DECIMAL(10,2),           -- Apparent power
    power_kw DECIMAL(10,2),            -- Real power
    power_factor DECIMAL(4,2),
    frequency_hz VARCHAR(20),          -- '50Hz', '60Hz'
    phase VARCHAR(20),                 -- '1-phase', '3-phase'
    
    -- For cables/wires
    conductor_material VARCHAR(50),    -- 'Copper', 'Aluminum'
    conductor_size_sqmm DECIMAL(10,2),
    number_of_cores INT,
    insulation_type VARCHAR(100),      -- 'PVC', 'XLPE', 'EPR', 'Rubber'
    sheath_material VARCHAR(100),
    armored BOOLEAN DEFAULT false,
    
    -- For breakers/protection devices
    breaking_capacity_ka DECIMAL(10,2),
    rated_short_circuit_current DECIMAL(10,2),
    trip_curve VARCHAR(20),            -- 'B', 'C', 'D'
    number_of_poles INT,
    
    -- For transformers
    transformer_type VARCHAR(50),      -- 'Step Up', 'Step Down', 'Isolation'
    primary_voltage VARCHAR(50),
    secondary_voltage VARCHAR(50),
    cooling_type VARCHAR(50),          -- 'ONAN', 'ONAF', 'Dry Type'
    
    -- For generators
    engine_type VARCHAR(50),           -- 'Diesel', 'Gas', 'Petrol'
    fuel_type VARCHAR(50),
    fuel_consumption_lph DECIMAL(10,2),
    fuel_tank_capacity_l DECIMAL(10,2),
    prime_power_kw DECIMAL(10,2),
    standby_power_kw DECIMAL(10,2),
    alternator_type VARCHAR(50),
    
    -- Protection & safety
    ip_rating VARCHAR(20),             -- 'IP20', 'IP54', 'IP65', 'IP68'
    ik_rating VARCHAR(20),             -- Impact protection
    arc_fault_protection BOOLEAN,
    ground_fault_protection BOOLEAN,
    overload_protection BOOLEAN,
    short_circuit_protection BOOLEAN,
    
    -- Standards & certification
    standard_compliance VARCHAR(200),  -- 'IEC 60947', 'BS 7671', 'NEC', 'IEEE'
    certification VARCHAR(200),        -- 'CE', 'UL', 'CSA', 'TIS'
    testing_certificates VARCHAR(200),
    
    -- Environmental
    operating_temp_min_celsius DECIMAL(10,2),
    operating_temp_max_celsius DECIMAL(10,2),
    storage_temp_min_celsius DECIMAL(10,2),
    storage_temp_max_celsius DECIMAL(10,2),
    humidity_rating VARCHAR(50),
    altitude_rating_m INT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE
);

-- ============================================================================
-- VALVES SPECIFICATIONS
-- ============================================================================

CREATE TABLE material_valve_specs (
    material_id VARCHAR(50) PRIMARY KEY,
    
    -- Valve type
    valve_type VARCHAR(100),           -- 'Gate', 'Globe', 'Ball', 'Butterfly', 'Check', 'Pressure Relief'
    valve_design VARCHAR(100),         -- 'Rising Stem', 'Non-Rising Stem', 'Quarter Turn'
    
    -- Size
    nominal_size VARCHAR(50),
    port_size VARCHAR(50),
    
    -- Connection
    end_connection VARCHAR(100),       -- 'Flanged', 'Threaded', 'Welded', 'Socket Weld'
    flange_standard VARCHAR(50),       -- 'ANSI 150', 'PN16', 'JIS 10K'
    
    -- Materials
    body_material VARCHAR(100),        -- 'Cast Iron', 'Ductile Iron', 'Carbon Steel', 'Stainless Steel', 'Bronze', 'Brass'
    disc_material VARCHAR(100),
    seat_material VARCHAR(100),
    stem_material VARCHAR(100),
    
    -- Pressure ratings
    pressure_class VARCHAR(50),        -- 'Class 150', 'Class 300', 'PN10', 'PN16', 'PN25'
    max_working_pressure_bar DECIMAL(10,2),
    
    -- Temperature ratings
    min_temp_celsius DECIMAL(10,2),
    max_temp_celsius DECIMAL(10,2),
    
    -- Operation
    operation_type VARCHAR(50),        -- 'Manual', 'Electric', 'Pneumatic', 'Hydraulic'
    actuator_type VARCHAR(50),
    
    -- Standards
    design_standard VARCHAR(100),      -- 'API 600', 'BS 5163', 'MSS SP-67'
    face_to_face VARCHAR(50),          -- 'ASME B16.10', 'DIN 3202'
    testing_standard VARCHAR(100),     -- 'API 598', 'BS EN 12266'
    
    -- Certifications
    certification VARCHAR(200),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE
);

-- ============================================================================
-- HVAC SPECIFICATIONS
-- ============================================================================

CREATE TABLE material_hvac_specs (
    material_id VARCHAR(50) PRIMARY KEY,
    
    -- Equipment type
    equipment_type VARCHAR(100),       -- 'Air Conditioner', 'Fan Coil Unit', 'AHU', 'Chiller', 'Cooling Tower'
    system_type VARCHAR(50),           -- 'Split', 'Multi-Split', 'VRF', 'Chilled Water'
    
    -- Capacity
    cooling_capacity_btu DECIMAL(10,2),
    cooling_capacity_kw DECIMAL(10,2),
    heating_capacity_btu DECIMAL(10,2),
    heating_capacity_kw DECIMAL(10,2),
    
    -- Air flow
    air_flow_cfm DECIMAL(10,2),        -- Cubic feet per minute
    air_flow_m3h DECIMAL(10,2),        -- Cubic meters per hour
    
    -- Electrical
    voltage VARCHAR(50),
    phase VARCHAR(20),
    frequency_hz VARCHAR(20),
    power_input_kw DECIMAL(10,2),
    current_amp DECIMAL(10,2),
    
    -- Efficiency
    eer DECIMAL(5,2),                  -- Energy Efficiency Ratio
    cop DECIMAL(5,2),                  -- Coefficient of Performance
    seer DECIMAL(5,2),                 -- Seasonal EER
    
    -- Refrigerant
    refrigerant_type VARCHAR(50),      -- 'R22', 'R410A', 'R32', 'R134a'
    refrigerant_charge_kg DECIMAL(10,3),
    
    -- Noise level
    indoor_noise_db DECIMAL(5,2),
    outdoor_noise_db DECIMAL(5,2),
    
    -- Standards
    standard_compliance VARCHAR(200),  -- 'AHRI', 'ISO 5151', 'EN 14511'
    certification VARCHAR(200),
    energy_rating VARCHAR(20),         -- '5 Star', 'A++', etc.
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE
);

-- ============================================================================
-- FLEXIBLE EXTENDED ATTRIBUTES (For miscellaneous items)
-- ============================================================================

CREATE TABLE material_extended_attributes (
    id SERIAL PRIMARY KEY,
    material_id VARCHAR(50) NOT NULL,
    
    attribute_name VARCHAR(100) NOT NULL,
    attribute_value TEXT,
    attribute_unit VARCHAR(50),
    data_type VARCHAR(20) DEFAULT 'text',  -- 'text', 'number', 'boolean', 'date'
    
    display_order INT DEFAULT 0,
    is_searchable BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE,
    
    UNIQUE(material_id, attribute_name)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_pipe_specs_material ON material_pipe_specs(material_id);
CREATE INDEX idx_pipe_specs_type ON material_pipe_specs(material_type);
CREATE INDEX idx_pipe_specs_schedule ON material_pipe_specs(schedule);

CREATE INDEX idx_pump_specs_material ON material_pump_specs(material_id);
CREATE INDEX idx_pump_specs_type ON material_pump_specs(pump_type);

CREATE INDEX idx_elec_specs_material ON material_electrical_specs(material_id);
CREATE INDEX idx_elec_specs_type ON material_electrical_specs(equipment_type);

CREATE INDEX idx_valve_specs_material ON material_valve_specs(material_id);
CREATE INDEX idx_valve_specs_type ON material_valve_specs(valve_type);

CREATE INDEX idx_hvac_specs_material ON material_hvac_specs(material_id);
CREATE INDEX idx_hvac_specs_type ON material_hvac_specs(equipment_type);

CREATE INDEX idx_ext_attr_material ON material_extended_attributes(material_id);
CREATE INDEX idx_ext_attr_name ON material_extended_attributes(attribute_name);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE material_pipe_specs IS 'Technical specifications for pipes, fittings, and accessories';
COMMENT ON TABLE material_pump_specs IS 'Technical specifications for pumps and related equipment';
COMMENT ON TABLE material_electrical_specs IS 'Technical specifications for electrical equipment';
COMMENT ON TABLE material_valve_specs IS 'Technical specifications for valves';
COMMENT ON TABLE material_hvac_specs IS 'Technical specifications for HVAC equipment';
COMMENT ON TABLE material_extended_attributes IS 'Flexible key-value attributes for materials without specific spec tables';
