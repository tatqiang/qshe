
src/components/materials/config/DimensionsManager.vue:380:25 - error TS6133: 'watch' is declared but its value is never read.

380 import { ref, computed, watch, onMounted } from 'vue'
                            ~~~~~

src/components/materials/config/DimensionsManager.vue:470:27 - error TS2345: Argument of type '{ dimension_group_id: number | null; size_1: string; size_2: string; size_3: string; dimension_type: "common" | "custom"; display_order: number; is_active: boolean; }' is not assignable to parameter of type 'Omit<Dimension, "id" | "created_at" | "updated_at">'.
  Types of property 'dimension_group_id' are incompatible.
    Type 'number | null' is not assignable to type 'number'.
      Type 'null' is not assignable to type 'number'.

470     await createDimension(newDimension.value)
                              ~~~~~~~~~~~~~~~~~~

src/components/materials/config/DimensionsManager.vue:491:7 - error TS6133: 'handleDelete' is declared but its value is never read.

491 const handleDelete = async (id: number) => {
          ~~~~~~~~~~~~

src/components/materials/config/DimensionsManager.vue:592:39 - error TS2538: Type 'undefined' cannot be used as an index type.

592     const worksheet = workbook.Sheets[workbook.SheetNames[0]]
                                          ~~~~~~~~~~~~~~~~~~~~~~

src/components/materials/config/MaterialTemplatesManager.vue:1010:7 - error TS6133: 'addNewTemplate' is declared but its value is never read.

1010 const addNewTemplate = () => {
           ~~~~~~~~~~~~~~

src/components/materials/config/MaterialTemplatesManager.vue:1022:34 - error TS2345: Argument of type '{ material_group_id: number | null; title_1: string; title_2: string; title_3: string; title_4: string; title_5: string; title_1_th: string; title_2_th: string; title_3_th: string; title_4_th: string; title_5_th: string; dimension_group_id: number | null; sort_order: number; is_active: boolean; }' is not assignable to parameter of type 'Omit<MaterialTemplate, "id" | "created_at" | "updated_at">'.
  Types of property 'material_group_id' are incompatible.
    Type 'number | null' is not assignable to type 'number'.
      Type 'null' is not assignable to type 'number'.

1022     await createMaterialTemplate(newTemplate.value)
                                      ~~~~~~~~~~~~~~~~~

src/components/materials/config/MaterialTemplatesManager.vue:1061:7 - error TS6133: 'addNewRow' is declared but its value is never read.

1061 const addNewRow = async () => {
           ~~~~~~~~~

src/components/materials/config/MaterialTemplatesManager.vue:1089:7 - error TS6133: 'duplicateRow' is declared but its value is never read.

1089 const duplicateRow = async (template: MaterialTemplate) => {
           ~~~~~~~~~~~~

src/components/materials/config/MaterialTemplatesManager.vue:1213:39 - error TS2538: Type 'undefined' cannot be used as an index type.

1213     const worksheet = workbook.Sheets[workbook.SheetNames[0]]
                                           ~~~~~~~~~~~~~~~~~~~~~~

src/components/materials/config/MaterialTemplatesManager.vue:1449:7 - error TS6133: 'deleteRowInSpreadsheet' is declared but its value is never read.

1449 const deleteRowInSpreadsheet = (index: number) => {
           ~~~~~~~~~~~~~~~~~~~~~~

src/components/materials/config/MaterialTemplatesManager.vue:1540:7 - error TS6133: 'showSpreadsheetModalHandler' is declared but its value is never read.

1540 const showSpreadsheetModalHandler = () => {
           ~~~~~~~~~~~~~~~~~~~~~~~~~~~

src/components/materials/receive/AreaInputModal.vue:93:7 - error TS6133: 'props' is declared but its value is never read. 

93 const props = defineProps<{
         ~~~~~

src/components/materials/receive/MaterialInventorySelector.vue:383:5 - error TS2322: Type '{ id: any; material_template_id: any; material_description: any; material_description_th: any; current_quantity: any; unit_of_measure: any; specific_detail: any; dimension_id: any; material_codes: { ...; }[]; brands: { ...; }[]; material_templates: { ...; }[]; dimensions: { ...; }[]; }[]' is not assignable to type 'MaterialInventory[] | { id: string; material_template_id: number; material_description: string; material_description_th?: string | undefined; current_quantity: number; ... 6 more ...; dimensions?: { ...; } | undefined; }[]'.
  Type '{ id: any; material_template_id: any; material_description: any; material_description_th: any; current_quantity: any; unit_of_measure: any; specific_detail: any; dimension_id: any; material_codes: { ...; }[]; brands: { ...; }[]; material_templates: { ...; }[]; dimensions: { ...; }[]; }[]' is not assignable to type 'MaterialInventory[]'.
    Type '{ id: any; material_template_id: any; material_description: any; material_description_th: any; current_quantity: any; unit_of_measure: any; specific_detail: any; dimension_id: any; material_codes: { ...; }[]; brands: { ...; }[]; material_templates: { ...; }[]; dimensions: { ...; }[]; }' is not assignable to type 'MaterialInventory'.
      Types of property 'material_codes' are incompatible.
        Type '{ id: any; material_code: any; }[]' is missing the following properties from type '{ id: string; material_code: string; }': id, material_code

383     inventory.value = data || []
        ~~~~~~~~~~~~~~~

src/components/materials/receive/MaterialInventorySelector.vue:401:10 - error TS6133: 'toggleDimensionDropdown' is declared but its value is never read.

401 function toggleDimensionDropdown() {
             ~~~~~~~~~~~~~~~~~~~~~~~

src/components/materials/receive/MaterialInventorySelector.vue:421:21 - error TS2345: Argument of type 'MaterialInventory | undefined' is not assignable to parameter of type 'MaterialInventory'.
  Type 'undefined' is not assignable to type 'MaterialInventory'.

421     selectDimension(material.variants[0])
                        ~~~~~~~~~~~~~~~~~~~~

src/components/materials/receive/MaterialInventorySelector.vue:432:3 - error TS2769: No overload matches this call.       
  Overload 1 of 2, '(e: "update:modelValue", value: string): void', gave the following error.
    Argument of type 'null' is not assignable to parameter of type 'string'.
  Overload 2 of 2, '(e: "select", inventory: MaterialInventory): void', gave the following error.
    Argument of type '"update:modelValue"' is not assignable to parameter of type '"select"'.

432   emit('update:modelValue', null)
      ~~~~


src/components/materials/receive/MaterialInventorySelector.vue:447:3 - error TS2769: No overload matches this call.       
  Overload 1 of 2, '(e: "update:modelValue", value: string): void', gave the following error.
    Argument of type 'null' is not assignable to parameter of type 'string'.
  Overload 2 of 2, '(e: "select", inventory: MaterialInventory): void', gave the following error.
    Argument of type '"update:modelValue"' is not assignable to parameter of type '"select"'.

447   emit('update:modelValue', null)
      ~~~~


src/components/materials/receive/MaterialReceiveItemsTable.vue:666:3 - error TS2322: Type '{ material_template_id: number; material_code: string; brand: string; material_description: string; material_description_th: string; material_inventory_id: null; dimension_id: null; specific_detail: string; ... 4 more ...; remark?: string | undefined; }' is not assignable to type 'ReceiveItem'.
  Types of property 'prepared_quantity' are incompatible.
    Type 'number | undefined' is not assignable to type 'number'.
      Type 'undefined' is not assignable to type 'number'.

666   newItems[index] = {
      ~~~~~~~~~~~~~~~

src/components/materials/receive/MaterialReceiveItemsTable.vue:695:3 - error TS2322: Type '{ material_inventory_id: string; dimension_id: number; specific_detail: string; current_quantity: number; unit_of_measure: string; line_number?: number; material_template_id?: number | null | undefined; ... 5 more ...; remark?: string | undefined; }' is not assignable to type 'ReceiveItem'.
  Types of property 'material_template_id' are incompatible.
    Type 'number | null | undefined' is not assignable to type 'number | null'.
      Type 'undefined' is not assignable to type 'number | null'.

695   newItems[index] = {
      ~~~~~~~~~~~~~~~

src/components/materials/receive/MaterialSelectorModal.vue:148:47 - error TS2339: Property 'material_code' does not exist on type '{ material_code: any; }[]'.

148           material_code: item.material_codes?.material_code || '',
                                                  ~~~~~~~~~~~~~

src/components/materials/receive/MaterialSelectorModal.vue:149:31 - error TS2339: Property 'brand_title' does not exist on type '{ brand_title: any; }[]'.

149           brand: item.brands?.brand_title || '',
                                  ~~~~~~~~~~~

src/components/materials/receive/MaterialTemplateSelector.vue:265:20 - error TS2345: Argument of type '{ id: number; material_group_id: number; title_1?: string | null | undefined; title_2?: string | null | undefined; title_3?: string | null | undefined; title_4?: string | null | undefined; ... 13 more ...; dimension_group?: { ...; } | undefined; } | undefined' is not assignable to parameter of type 'MaterialTemplate'.
  Type 'undefined' is not assignable to type 'MaterialTemplate'.

265     selectTemplate(filteredTemplates.value[highlightedIndex.value])
                       ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

src/components/materials/receive/Step1Prepare.vue:316:10 - error TS6133: 'addLineItem' is declared but its value is never read.

316 function addLineItem() {
             ~~~~~~~~~~~

src/components/materials/receive/Step1Prepare.vue:324:10 - error TS6133: 'removeLineItem' is declared but its value is never read.

324 function removeLineItem(index: number) {
             ~~~~~~~~~~~~~~

src/components/materials/receive/Step1Prepare.vue:334:10 - error TS6133: 'handleInventorySelect' is declared but its value is never read.

334 function handleInventorySelect(index: number, inventoryRecord: any) {
             ~~~~~~~~~~~~~~~~~~~~~

src/services/materialService.ts:15:3 - error TS6196: 'MaterialReceiveItem' is declared but never used.

15   MaterialReceiveItem,
     ~~~~~~~~~~~~~~~~~~~

src/services/materialService.ts:17:3 - error TS6196: 'MaterialReceiveArea' is declared but never used.

17   MaterialReceiveArea,
     ~~~~~~~~~~~~~~~~~~~

src/services/materialService.ts:25:3 - error TS6196: 'PhotoAttachment' is declared but never used.

25   PhotoAttachment,
     ~~~~~~~~~~~~~~~

src/services/materialService.ts:27:3 - error TS6196: 'DocumentAttachment' is declared but never used.

27   DocumentAttachment
     ~~~~~~~~~~~~~~~~~~

src/views/MaterialReceivePrintView.vue:195:10 - error TS6133: 'formatDateTime' is declared but its value is never read.   

195 function formatDateTime(dateString: string): string {
             ~~~~~~~~~~~~~~

src/views/MaterialReceivePrintView.vue:265:10 - error TS6133: 'getStatusLabel' is declared but its value is never read.   

265 function getStatusLabel(status: string): string {
             ~~~~~~~~~~~~~~

src/views/MaterialReceivePrintView.vue:277:10 - error TS6133: 'getStatusClass' is declared but its value is never read.   

277 function getStatusClass(status: string): string {
             ~~~~~~~~~~~~~~

src/views/MaterialReceiveView.vue:198:7 - error TS6133: 'handleStep1Next' is declared but its value is never read.        

198 const handleStep1Next = async (data: any) => {
          ~~~~~~~~~~~~~~~

src/views/MaterialsView.vue:166:3 - error TS6133: 'error' is declared but its value is never read.

166   error
      ~~~~~


Found 34 errors.