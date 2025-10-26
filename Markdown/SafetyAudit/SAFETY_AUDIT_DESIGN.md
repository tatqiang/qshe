# 🔍 Safety Audit Module - Professional Design Document

> **Date**: October 16, 2025  
> **Module**: Safety Audit System with Multi-Revision Support  
> **Status**: Ready for Implementation

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Database Design](#database-design)
3. [Data Flow](#data-flow)
4. [UI/UX Design](#uiux-design)
5. [Implementation Guide](#implementation-guide)
6. [API Endpoints](#api-endpoints)
7. [TypeScript Interfaces](#typescript-interfaces)
8. [Sample Data](#sample-data)

---

## 🎯 Overview

### **Business Requirements**

The Safety Audit module allows:
- ✅ Multiple audit categories (A-G: Worker Readiness, Tools & Equipment, Hot Work, etc.)
- ✅ Revision control for audit requirements (each category can have multiple versions)
- ✅ Score each requirement: 0-3 or N/A
- ✅ Weighted scoring system
- ✅ Comments per requirement
- ✅ Photo evidence per audit category
- ✅ Comprehensive reporting and historical tracking

### **Key Features**

```
┌─────────────────────────────────────────────────────────────┐
│  SAFETY AUDIT SYSTEM                                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ✅ Multi-Category Support (A, B, C, D, E, F, G)           │
│  ✅ Revision Control (v0, v1, v2...)                       │
│  ✅ Weighted Scoring (weights 1-5)                         │
│  ✅ Flexible Scoring (0, 1, 2, 3, N/A)                     │
│  ✅ Auto-Calculate Average Scores                          │
│  ✅ Photo Evidence Storage                                 │
│  ✅ Historical Audit Reports                               │
│  ✅ Mobile-Friendly Form                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Design

### **Professional Schema Highlights**

**Recommended Approach**: **Normalized Data Structure**

```
safety_audit_categories (Master Data)
    ├── id: 'sfs21sw', 'e2r532d', etc.
    ├── category_code: 'A', 'B', 'C'
    └── category_name: 'Worker Readiness', 'Tools & Equipment'

safety_audit_requirements (Master Data with Revisions)
    ├── id: UUID
    ├── category_id: FK to categories
    ├── revision: 0, 1, 2... (version number)
    ├── item_number: 1, 2, 3... (sequence)
    ├── item_name: 'บัตรอนุญาตทำงาน'
    ├── description: 'ติดบัตรอนุญาตถูกต้อง'
    ├── weight: 1-5
    └── is_active: true/false

safety_audits (Transaction Data)
    ├── id: UUID
    ├── audit_number: 'AUD-2025-0001' (auto-generated)
    ├── project_id, area_ids, company_id
    ├── category_id: 'e2r532d'
    ├── audit_criteria_revision: JSONB {"category_id":"e2r532d","revision":1}
    ├── total_score: 45.00
    ├── max_possible_score: 60.00
    ├── average_score: 75.00 (percentage)
    ├── auditor_id, audit_date
    └── status: 'draft', 'completed', 'reviewed'

safety_audit_results (Detailed Scoring) ← RECOMMENDED
    ├── id: UUID
    ├── audit_id: FK to safety_audits
    ├── requirement_id: FK to safety_audit_requirements
    ├── score: 0, 1, 2, 3, or -1 (N/A)
    ├── is_na: boolean
    ├── weight: integer (copied from requirement)
    ├── weighted_score: score × weight (NULL if N/A)
    └── comment: TEXT

safety_audit_photos
    ├── id: UUID
    ├── audit_id: FK to safety_audits
    ├── photo_url, photo_key
    ├── requirement_id: (optional link to specific requirement)
    └── photo_caption
```

---

### **Why Normalized Structure is Better**

```
┌──────────────────────────┬──────────────────────────┬──────────────────────────┐
│ Aspect                   │ NORMALIZED (Recommended) │ JSON Approach            │
├──────────────────────────┼──────────────────────────┼──────────────────────────┤
│ Data Integrity           │ ✅ Strong (FK constraints)│ ⚠️  Weak (no validation) │
│ Querying Performance     │ ✅ Fast (indexed)         │ ⚠️  Slow (JSON parsing)  │
│ Reporting                │ ✅ Easy (JOIN queries)    │ ⚠️  Complex (JSON funcs) │
│ Historical Tracking      │ ✅ Perfect (audit trail)  │ ⚠️  Difficult            │
│ Data Updates             │ ✅ Easy (UPDATE one row)  │ ⚠️  Must update JSON     │
│ Storage Size             │ ✅ Efficient              │ ⚠️  Larger (duplicates)  │
│ Type Safety              │ ✅ Database enforced      │ ❌ Application only      │
│ Analytics                │ ✅ SQL aggregate funcs    │ ⚠️  JSON extraction      │
└──────────────────────────┴──────────────────────────┴──────────────────────────┘

Winner: NORMALIZED STRUCTURE (safety_audit_results table)
```

---

## 🔄 Data Flow

### **Complete Audit Process**

```
┌─────────────────────────────────────────────────────────────────────┐
│  PHASE 1: INITIATE AUDIT                                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. User selects "New Safety Audit"                                │
│  2. Fill general info:                                             │
│     • Project                                                      │
│     • Location (main_area, sub_area1, sub_area2)                  │
│     • Specific location                                            │
│     • Company (if applicable)                                      │
│     • Audit date                                                   │
│  3. Select audit category (A-G tabs)                               │
│                                                                     │
│  → Creates draft record in safety_audits table                     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  PHASE 2: LOAD REQUIREMENTS                                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. Query latest revision for selected category:                   │
│                                                                     │
│     SELECT req.*                                                    │
│     FROM safety_audit_requirements req                             │
│     WHERE req.category_id = 'e2r532d'                              │
│       AND req.revision = get_latest_revision('e2r532d')            │
│       AND req.is_active = TRUE                                     │
│     ORDER BY req.item_number;                                      │
│                                                                     │
│  2. Display requirements in UI:                                    │
│     • Item number                                                  │
│     • Item name (Thai)                                             │
│     • Description/Criteria                                         │
│     • Weight                                                       │
│     • Score dropdown (0, 1, 2, 3, N/A)                            │
│     • Comment textbox                                              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  PHASE 3: SCORING                                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  For each requirement:                                              │
│                                                                     │
│  1. User selects score:                                            │
│     • 3 = Compliant (ปฏิบัติครบถ้วน)                               │
│     • 2 = Partial (ปฏิบัติได้บางส่วน / หลักฐานไม่ครบ)             │
│     • 1 = Partial (ปฏิบัติได้เป็นส่วนน้อย / พบหลักฐานบางส่วน)     │
│     • 0 = Non-Compliant (ไม่ปฏิบัติ / ไม่มีหลักฐาน)                 │
│     • N/A = Not Applicable (ไม่เกี่ยวข้อง)                         │
│                                                                     │
│  2. User adds comment (optional)                                   │
│                                                                     │
│  3. Save to safety_audit_results:                                  │
│     INSERT INTO safety_audit_results (                             │
│       audit_id,                                                    │
│       requirement_id,                                              │
│       score,                                                       │
│       is_na,                                                       │
│       weight,                                                      │
│       comment                                                      │
│     ) VALUES (...)                                                 │
│                                                                     │
│  4. Trigger auto-calculates:                                       │
│     • weighted_score = score × weight (NULL if N/A)               │
│     • Updates audit total_score, average_score                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  PHASE 4: PHOTOS                                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. User uploads photos for audit                                  │
│  2. Photos stored in Cloudflare R2 / Azure Blob Storage            │
│  3. Photo metadata saved to safety_audit_photos:                   │
│     • audit_id (required)                                          │
│     • photo_url (storage URL)                                      │
│     • requirement_id (optional - link to specific requirement)     │
│     • caption                                                      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  PHASE 5: SUBMIT & REVIEW                                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. User clicks "Submit Audit"                                     │
│  2. Status changes: 'draft' → 'completed'                          │
│  3. System calculates final scores:                                │
│                                                                     │
│     Total Score = Σ (score × weight) for non-N/A items            │
│     Max Score = Σ (3 × weight) for non-N/A items                  │
│     Average = (Total / Max) × 100%                                 │
│                                                                     │
│  4. Reviewer (supervisor) can:                                     │
│     • View audit details                                           │
│     • Review scores and comments                                   │
│     • Approve/reject                                               │
│     • Add recommendations                                          │
│                                                                     │
│  5. Status changes: 'completed' → 'reviewed' → 'closed'            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🎨 UI/UX Design

### **Audit Form Layout** (Based on your AuditForm_ui.png)

```
┌─────────────────────────────────────────────────────────────────────┐
│  HEADER AREA                                                         │
│  🏢 QSHE - Safety Audit                             [Back] [Save]   │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  GENERAL INFORMATION AREA                                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Project: [Dropdown: Select Project ▼]                             │
│  Main Area: [Dropdown: Building A ▼]                               │
│  Sub Area 1: [Dropdown: Floor 3 ▼]                                 │
│  Sub Area 2: [Dropdown: Office Area ▼]                             │
│  Specific Location: [Input: Near main entrance ______]             │
│  Company: [Dropdown: ABC Contractor ▼]                             │
│  Audit Date: [Date Picker: 2025-10-16 📅]                          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  CATEGORY SELECTION TABS                                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  [A] [B] [C] [D] [E] [F] [G]                                       │
│  ▲                                                                  │
│  └─ Selected                                                        │
│                                                                     │
│  Category A: ความพร้อมของผู้ปฏิบัติงาน (Worker Readiness)           │
│  Using Revision: 0 (Latest)                                        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  AUDIT RECORD AREA                                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌───┬──────────────────────────┬──────────┬────────┬──────────┐   │
│  │No.│ Item & Criteria          │ Weight   │ Score  │ Comment  │   │
│  ├───┼──────────────────────────┼──────────┼────────┼──────────┤   │
│  │ 1 │ บัตรอนุญาตทำงาน          │   1      │ [  ▼] │ [______] │   │
│  │   │ ติดบัตรอนุญาตถูกต้อง     │          │        │          │   │
│  ├───┼──────────────────────────┼──────────┼────────┼──────────┤   │
│  │ 2 │ หมวกนิรภัย พร้อมสายรัดคาง │   2      │ [  ▼] │ [______] │   │
│  │   │ สวมหมวกนิรภัย พร้อม...   │          │        │          │   │
│  ├───┼──────────────────────────┼──────────┼────────┼──────────┤   │
│  │ 3 │ รองเท้านิรภัย             │   2      │ [  ▼] │ [______] │   │
│  │   │ สวมรองเท้านิรภัยที่ได้... │          │        │          │   │
│  ├───┼──────────────────────────┼──────────┼────────┼──────────┤   │
│  │ 4 │ ความเหมาะสมของ PPE อื่นๆ  │   3      │ [  ▼] │ [______] │   │
│  │   │ ตรวจสอบ PPE Matrix...     │          │        │          │   │
│  └───┴──────────────────────────┴──────────┴────────┴──────────┘   │
│                                                                     │
│  Score Dropdown Options:                                            │
│  • 3 - Compliant (ปฏิบัติครบถ้วน)                                  │
│  • 2 - Partial (ปฏิบัติได้บางส่วน / หลักฐานไม่ครบ)                │
│  • 1 - Partial (ปฏิบัติได้เป็นส่วนน้อย / พบหลักฐานบางส่วน)         │
│  • 0 - Non-Compliant (ไม่ปฏิบัติ / ไม่มีหลักฐาน)                    │
│  • N/A - Not Applicable (ไม่เกี่ยวข้อง)                            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  SCORE SUMMARY                                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Total Score: 18 / 24 (75.0%)                                      │
│  Items Scored: 4 | N/A: 0                                          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  PHOTOS SECTION                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  [📷 Add Photos]                                                    │
│                                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                         │
│  │ Photo 1  │  │ Photo 2  │  │ Photo 3  │                         │
│  │  [X]     │  │  [X]     │  │  [X]     │                         │
│  └──────────┘  └──────────┘  └──────────┘                         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  ACTIONS                                                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  [Save Draft]  [Submit for Review]  [Cancel]                       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 💻 Implementation Guide

### **Step 1: Run Database Schema**

```bash
# In Supabase SQL Editor:
1. Open docs/SafetyAudit/SAFETY_AUDIT_DATABASE_SCHEMA.sql
2. Copy all content
3. Paste in Supabase SQL Editor
4. Click "Run"
5. Verify tables created:
   • safety_audit_categories
   • safety_audit_requirements
   • safety_audits
   • safety_audit_results
   • safety_audit_photos
```

### **Step 2: Create TypeScript Interfaces**

```typescript
// src/types/safetyAudit.ts

export interface SafetyAuditCategory {
  id: string; // 'sfs21sw', 'e2r532d', etc.
  category_code: string; // 'A', 'B', 'C', etc.
  category_name_en: string;
  category_name_th: string;
  description?: string;
  display_order: number;
  is_active: boolean;
}

export interface SafetyAuditRequirement {
  id: string;
  category_id: string;
  revision: number;
  item_number: number;
  item_name: string; // Thai name
  description: string; // Criteria
  criteria?: string;
  weight: number; // 1-5
  is_active: boolean;
  effective_date: string;
  superseded_date?: string;
}

export interface SafetyAudit {
  id: string;
  audit_number: string; // 'AUD-2025-0001'
  
  // General Info
  project_id?: string;
  main_area_id?: string;
  sub_area1_id?: string;
  sub_area2_id?: string;
  specific_location?: string;
  company_id?: string;
  
  // Audit Details
  audit_date: string;
  audit_time: string;
  category_id: string;
  audit_criteria_revision: {
    category_id: string;
    revision: number;
  };
  
  // Scoring
  status: 'draft' | 'in_progress' | 'completed' | 'reviewed' | 'closed';
  total_score?: number;
  max_possible_score?: number;
  average_score?: number;
  
  // Auditor
  auditor_id: string;
  auditor_name: string;
  reviewed_by?: string;
  reviewed_at?: string;
  
  // Notes
  audit_note?: string;
  recommendations?: string;
  
  // Metadata
  created_at: string;
  updated_at: string;
}

export interface SafetyAuditResult {
  id: string;
  audit_id: string;
  requirement_id: string;
  score: number; // 0, 1, 2, 3, or -1 for N/A
  is_na: boolean;
  weight: number;
  weighted_score?: number; // score × weight (NULL if N/A)
  comment?: string;
  created_at: string;
  updated_at: string;
}

export interface SafetyAuditPhoto {
  id: string;
  audit_id: string;
  photo_url: string;
  photo_key: string;
  photo_caption?: string;
  photo_type?: 'evidence' | 'violation' | 'corrective_action';
  requirement_id?: string; // Optional link to specific requirement
  file_size?: number;
  mime_type?: string;
  uploaded_at: string;
  uploaded_by?: string;
}

export interface SafetyAuditFormData {
  // General Info
  project_id?: string;
  main_area_id?: string;
  sub_area1_id?: string;
  sub_area2_id?: string;
  specific_location?: string;
  company_id?: string;
  audit_date: string;
  
  // Category
  category_id: string;
  
  // Results (array of scores)
  results: {
    requirement_id: string;
    score: number;
    is_na: boolean;
    comment?: string;
  }[];
  
  // Photos
  photos: File[];
  
  // Notes
  audit_note?: string;
}
```

### **Step 3: Create Service Layer**

```typescript
// src/services/SafetyAuditService.ts

import { supabase } from '../lib/api/supabase';
import type { SafetyAudit, SafetyAuditFormData, SafetyAuditRequirement } from '../types/safetyAudit';

export class SafetyAuditService {
  
  /**
   * Get all audit categories
   */
  static async getCategories() {
    const { data, error } = await supabase
      .from('safety_audit_categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order');
    
    if (error) throw error;
    return data;
  }
  
  /**
   * Get latest requirements for a category
   */
  static async getLatestRequirements(categoryId: string) {
    // First, get the latest revision
    const { data: revisionData } = await supabase
      .rpc('get_latest_revision', { p_category_id: categoryId });
    
    const latestRevision = revisionData || 0;
    
    // Then get all requirements for that revision
    const { data, error } = await supabase
      .from('safety_audit_requirements')
      .select('*')
      .eq('category_id', categoryId)
      .eq('revision', latestRevision)
      .eq('is_active', true)
      .order('item_number');
    
    if (error) throw error;
    return { requirements: data, revision: latestRevision };
  }
  
  /**
   * Create new audit
   */
  static async createAudit(formData: SafetyAuditFormData, userId: string, userName: string) {
    // 1. Create audit record
    const { data: audit, error: auditError } = await supabase
      .from('safety_audits')
      .insert({
        project_id: formData.project_id,
        main_area_id: formData.main_area_id,
        sub_area1_id: formData.sub_area1_id,
        sub_area2_id: formData.sub_area2_id,
        specific_location: formData.specific_location,
        company_id: formData.company_id,
        audit_date: formData.audit_date,
        audit_time: new Date().toTimeString().split(' ')[0],
        category_id: formData.category_id,
        audit_criteria_revision: {
          category_id: formData.category_id,
          revision: 0 // Will be updated by frontend
        },
        auditor_id: userId,
        auditor_name: userName,
        status: 'draft',
        audit_note: formData.audit_note
      })
      .select()
      .single();
    
    if (auditError) throw auditError;
    
    // 2. Insert all results
    const resultsToInsert = formData.results.map(result => ({
      audit_id: audit.id,
      requirement_id: result.requirement_id,
      score: result.is_na ? -1 : result.score,
      is_na: result.is_na,
      weight: 0, // Will be filled by trigger
      comment: result.comment
    }));
    
    const { error: resultsError } = await supabase
      .from('safety_audit_results')
      .insert(resultsToInsert);
    
    if (resultsError) throw resultsError;
    
    // 3. Upload photos (if any)
    if (formData.photos && formData.photos.length > 0) {
      await this.uploadPhotos(audit.id, formData.photos);
    }
    
    return audit;
  }
  
  /**
   * Get audit by ID with all details
   */
  static async getAuditById(auditId: string) {
    const { data: audit, error: auditError } = await supabase
      .from('safety_audits')
      .select(`
        *,
        category:safety_audit_categories(*),
        project:projects(*),
        auditor:users(id, full_name, email)
      `)
      .eq('id', auditId)
      .single();
    
    if (auditError) throw auditError;
    
    // Get results
    const { data: results, error: resultsError } = await supabase
      .from('safety_audit_results')
      .select(`
        *,
        requirement:safety_audit_requirements(*)
      `)
      .eq('audit_id', auditId)
      .order('requirement(item_number)');
    
    if (resultsError) throw resultsError;
    
    // Get photos
    const { data: photos, error: photosError } = await supabase
      .from('safety_audit_photos')
      .select('*')
      .eq('audit_id', auditId);
    
    if (photosError) throw photosError;
    
    return {
      audit,
      results,
      photos
    };
  }
  
  /**
   * Upload photos for an audit
   */
  static async uploadPhotos(auditId: string, photos: File[]) {
    // Implementation depends on your storage solution
    // (Cloudflare R2 or Azure Blob Storage)
    // Similar to patrol photo upload
  }
  
  /**
   * Submit audit for review
   */
  static async submitAudit(auditId: string) {
    const { data, error } = await supabase
      .from('safety_audits')
      .update({ status: 'completed' })
      .eq('id', auditId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
}
```

### **Step 4: Create React Component**

```tsx
// src/components/SafetyAudit/SafetyAuditForm.tsx

import React, { useState, useEffect } from 'react';
import { SafetyAuditService } from '../../services/SafetyAuditService';
import type { SafetyAuditCategory, SafetyAuditRequirement } from '../../types/safetyAudit';

export const SafetyAuditForm: React.FC = () => {
  const [categories, setCategories] = useState<SafetyAuditCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [requirements, setRequirements] = useState<SafetyAuditRequirement[]>([]);
  const [scores, setScores] = useState<Record<string, { score: number; is_na: boolean; comment: string }>>({});
  
  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, []);
  
  const loadCategories = async () => {
    const data = await SafetyAuditService.getCategories();
    setCategories(data);
  };
  
  // Load requirements when category changes
  useEffect(() => {
    if (selectedCategory) {
      loadRequirements();
    }
  }, [selectedCategory]);
  
  const loadRequirements = async () => {
    const { requirements } = await SafetyAuditService.getLatestRequirements(selectedCategory);
    setRequirements(requirements);
    
    // Initialize scores
    const initialScores: Record<string, any> = {};
    requirements.forEach(req => {
      initialScores[req.id] = { score: -1, is_na: false, comment: '' };
    });
    setScores(initialScores);
  };
  
  const handleScoreChange = (requirementId: string, score: number) => {
    setScores(prev => ({
      ...prev,
      [requirementId]: {
        ...prev[requirementId],
        score: score,
        is_na: score === -1
      }
    }));
  };
  
  const calculateTotalScore = () => {
    let total = 0;
    let maxPossible = 0;
    
    requirements.forEach(req => {
      const result = scores[req.id];
      if (result && !result.is_na) {
        total += result.score * req.weight;
        maxPossible += 3 * req.weight;
      }
    });
    
    const percentage = maxPossible > 0 ? (total / maxPossible) * 100 : 0;
    return { total, maxPossible, percentage: percentage.toFixed(1) };
  };
  
  const handleSubmit = async () => {
    // Implementation
  };
  
  return (
    <div className="safety-audit-form">
      {/* Category Tabs */}
      <div className="category-tabs">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={selectedCategory === cat.id ? 'active' : ''}
          >
            {cat.category_code}
          </button>
        ))}
      </div>
      
      {/* Category Info */}
      {selectedCategory && (
        <div className="category-info">
          <h3>
            Category {categories.find(c => c.id === selectedCategory)?.category_code}:
            {' '}
            {categories.find(c => c.id === selectedCategory)?.category_name_th}
          </h3>
        </div>
      )}
      
      {/* Requirements Table */}
      <table className="audit-table">
        <thead>
          <tr>
            <th>No.</th>
            <th>Item & Criteria</th>
            <th>Weight</th>
            <th>Score</th>
            <th>Comment</th>
          </tr>
        </thead>
        <tbody>
          {requirements.map(req => (
            <tr key={req.id}>
              <td>{req.item_number}</td>
              <td>
                <div className="item-name">{req.item_name}</div>
                <div className="item-desc">{req.description}</div>
              </td>
              <td>{req.weight}</td>
              <td>
                <select
                  value={scores[req.id]?.score || -1}
                  onChange={(e) => handleScoreChange(req.id, parseInt(e.target.value))}
                >
                  <option value={-1}>Select...</option>
                  <option value={3}>3 - Compliant (ปฏิบัติครบถ้วน)</option>
                  <option value={2}>2 - Partial (บางส่วน)</option>
                  <option value={1}>1 - Partial (ส่วนน้อย)</option>
                  <option value={0}>0 - Non-Compliant (ไม่ปฏิบัติ)</option>
                  <option value={-1}>N/A (ไม่เกี่ยวข้อง)</option>
                </select>
              </td>
              <td>
                <input
                  type="text"
                  value={scores[req.id]?.comment || ''}
                  onChange={(e) => setScores(prev => ({
                    ...prev,
                    [req.id]: { ...prev[req.id], comment: e.target.value }
                  }))}
                  placeholder="Comment..."
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* Score Summary */}
      <div className="score-summary">
        <h4>Score Summary</h4>
        <p>
          Total Score: {calculateTotalScore().total} / {calculateTotalScore().maxPossible}
          {' '}
          ({calculateTotalScore().percentage}%)
        </p>
      </div>
      
      {/* Actions */}
      <div className="actions">
        <button onClick={handleSubmit}>Submit Audit</button>
      </div>
    </div>
  );
};
```

---

## 🎓 Key Design Decisions Explained

### **1. Why Separate `safety_audit_results` Table?**

✅ **Better Data Integrity**: Foreign key constraints ensure valid requirement IDs  
✅ **Easy Reporting**: Simple JOIN queries for analytics  
✅ **Historical Accuracy**: Each result row is immutable  
✅ **Type Safety**: Database enforces score values (0-3)  
✅ **Performance**: Indexed queries are fast  

### **2. Why Store Revision in JSONB?**

```json
{
  "category_id": "e2r532d",
  "revision": 1
}
```

✅ **Historical Record**: Know exactly which version was used  
✅ **Flexible**: Can add more metadata later  
✅ **Queryable**: PostgreSQL JSON functions allow filtering  

### **3. Why Auto-Calculate Scores with Triggers?**

✅ **Data Consistency**: Always accurate, never out of sync  
✅ **Simplifies Frontend**: No manual calculation needed  
✅ **Audit Trail**: Updates logged in database  
✅ **Real-Time**: Scores update immediately  

---

## 📊 Sample Queries

### **Get All Audits for a Project**

```sql
SELECT 
    a.audit_number,
    a.audit_date,
    c.category_name_th,
    a.average_score,
    a.status,
    u.full_name AS auditor
FROM safety_audits a
JOIN safety_audit_categories c ON a.category_id = c.id
JOIN users u ON a.auditor_id = u.id
WHERE a.project_id = 'project-uuid-here'
ORDER BY a.audit_date DESC;
```

### **Get Audit Details with Scores**

```sql
SELECT 
    req.item_number,
    req.item_name,
    req.weight,
    ar.score,
    ar.is_na,
    ar.weighted_score,
    ar.comment
FROM safety_audit_results ar
JOIN safety_audit_requirements req ON ar.requirement_id = req.id
WHERE ar.audit_id = 'audit-uuid-here'
ORDER BY req.item_number;
```

### **Category Performance Report**

```sql
SELECT 
    c.category_name_th,
    COUNT(a.id) AS total_audits,
    AVG(a.average_score) AS avg_score,
    MIN(a.average_score) AS lowest_score,
    MAX(a.average_score) AS highest_score
FROM safety_audits a
JOIN safety_audit_categories c ON a.category_id = c.id
WHERE a.status = 'completed'
  AND a.audit_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY c.id, c.category_name_th
ORDER BY avg_score DESC;
```

---

## ✅ Next Steps

1. **Run Database Schema** - Execute `SAFETY_AUDIT_DATABASE_SCHEMA.sql` in Supabase
2. **Create TypeScript Types** - Add interfaces to `src/types/safetyAudit.ts`
3. **Build Service Layer** - Implement `SafetyAuditService.ts`
4. **Create UI Components** - Build audit form, list, and detail views
5. **Test with Sample Data** - Create test audits for each category
6. **Deploy** - Release to production

---

**Document Status**: ✅ Complete Professional Design  
**Ready for Implementation**: YES  
**Estimated Timeline**: 2-3 weeks  
**Complexity**: Medium  
**Dependencies**: Existing project/area/company tables  
