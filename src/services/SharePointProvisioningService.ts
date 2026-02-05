import { getAuthService } from './serviceFactory';
import { config } from '../config/environmentConfig';

// Get the appropriate auth service based on test mode
const authService = getAuthService();

interface FieldDefinition {
  internalName: string;
  displayName: string;
  type: 'Text' | 'Note' | 'Number' | 'DateTime' | 'Choice' | 'Boolean';
  required?: boolean;
  choices?: string[];
  defaultValue?: string;
  customFormatter?: object; // JSON column formatting
}

interface ViewDefinition {
  title: string;
  viewFields: string[];
  query?: string; // CAML query for filtering
  rowLimit?: number;
  defaultView?: boolean;
  viewFormatter?: object; // JSON view/row formatting
}

interface ListDefinition {
  title: string;
  description: string;
  fields: FieldDefinition[];
  views?: ViewDefinition[];
  listFormatter?: object; // JSON list formatting (header/footer)
}

class SharePointProvisioningService {
  private get siteUrl(): string {
    return config.sharepoint.siteUrl;
  }

  private async getRequestDigest(): Promise<string> {
    const token = await authService.getGraphToken();
    const response = await fetch(`${this.siteUrl}/_api/contextinfo`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json;odata=verbose',
      },
    });
    const data = await response.json();
    return data.d.GetContextWebInformation.FormDigestValue;
  }

  private async listExists(listTitle: string): Promise<boolean> {
    try {
      const token = await authService.getGraphToken();
      const response = await fetch(
        `${this.siteUrl}/_api/web/lists/getbytitle('${listTitle}')`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json;odata=verbose',
          },
        }
      );
      return response.ok;
    } catch {
      return false;
    }
  }

  private async createList(title: string, description: string): Promise<void> {
    const token = await authService.getGraphToken();
    const digest = await this.getRequestDigest();

    const response = await fetch(`${this.siteUrl}/_api/web/lists`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json;odata=verbose',
        'Content-Type': 'application/json;odata=verbose',
        'X-RequestDigest': digest,
      },
      body: JSON.stringify({
        __metadata: { type: 'SP.List' },
        Title: title,
        Description: description,
        BaseTemplate: 100, // Generic List
        AllowContentTypes: false,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create list ${title}: ${error}`);
    }
  }

  private async addField(listTitle: string, field: FieldDefinition): Promise<void> {
    const token = await authService.getGraphToken();
    const digest = await this.getRequestDigest();

    let fieldXml = '';

    switch (field.type) {
      case 'Text':
        fieldXml = `<Field Type="Text" DisplayName="${field.displayName}" Name="${field.internalName}" Required="${field.required ? 'TRUE' : 'FALSE'}" />`;
        break;
      case 'Note':
        fieldXml = `<Field Type="Note" DisplayName="${field.displayName}" Name="${field.internalName}" Required="${field.required ? 'TRUE' : 'FALSE'}" NumLines="6" RichText="FALSE" />`;
        break;
      case 'Number':
        fieldXml = `<Field Type="Number" DisplayName="${field.displayName}" Name="${field.internalName}" Required="${field.required ? 'TRUE' : 'FALSE'}" />`;
        break;
      case 'DateTime':
        fieldXml = `<Field Type="DateTime" DisplayName="${field.displayName}" Name="${field.internalName}" Required="${field.required ? 'TRUE' : 'FALSE'}" Format="DateOnly" />`;
        break;
      case 'Boolean':
        fieldXml = `<Field Type="Boolean" DisplayName="${field.displayName}" Name="${field.internalName}" Required="${field.required ? 'TRUE' : 'FALSE'}"><Default>${field.defaultValue || '0'}</Default></Field>`;
        break;
      case 'Choice':
        const choicesXml = field.choices?.map((c) => `<CHOICE>${c}</CHOICE>`).join('') || '';
        const defaultXml = field.defaultValue ? `<Default>${field.defaultValue}</Default>` : '';
        fieldXml = `<Field Type="Choice" DisplayName="${field.displayName}" Name="${field.internalName}" Required="${field.required ? 'TRUE' : 'FALSE'}"><CHOICES>${choicesXml}</CHOICES>${defaultXml}</Field>`;
        break;
    }

    const response = await fetch(
      `${this.siteUrl}/_api/web/lists/getbytitle('${listTitle}')/fields/createfieldasxml`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json;odata=verbose',
          'Content-Type': 'application/json;odata=verbose',
          'X-RequestDigest': digest,
        },
        body: JSON.stringify({
          parameters: {
            __metadata: { type: 'SP.XmlSchemaFieldCreationInformation' },
            SchemaXml: fieldXml,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error(`[Provisioning] Failed to add field ${field.internalName}:`, error);
      // Don't throw - field might already exist
    }
  }

  // ==================== VIEW OPERATIONS ====================

  /**
   * Create a custom view for a list
   * Note: SharePoint REST API requires view fields to be added separately after view creation
   */
  private async createView(listTitle: string, view: ViewDefinition): Promise<void> {
    const token = await authService.getGraphToken();
    const digest = await this.getRequestDigest();

    // First, check if view already exists
    const existingViews = await this.getListViews(listTitle);
    const viewExists = existingViews.some(v => v.title === view.title);
    if (viewExists) {
      console.log(`View "${view.title}" already exists, skipping creation`);
      return;
    }

    // Create the view without ViewFields (they must be added separately)
    const viewPayload = {
      __metadata: { type: 'SP.View' },
      Title: view.title,
      RowLimit: view.rowLimit || 30,
      DefaultView: view.defaultView || false,
      ViewQuery: view.query || '',
    };

    const response = await fetch(
      `${this.siteUrl}/_api/web/lists/getbytitle('${listTitle}')/views`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json;odata=verbose',
          'Content-Type': 'application/json;odata=verbose',
          'X-RequestDigest': digest,
        },
        body: JSON.stringify(viewPayload),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error(`[Provisioning] Failed to create view ${view.title}:`, error);
      return;
    }

    const viewData = await response.json();
    const viewId = viewData.d.Id;

    // Now add view fields one by one using the AddViewField endpoint
    if (view.viewFields && view.viewFields.length > 0) {
      await this.setViewFields(listTitle, viewId, view.viewFields, digest);
    }

    // Apply view formatting if specified
    if (view.viewFormatter) {
      await this.applyViewFormatting(listTitle, viewId, view.viewFormatter);
    }

    console.log(`View "${view.title}" created successfully with ${view.viewFields?.length || 0} fields`);
  }

  /**
   * Set view fields by removing all existing and adding new ones
   */
  private async setViewFields(listTitle: string, viewId: string, fields: string[], digest: string): Promise<void> {
    const token = await authService.getGraphToken();

    // First, get the ViewFields collection and remove all existing fields
    const viewFieldsResponse = await fetch(
      `${this.siteUrl}/_api/web/lists/getbytitle('${listTitle}')/views('${viewId}')/viewfields`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json;odata=verbose',
        },
      }
    );

    if (viewFieldsResponse.ok) {
      // Remove all existing fields using RemoveAllViewFields
      await fetch(
        `${this.siteUrl}/_api/web/lists/getbytitle('${listTitle}')/views('${viewId}')/viewfields/removeallviewfields`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json;odata=verbose',
            'X-RequestDigest': digest,
          },
        }
      );
    }

    // Add each field to the view
    for (const fieldName of fields) {
      try {
        const addFieldResponse = await fetch(
          `${this.siteUrl}/_api/web/lists/getbytitle('${listTitle}')/views('${viewId}')/viewfields/addviewfield('${fieldName}')`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/json;odata=verbose',
              'X-RequestDigest': digest,
            },
          }
        );

        if (!addFieldResponse.ok) {
          const errorText = await addFieldResponse.text();
          console.error(`[Provisioning] Failed to add field "${fieldName}" to view:`, errorText);
        }
      } catch (err) {
        console.error(`[Provisioning] Error adding field "${fieldName}" to view:`, err);
      }
    }
  }

  /**
   * Apply JSON formatting to a view (row formatting)
   */
  private async applyViewFormatting(listTitle: string, viewId: string, formatter: object): Promise<void> {
    const token = await authService.getGraphToken();
    const digest = await this.getRequestDigest();

    const response = await fetch(
      `${this.siteUrl}/_api/web/lists/getbytitle('${listTitle}')/views('${viewId}')`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json;odata=verbose',
          'Content-Type': 'application/json;odata=verbose',
          'X-RequestDigest': digest,
          'IF-MATCH': '*',
          'X-HTTP-Method': 'MERGE',
        },
        body: JSON.stringify({
          __metadata: { type: 'SP.View' },
          CustomFormatter: JSON.stringify({ rowFormatter: formatter }),
        }),
      }
    );

    if (!response.ok) {
      console.error(`[Provisioning] Failed to apply view formatting:`, await response.text());
    }
  }

  // ==================== COLUMN FORMATTING ====================

  /**
   * Apply JSON formatting to a column
   */
  async applyColumnFormatting(
    listTitle: string,
    fieldInternalName: string,
    formatter: object
  ): Promise<{ success: boolean; message: string }> {
    try {
      const token = await authService.getGraphToken();
      const digest = await this.getRequestDigest();

      // First get the field to get its ID
      const fieldResponse = await fetch(
        `${this.siteUrl}/_api/web/lists/getbytitle('${listTitle}')/fields/getbyinternalnameortitle('${fieldInternalName}')`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json;odata=verbose',
          },
        }
      );

      if (!fieldResponse.ok) {
        throw new Error(`Field ${fieldInternalName} not found`);
      }

      const fieldData = await fieldResponse.json();
      const fieldId = fieldData.d.Id;

      // Apply the custom formatter
      const updateResponse = await fetch(
        `${this.siteUrl}/_api/web/lists/getbytitle('${listTitle}')/fields('${fieldId}')`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json;odata=verbose',
            'Content-Type': 'application/json;odata=verbose',
            'X-RequestDigest': digest,
            'IF-MATCH': '*',
            'X-HTTP-Method': 'MERGE',
          },
          body: JSON.stringify({
            __metadata: { type: fieldData.d.__metadata.type },
            CustomFormatter: JSON.stringify(formatter),
          }),
        }
      );

      if (!updateResponse.ok) {
        throw new Error(await updateResponse.text());
      }

      return { success: true, message: `Column formatting applied to ${fieldInternalName}` };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to apply column formatting',
      };
    }
  }

  /**
   * Apply JSON formatting to the list (header/footer)
   */
  async applyListFormatting(
    listTitle: string,
    formatter: { headerFormatter?: object; footerFormatter?: object }
  ): Promise<{ success: boolean; message: string }> {
    try {
      const token = await authService.getGraphToken();
      const digest = await this.getRequestDigest();

      // Get the default view to apply formatting
      const viewResponse = await fetch(
        `${this.siteUrl}/_api/web/lists/getbytitle('${listTitle}')/defaultview`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json;odata=verbose',
          },
        }
      );

      if (!viewResponse.ok) {
        throw new Error('Failed to get default view');
      }

      const viewData = await viewResponse.json();
      const viewId = viewData.d.Id;

      const customFormatter: Record<string, unknown> = {};
      if (formatter.headerFormatter) {
        customFormatter.headerFormatter = formatter.headerFormatter;
      }
      if (formatter.footerFormatter) {
        customFormatter.footerFormatter = formatter.footerFormatter;
      }

      const updateResponse = await fetch(
        `${this.siteUrl}/_api/web/lists/getbytitle('${listTitle}')/views('${viewId}')`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json;odata=verbose',
            'Content-Type': 'application/json;odata=verbose',
            'X-RequestDigest': digest,
            'IF-MATCH': '*',
            'X-HTTP-Method': 'MERGE',
          },
          body: JSON.stringify({
            __metadata: { type: 'SP.View' },
            CustomFormatter: JSON.stringify(customFormatter),
          }),
        }
      );

      if (!updateResponse.ok) {
        throw new Error(await updateResponse.text());
      }

      return { success: true, message: 'List formatting applied successfully' };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to apply list formatting',
      };
    }
  }

  /**
   * Get existing views for a list
   */
  async getListViews(listTitle: string): Promise<Array<{ id: string; title: string; defaultView: boolean }>> {
    try {
      const token = await authService.getGraphToken();

      const response = await fetch(
        `${this.siteUrl}/_api/web/lists/getbytitle('${listTitle}')/views?$select=Id,Title,DefaultView`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json;odata=verbose',
          },
        }
      );

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return data.d.results.map((v: { Id: string; Title: string; DefaultView: boolean }) => ({
        id: v.Id,
        title: v.Title,
        defaultView: v.DefaultView,
      }));
    } catch {
      return [];
    }
  }

  /**
   * Delete a view by title
   */
  async deleteView(listTitle: string, viewTitle: string): Promise<{ success: boolean; message: string }> {
    try {
      const token = await authService.getGraphToken();
      const digest = await this.getRequestDigest();

      // First get the view ID
      const views = await this.getListViews(listTitle);
      const view = views.find(v => v.title === viewTitle);

      if (!view) {
        return { success: false, message: `View "${viewTitle}" not found` };
      }

      if (view.defaultView) {
        return { success: false, message: `Cannot delete the default view "${viewTitle}"` };
      }

      const response = await fetch(
        `${this.siteUrl}/_api/web/lists/getbytitle('${listTitle}')/views('${view.id}')`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json;odata=verbose',
            'X-RequestDigest': digest,
            'IF-MATCH': '*',
            'X-HTTP-Method': 'DELETE',
          },
        }
      );

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return { success: true, message: `View "${viewTitle}" deleted successfully` };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete view',
      };
    }
  }

  /**
   * Delete and recreate LPDemoScheduler views (for fixing broken views)
   */
  async recreateLPDemoSchedulerViews(): Promise<{ results: Array<{ item: string; success: boolean; message: string }> }> {
    const results: Array<{ item: string; success: boolean; message: string }> = [];
    const listName = 'LPDemoScheduler';

    const viewTitles = [
      'Pending Bookings',
      'Confirmed Bookings',
      'Premium Clients',
      'This Week',
      'By Account Manager',
    ];

    // First delete existing views
    for (const viewTitle of viewTitles) {
      const deleteResult = await this.deleteView(listName, viewTitle);
      results.push({ item: `Delete: ${viewTitle}`, ...deleteResult });
    }

    // Now create fresh views
    const createResults = await this.createLPDemoSchedulerViews();
    results.push(...createResults.results);

    return { results };
  }

  /**
   * Create a custom view with optional formatting
   */
  async createCustomView(
    listTitle: string,
    viewConfig: ViewDefinition
  ): Promise<{ success: boolean; message: string }> {
    try {
      await this.createView(listTitle, viewConfig);
      return { success: true, message: `View "${viewConfig.title}" created successfully` };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create view',
      };
    }
  }

  /**
   * Get all fields/columns for a list - useful for diagnostics
   */
  async getListFields(listTitle: string): Promise<Array<{
    internalName: string;
    title: string;
    typeAsString: string;
    hidden: boolean;
  }>> {
    try {
      const token = await authService.getGraphToken();

      const response = await fetch(
        `${this.siteUrl}/_api/web/lists/getbytitle('${listTitle}')/fields?$filter=Hidden eq false&$select=InternalName,Title,TypeAsString,Hidden&$orderby=Title`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json;odata=verbose',
          },
        }
      );

      if (!response.ok) {
        console.error('Failed to get list fields:', await response.text());
        return [];
      }

      const data = await response.json();
      return data.d.results.map((f: { InternalName: string; Title: string; TypeAsString: string; Hidden: boolean }) => ({
        internalName: f.InternalName,
        title: f.Title,
        typeAsString: f.TypeAsString,
        hidden: f.Hidden,
      }));
    } catch (error) {
      console.error('Failed to get list fields:', error);
      return [];
    }
  }

  /**
   * Get LPDemoScheduler list fields for diagnostics
   */
  async getLPDemoSchedulerFields(): Promise<Array<{
    internalName: string;
    title: string;
    typeAsString: string;
  }>> {
    return this.getListFields('LPDemoScheduler');
  }

  private async provisionList(definition: ListDefinition): Promise<{ success: boolean; message: string }> {
    try {
      // Check if list already exists
      const exists = await this.listExists(definition.title);
      if (exists) {
        return { success: true, message: `List "${definition.title}" already exists` };
      }

      // Create the list
      await this.createList(definition.title, definition.description);

      // Add fields
      for (const field of definition.fields) {
        await this.addField(definition.title, field);
        // Apply column formatting if specified
        if (field.customFormatter) {
          await this.applyColumnFormatting(definition.title, field.internalName, field.customFormatter);
        }
      }

      // Create custom views if specified
      if (definition.views) {
        for (const view of definition.views) {
          await this.createView(definition.title, view);
        }
      }

      // Apply list formatting if specified
      if (definition.listFormatter) {
        await this.applyListFormatting(definition.title, definition.listFormatter as { headerFormatter?: object; footerFormatter?: object });
      }

      return { success: true, message: `List "${definition.title}" created successfully` };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : `Failed to provision list "${definition.title}"`,
      };
    }
  }

  // ==================== PREDEFINED JSON FORMATTERS ====================

  /**
   * Status column formatter with colored pills
   */
  static getStatusColumnFormatter(statusColors: Record<string, { background: string; text: string }>): object {
    const conditions = Object.entries(statusColors).map(([status, colors]) => ({
      operator: '==',
      operands: ['[$Status]', status],
      result: {
        elmType: 'div',
        style: {
          'background-color': colors.background,
          color: colors.text,
          padding: '4px 12px',
          'border-radius': '16px',
          'font-size': '12px',
          'font-weight': '600',
          display: 'inline-block',
        },
        txtContent: '[$Status]',
      },
    }));

    return {
      $schema: 'https://developer.microsoft.com/json-schemas/sp/v2/column-formatting.schema.json',
      elmType: 'div',
      children: [
        {
          elmType: 'div',
          style: {
            display: 'flex',
            'align-items': 'center',
          },
          children: [
            {
              elmType: 'div',
              operator: '?',
              operands: conditions.concat([{ result: { elmType: 'span', txtContent: '[$Status]' } }] as never[]),
            },
          ],
        },
      ],
    };
  }

  /**
   * Boolean column formatter with icons
   */
  static getBooleanIconFormatter(trueIcon: string, falseIcon: string, trueColor: string, falseColor: string): object {
    return {
      $schema: 'https://developer.microsoft.com/json-schemas/sp/v2/column-formatting.schema.json',
      elmType: 'div',
      style: {
        display: 'flex',
        'align-items': 'center',
        'justify-content': 'center',
      },
      children: [
        {
          elmType: 'span',
          attributes: {
            iconName: {
              operator: '?',
              operands: [
                '@currentField',
                trueIcon,
                falseIcon,
              ],
            },
          },
          style: {
            color: {
              operator: '?',
              operands: [
                '@currentField',
                trueColor,
                falseColor,
              ],
            },
            'font-size': '16px',
          },
        },
      ],
    };
  }

  /**
   * Date column formatter with relative dates
   */
  static getDateFormatter(showRelative: boolean = true): object {
    if (!showRelative) {
      return {
        $schema: 'https://developer.microsoft.com/json-schemas/sp/v2/column-formatting.schema.json',
        elmType: 'div',
        txtContent: '@currentField.displayValue',
      };
    }

    return {
      $schema: 'https://developer.microsoft.com/json-schemas/sp/v2/column-formatting.schema.json',
      elmType: 'div',
      style: {
        display: 'flex',
        'flex-direction': 'column',
      },
      children: [
        {
          elmType: 'span',
          txtContent: '@currentField.displayValue',
          style: {
            'font-weight': '600',
          },
        },
        {
          elmType: 'span',
          txtContent: "=toLocaleString(@currentField)",
          style: {
            'font-size': '11px',
            color: '#666',
          },
        },
      ],
    };
  }

  /**
   * Row formatter for alternating colors and status-based highlighting
   */
  static getRowFormatter(statusField: string, statusColors: Record<string, string>): object {
    return {
      $schema: 'https://developer.microsoft.com/json-schemas/sp/v2/row-formatting.schema.json',
      additionalRowClass: {
        operator: '?',
        operands: Object.entries(statusColors).flatMap(([status, cssClass]) => [
          {
            operator: '==',
            operands: [`[$${statusField}]`, status],
          },
          cssClass,
        ]).concat([''] as never[]),
      },
    };
  }

  /**
   * Person/Email column formatter with avatar
   */
  static getPersonFormatter(): object {
    return {
      $schema: 'https://developer.microsoft.com/json-schemas/sp/v2/column-formatting.schema.json',
      elmType: 'div',
      style: {
        display: 'flex',
        'align-items': 'center',
        gap: '8px',
      },
      children: [
        {
          elmType: 'img',
          attributes: {
            src: "='/_layouts/15/userphoto.aspx?size=S&accountname=' + @currentField.email",
          },
          style: {
            width: '24px',
            height: '24px',
            'border-radius': '50%',
          },
        },
        {
          elmType: 'span',
          txtContent: '@currentField.title',
        },
      ],
    };
  }

  /**
   * Progress bar formatter for number fields (0-100)
   */
  static getProgressBarFormatter(color: string = '#0078d4'): object {
    return {
      $schema: 'https://developer.microsoft.com/json-schemas/sp/v2/column-formatting.schema.json',
      elmType: 'div',
      style: {
        width: '100%',
        height: '8px',
        'background-color': '#e0e0e0',
        'border-radius': '4px',
        overflow: 'hidden',
      },
      children: [
        {
          elmType: 'div',
          style: {
            width: "=toString(@currentField) + '%'",
            height: '100%',
            'background-color': color,
          },
        },
      ],
    };
  }

  // ==================== DWX LIST DEFINITIONS ====================

  /**
   * DWxServices - Service Catalog list definition
   */
  private get dwxServicesListDefinition(): ListDefinition {
    return {
      title: 'DWxServices',
      description: 'Digital Workplace Service Catalog for pre-sales offerings',
      fields: [
        { internalName: 'Description', displayName: 'Description', type: 'Note', required: true },
        { internalName: 'ShortDescription', displayName: 'Short Description', type: 'Text', required: true },
        {
          internalName: 'Category',
          displayName: 'Category',
          type: 'Choice',
          required: true,
          choices: ['Power Platform', 'SPFx Development', 'SharePoint Migration', 'M365 Assessment', 'Copilot Agents', 'MS Viva', 'Tenders', 'Proposals', 'Pre-Sales', 'Ad-Hoc Support'],
        },
        {
          internalName: 'TypicalDuration',
          displayName: 'Typical Duration',
          type: 'Choice',
          choices: ['30min', '1hr', '2hr', 'Half-day', 'Full-day', 'Multi-day'],
        },
        {
          internalName: 'ComplexityLevel',
          displayName: 'Complexity Level',
          type: 'Choice',
          choices: ['Low', 'Medium', 'High', 'Enterprise'],
        },
        {
          internalName: 'PricingModel',
          displayName: 'Pricing Model',
          type: 'Choice',
          choices: ['Fixed', 'Hourly', 'Project-based', 'TBD'],
        },
        { internalName: 'BasePrice', displayName: 'Base Price (ZAR)', type: 'Number' },
        { internalName: 'RequiredRoles', displayName: 'Required Roles', type: 'Note' }, // JSON array
        { internalName: 'Prerequisites', displayName: 'Prerequisites', type: 'Note' },
        { internalName: 'IsActive', displayName: 'Is Active', type: 'Boolean', defaultValue: '1' },
        { internalName: 'SortOrder', displayName: 'Sort Order', type: 'Number' },
        { internalName: 'IconName', displayName: 'Icon Name', type: 'Text' },
      ],
    };
  }

  /**
   * DWxServiceRequests - Main service requests / sales funnel list definition
   */
  private get dwxServiceRequestsListDefinition(): ListDefinition {
    return {
      title: 'DWxServiceRequests',
      description: 'Service requests and sales funnel tracking for Digital Workplace',
      fields: [
        // Service Reference
        { internalName: 'ServiceId', displayName: 'Service ID', type: 'Number' },
        { internalName: 'ServiceName', displayName: 'Service Name', type: 'Text', required: true },

        // Account Manager
        { internalName: 'AccountManagerName', displayName: 'Account Manager Name', type: 'Text', required: true },
        { internalName: 'AccountManagerEmail', displayName: 'Account Manager Email', type: 'Text', required: true },
        {
          internalName: 'AccountManagerTenant',
          displayName: 'Account Manager Tenant',
          type: 'Choice',
          choices: ['Internal', 'External'],
          defaultValue: 'Internal',
        },

        // Client Information
        { internalName: 'ClientName', displayName: 'Client Name', type: 'Text', required: true },
        { internalName: 'ClientId', displayName: 'Client ID', type: 'Number' },
        { internalName: 'ContactName', displayName: 'Contact Name', type: 'Text', required: true },
        { internalName: 'ContactEmail', displayName: 'Contact Email', type: 'Text', required: true },
        { internalName: 'ContactPhone', displayName: 'Contact Phone', type: 'Text' },
        {
          internalName: 'Industry',
          displayName: 'Industry',
          type: 'Choice',
          choices: ['Technology', 'Finance', 'Healthcare', 'Retail', 'Manufacturing', 'Government', 'Education', 'Legal', 'Non-Profit', 'Other'],
        },
        {
          internalName: 'CompanySize',
          displayName: 'Company Size',
          type: 'Choice',
          choices: ['SMB', 'Medium', 'Large', 'Enterprise'],
        },

        // Funnel State
        {
          internalName: 'FunnelStage',
          displayName: 'Funnel Stage',
          type: 'Choice',
          required: true,
          choices: ['Lead', 'Qualified', 'Discovery', 'Proposal', 'Negotiation', 'Won', 'Lost'],
          defaultValue: 'Lead',
        },
        {
          internalName: 'InterestLevel',
          displayName: 'Interest Level',
          type: 'Choice',
          choices: ['Hot', 'Warm', 'Cold'],
          defaultValue: 'Warm',
        },

        // Deal Information
        { internalName: 'DealValue', displayName: 'Deal Value (ZAR)', type: 'Number' },
        { internalName: 'DealProbability', displayName: 'Deal Probability (%)', type: 'Number' },
        { internalName: 'ExpectedCloseDate', displayName: 'Expected Close Date', type: 'DateTime' },
        { internalName: 'Budget', displayName: 'Budget', type: 'Text' },
        { internalName: 'Timeline', displayName: 'Timeline', type: 'Text' },

        // Scheduling
        { internalName: 'ProposedSlot1', displayName: 'Proposed Slot 1', type: 'DateTime', required: true },
        { internalName: 'ProposedSlot2', displayName: 'Proposed Slot 2', type: 'DateTime' },
        { internalName: 'ProposedSlot3', displayName: 'Proposed Slot 3', type: 'DateTime' },
        { internalName: 'ConfirmedDateTime', displayName: 'Confirmed Date/Time', type: 'DateTime' },
        { internalName: 'CalendarEventId', displayName: 'Calendar Event ID', type: 'Text' },

        // Assignment
        { internalName: 'AssignedSpecialistName', displayName: 'Assigned Specialist Name', type: 'Text' },
        { internalName: 'AssignedSpecialistEmail', displayName: 'Assigned Specialist Email', type: 'Text' },
        {
          internalName: 'AssignedSpecialistRole',
          displayName: 'Assigned Specialist Role',
          type: 'Choice',
          choices: ['Solution Architect', 'Technical Specialist', 'Consultant'],
        },

        // Additional Info
        { internalName: 'Requirements', displayName: 'Requirements', type: 'Note' },
        { internalName: 'ServiceHistory', displayName: 'Service History', type: 'Note' },
        { internalName: 'WinLossReason', displayName: 'Win/Loss Reason', type: 'Text' },
        { internalName: 'NextSteps', displayName: 'Next Steps', type: 'Note' },
        { internalName: 'Comments', displayName: 'Comments', type: 'Note' },
        { internalName: 'DocumentIds', displayName: 'Document IDs', type: 'Note' }, // JSON array
      ],
    };
  }

  /**
   * DWxClients - Client master data list definition
   */
  private get dwxClientsListDefinition(): ListDefinition {
    return {
      title: 'DWxClients',
      description: 'Client master data for Digital Workplace',
      fields: [
        { internalName: 'PrimaryContactName', displayName: 'Primary Contact Name', type: 'Text', required: true },
        { internalName: 'PrimaryContactEmail', displayName: 'Primary Contact Email', type: 'Text', required: true },
        { internalName: 'DecisionMakerName', displayName: 'Decision Maker Name', type: 'Text' },
        { internalName: 'DecisionMakerEmail', displayName: 'Decision Maker Email', type: 'Text' },
        { internalName: 'Phone', displayName: 'Phone', type: 'Text' },
        {
          internalName: 'Industry',
          displayName: 'Industry',
          type: 'Choice',
          choices: ['Technology', 'Finance', 'Healthcare', 'Retail', 'Manufacturing', 'Government', 'Education', 'Legal', 'Non-Profit', 'Other'],
        },
        {
          internalName: 'CompanySize',
          displayName: 'Company Size',
          type: 'Choice',
          choices: ['SMB', 'Medium', 'Large', 'Enterprise'],
        },
        { internalName: 'Address', displayName: 'Address', type: 'Note' },
        { internalName: 'Website', displayName: 'Website', type: 'Text' },
        { internalName: 'TenantId', displayName: 'M365 Tenant ID', type: 'Text' },
        { internalName: 'IsPremium', displayName: 'Premium Client', type: 'Boolean', defaultValue: '0' },
        { internalName: 'AccountManagerEmail', displayName: 'Account Manager Email', type: 'Text' },
        { internalName: 'EngagementCount', displayName: 'Engagement Count', type: 'Number' },
        { internalName: 'TotalRevenue', displayName: 'Total Revenue (ZAR)', type: 'Number' },
        { internalName: 'LastEngagementDate', displayName: 'Last Engagement Date', type: 'DateTime' },
        {
          internalName: 'ContractStatus',
          displayName: 'Contract Status',
          type: 'Choice',
          choices: ['Prospect', 'Active', 'Churned'],
          defaultValue: 'Prospect',
        },
        { internalName: 'Notes', displayName: 'Notes', type: 'Note' },
      ],
    };
  }

  /**
   * DWxSpecialists - Pre-sales specialists list definition
   */
  private get dwxSpecialistsListDefinition(): ListDefinition {
    return {
      title: 'DWxSpecialists',
      description: 'Pre-sales specialists for Digital Workplace',
      fields: [
        { internalName: 'Email', displayName: 'Email', type: 'Text', required: true },
        {
          internalName: 'Role',
          displayName: 'Role',
          type: 'Choice',
          required: true,
          choices: ['Solution Architect', 'Technical Specialist', 'Consultant'],
        },
        { internalName: 'Specializations', displayName: 'Specializations', type: 'Note' }, // JSON array of categories
        { internalName: 'MaxConcurrentDeals', displayName: 'Max Concurrent Deals', type: 'Number' },
        { internalName: 'CurrentDealCount', displayName: 'Current Deal Count', type: 'Number' },
        { internalName: 'IsActive', displayName: 'Is Active', type: 'Boolean', defaultValue: '1' },
        { internalName: 'CalendarEmail', displayName: 'Calendar Email', type: 'Text' },
        { internalName: 'Phone', displayName: 'Phone', type: 'Text' },
      ],
    };
  }

  // ==================== LIST DEFINITIONS ====================

  private get accountManagersListDefinition(): ListDefinition {
    return {
      title: 'AccountManagers',
      description: 'Account Managers for the DWx Traffic Manager',
      fields: [
        { internalName: 'Email', displayName: 'Email', type: 'Text', required: true },
        { internalName: 'Phone', displayName: 'Phone', type: 'Text' },
        { internalName: 'MobilePhone', displayName: 'Mobile Phone', type: 'Text' },
        { internalName: 'Department', displayName: 'Department', type: 'Text' },
        { internalName: 'JobTitle', displayName: 'Job Title', type: 'Text' },
        {
          internalName: 'Region',
          displayName: 'Region',
          type: 'Choice',
          choices: ['North America', 'Europe', 'Asia Pacific', 'Latin America', 'Middle East', 'Africa', 'Global'],
        },
        {
          internalName: 'Status',
          displayName: 'Status',
          type: 'Choice',
          required: true,
          choices: ['Active', 'Inactive', 'On Leave'],
          defaultValue: 'Active',
        },
        {
          internalName: 'Source',
          displayName: 'Source',
          type: 'Choice',
          required: true,
          choices: ['Internal', 'External', 'Guest'],
          defaultValue: 'Internal',
        },
        { internalName: 'EntraUserId', displayName: 'Entra User ID', type: 'Text' },
        { internalName: 'ExternalTenant', displayName: 'External Tenant', type: 'Text' },
        { internalName: 'Company', displayName: 'Company', type: 'Text' },
        { internalName: 'ManagerEmail', displayName: 'Manager Email', type: 'Text' },
        { internalName: 'ClientCount', displayName: 'Client Count', type: 'Number' },
        { internalName: 'BookingCount', displayName: 'Booking Count', type: 'Number' },
        { internalName: 'HireDate', displayName: 'Hire Date', type: 'DateTime' },
        { internalName: 'Notes', displayName: 'Notes', type: 'Note' },
      ],
    };
  }

  private get bookingsListDefinition(): ListDefinition {
    return {
      title: 'Bookings',
      description: 'Demo and deployment bookings',
      fields: [
        { internalName: 'ClientName', displayName: 'Client Name', type: 'Text', required: true },
        { internalName: 'ClientEmail', displayName: 'Client Email', type: 'Text', required: true },
        { internalName: 'AccountManagerName', displayName: 'Account Manager', type: 'Text', required: true },
        { internalName: 'AccountManagerEmail', displayName: 'Account Manager Email', type: 'Text', required: true },
        {
          internalName: 'BookingType',
          displayName: 'Booking Type',
          type: 'Choice',
          required: true,
          choices: ['Demo', 'Deployment', 'Training', 'Consultation'],
        },
        {
          internalName: 'Status',
          displayName: 'Status',
          type: 'Choice',
          required: true,
          choices: ['Pending', 'Confirmed', 'Completed', 'Cancelled', 'Rescheduled'],
          defaultValue: 'Pending',
        },
        { internalName: 'ProposedDate1', displayName: 'Proposed Date 1', type: 'DateTime', required: true },
        { internalName: 'ProposedDate2', displayName: 'Proposed Date 2', type: 'DateTime' },
        { internalName: 'ProposedDate3', displayName: 'Proposed Date 3', type: 'DateTime' },
        { internalName: 'ConfirmedDate', displayName: 'Confirmed Date', type: 'DateTime' },
        { internalName: 'Duration', displayName: 'Duration (minutes)', type: 'Number' },
        { internalName: 'IsPremium', displayName: 'Premium Client', type: 'Boolean', defaultValue: '0' },
        { internalName: 'Notes', displayName: 'Notes', type: 'Note' },
        { internalName: 'AssignedTeamMember', displayName: 'Assigned Team Member', type: 'Text' },
        { internalName: 'AssignedTeamMemberEmail', displayName: 'Team Member Email', type: 'Text' },
        { internalName: 'CalendarEventId', displayName: 'Calendar Event ID', type: 'Text' },
      ],
    };
  }

  private get clientsListDefinition(): ListDefinition {
    return {
      title: 'Clients',
      description: 'Client organizations',
      fields: [
        { internalName: 'ContactName', displayName: 'Contact Name', type: 'Text' },
        { internalName: 'ContactEmail', displayName: 'Contact Email', type: 'Text' },
        { internalName: 'ContactPhone', displayName: 'Contact Phone', type: 'Text' },
        { internalName: 'Industry', displayName: 'Industry', type: 'Text' },
        {
          internalName: 'Region',
          displayName: 'Region',
          type: 'Choice',
          choices: ['North America', 'Europe', 'Asia Pacific', 'Latin America', 'Middle East', 'Africa', 'Global'],
        },
        { internalName: 'IsPremium', displayName: 'Premium Client', type: 'Boolean', defaultValue: '0' },
        {
          internalName: 'Status',
          displayName: 'Status',
          type: 'Choice',
          choices: ['Active', 'Inactive', 'Prospect'],
          defaultValue: 'Active',
        },
        { internalName: 'AccountManagerEmail', displayName: 'Account Manager Email', type: 'Text' },
        { internalName: 'Notes', displayName: 'Notes', type: 'Note' },
      ],
    };
  }

  private get teamMembersListDefinition(): ListDefinition {
    return {
      title: 'TeamMembers',
      description: 'Demo team members',
      fields: [
        { internalName: 'Email', displayName: 'Email', type: 'Text', required: true },
        { internalName: 'Phone', displayName: 'Phone', type: 'Text' },
        {
          internalName: 'Role',
          displayName: 'Role',
          type: 'Choice',
          choices: ['Demo Specialist', 'Solution Architect', 'Technical Lead', 'Manager'],
        },
        { internalName: 'Specializations', displayName: 'Specializations', type: 'Note' },
        {
          internalName: 'Status',
          displayName: 'Status',
          type: 'Choice',
          choices: ['Active', 'Inactive', 'On Leave'],
          defaultValue: 'Active',
        },
        { internalName: 'MaxDemosPerDay', displayName: 'Max Demos Per Day', type: 'Number' },
        { internalName: 'CalendarEmail', displayName: 'Calendar Email', type: 'Text' },
      ],
    };
  }

  private get auditLogListDefinition(): ListDefinition {
    return {
      title: 'AuditLog',
      description: 'Audit log for tracking changes',
      fields: [
        {
          internalName: 'Action',
          displayName: 'Action',
          type: 'Choice',
          required: true,
          choices: ['CREATE', 'UPDATE', 'DELETE', 'VIEW', 'APPROVE', 'REJECT', 'RESCHEDULE', 'LOGIN', 'LOGOUT'],
        },
        {
          internalName: 'EntityType',
          displayName: 'Entity Type',
          type: 'Choice',
          required: true,
          choices: ['Booking', 'TeamMember', 'Client', 'Checklist', 'User', 'AccountManager'],
        },
        { internalName: 'EntityId', displayName: 'Entity ID', type: 'Text', required: true },
        { internalName: 'EntityName', displayName: 'Entity Name', type: 'Text', required: true },
        { internalName: 'PerformedBy', displayName: 'Performed By', type: 'Text', required: true },
        { internalName: 'PerformedByEmail', displayName: 'Performed By Email', type: 'Text', required: true },
        { internalName: 'Timestamp', displayName: 'Timestamp', type: 'DateTime', required: true },
        { internalName: 'Details', displayName: 'Details', type: 'Note' },
        { internalName: 'OldValues', displayName: 'Old Values', type: 'Note' },
        { internalName: 'NewValues', displayName: 'New Values', type: 'Note' },
      ],
    };
  }

  // ==================== PUBLIC METHODS ====================

  /**
   * Provision the AccountManagers list
   */
  async provisionAccountManagersList(): Promise<{ success: boolean; message: string }> {
    return this.provisionList(this.accountManagersListDefinition);
  }

  /**
   * Provision the Bookings list
   */
  async provisionBookingsList(): Promise<{ success: boolean; message: string }> {
    return this.provisionList(this.bookingsListDefinition);
  }

  /**
   * Provision the Clients list
   */
  async provisionClientsList(): Promise<{ success: boolean; message: string }> {
    return this.provisionList(this.clientsListDefinition);
  }

  /**
   * Provision the TeamMembers list
   */
  async provisionTeamMembersList(): Promise<{ success: boolean; message: string }> {
    return this.provisionList(this.teamMembersListDefinition);
  }

  /**
   * Provision the AuditLog list
   */
  async provisionAuditLogList(): Promise<{ success: boolean; message: string }> {
    return this.provisionList(this.auditLogListDefinition);
  }

  /**
   * Provision all required lists for the application
   */
  async provisionAllLists(): Promise<{ results: Array<{ list: string; success: boolean; message: string }> }> {
    const results: Array<{ list: string; success: boolean; message: string }> = [];

    const lists = [
      { name: 'AccountManagers', provision: () => this.provisionAccountManagersList() },
      { name: 'Bookings', provision: () => this.provisionBookingsList() },
      { name: 'Clients', provision: () => this.provisionClientsList() },
      { name: 'TeamMembers', provision: () => this.provisionTeamMembersList() },
      { name: 'AuditLog', provision: () => this.provisionAuditLogList() },
    ];

    for (const list of lists) {
      const result = await list.provision();
      results.push({ list: list.name, ...result });
    }

    return { results };
  }

  /**
   * Check which lists exist
   */
  async checkListsStatus(): Promise<Array<{ list: string; exists: boolean }>> {
    const listNames = ['AccountManagers', 'Bookings', 'Clients', 'TeamMembers', 'AuditLog'];
    const results: Array<{ list: string; exists: boolean }> = [];

    for (const name of listNames) {
      const exists = await this.listExists(name);
      results.push({ list: name, exists });
    }

    return results;
  }

  // ==================== DWX PROVISIONING METHODS ====================

  /**
   * Provision the DWxServices list (Service Catalog)
   */
  async provisionDWxServicesList(): Promise<{ success: boolean; message: string }> {
    return this.provisionList(this.dwxServicesListDefinition);
  }

  /**
   * Provision the DWxServiceRequests list (Sales Funnel)
   */
  async provisionDWxServiceRequestsList(): Promise<{ success: boolean; message: string }> {
    return this.provisionList(this.dwxServiceRequestsListDefinition);
  }

  /**
   * Provision the DWxClients list
   */
  async provisionDWxClientsList(): Promise<{ success: boolean; message: string }> {
    return this.provisionList(this.dwxClientsListDefinition);
  }

  /**
   * Provision the DWxSpecialists list
   */
  async provisionDWxSpecialistsList(): Promise<{ success: boolean; message: string }> {
    return this.provisionList(this.dwxSpecialistsListDefinition);
  }

  /**
   * Provision all DWx lists for the Traffic Manager application
   */
  async provisionAllDWxLists(): Promise<{ results: Array<{ list: string; success: boolean; message: string }> }> {
    const results: Array<{ list: string; success: boolean; message: string }> = [];

    const lists = [
      { name: 'DWxServices', provision: () => this.provisionDWxServicesList() },
      { name: 'DWxServiceRequests', provision: () => this.provisionDWxServiceRequestsList() },
      { name: 'DWxClients', provision: () => this.provisionDWxClientsList() },
      { name: 'DWxSpecialists', provision: () => this.provisionDWxSpecialistsList() },
    ];

    for (const list of lists) {
      const result = await list.provision();
      results.push({ list: list.name, ...result });
    }

    return { results };
  }

  /**
   * Check which DWx lists exist
   */
  async checkDWxListsStatus(): Promise<Array<{ list: string; exists: boolean }>> {
    const listNames = ['DWxServices', 'DWxServiceRequests', 'DWxClients', 'DWxSpecialists'];
    const results: Array<{ list: string; exists: boolean }> = [];

    for (const name of listNames) {
      const exists = await this.listExists(name);
      results.push({ list: name, exists });
    }

    return results;
  }

  /**
   * Seed the DWxServices list with default service catalog data
   */
  async seedDWxServicesData(): Promise<{ success: boolean; message: string; count: number }> {
    try {
      const token = await authService.getGraphToken();
      const digest = await this.getRequestDigest();
      const listName = 'DWxServices';

      // Check if list exists
      const exists = await this.listExists(listName);
      if (!exists) {
        return { success: false, message: 'DWxServices list does not exist. Please provision it first.', count: 0 };
      }

      // Check if list already has items
      const checkResponse = await fetch(
        `${this.siteUrl}/_api/web/lists/getbytitle('${listName}')/items?$top=1`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json;odata=verbose',
          },
        }
      );

      if (checkResponse.ok) {
        const checkData = await checkResponse.json();
        if (checkData.d.results.length > 0) {
          return { success: true, message: 'DWxServices list already has data. Skipping seed.', count: 0 };
        }
      }

      // Seed data
      const seedData = [
        {
          Title: 'Power Platform Development',
          Description: 'Custom Power Apps, Power Automate flows, Power BI dashboards, and Power Pages solutions tailored to your business needs.',
          ShortDescription: 'Custom Power Apps & Automation',
          Category: 'Power Platform',
          TypicalDuration: '2hr',
          ComplexityLevel: 'Medium',
          PricingModel: 'Project-based',
          BasePrice: 25000,
          RequiredRoles: JSON.stringify(['Solution Architect', 'Technical Specialist']),
          Prerequisites: 'M365 license with Power Platform access',
          IsActive: true,
          SortOrder: 1,
          IconName: 'LightningBolt',
        },
        {
          Title: 'SPFx Development',
          Description: 'Custom SharePoint Framework solutions including web parts, extensions, adaptive cards, and Teams apps integrated with SharePoint.',
          ShortDescription: 'Custom SharePoint & Teams Apps',
          Category: 'SPFx Development',
          TypicalDuration: '2hr',
          ComplexityLevel: 'High',
          PricingModel: 'Project-based',
          BasePrice: 35000,
          RequiredRoles: JSON.stringify(['Technical Specialist']),
          Prerequisites: 'SharePoint Online tenant with App Catalog',
          IsActive: true,
          SortOrder: 2,
          IconName: 'Code',
        },
        {
          Title: 'SharePoint Migration',
          Description: 'End-to-end migration services from on-premises SharePoint, file shares, or other platforms to SharePoint Online and OneDrive.',
          ShortDescription: 'Cloud Migration Services',
          Category: 'SharePoint Migration',
          TypicalDuration: 'Half-day',
          ComplexityLevel: 'High',
          PricingModel: 'Project-based',
          BasePrice: 50000,
          RequiredRoles: JSON.stringify(['Solution Architect', 'Technical Specialist']),
          Prerequisites: 'Source environment access, target M365 tenant',
          IsActive: true,
          SortOrder: 3,
          IconName: 'CloudArrowUp',
        },
        {
          Title: 'M365 Tenant Assessment',
          Description: 'Comprehensive assessment of your Microsoft 365 environment including security, compliance, governance, and adoption recommendations.',
          ShortDescription: 'Environment Health Check',
          Category: 'M365 Assessment',
          TypicalDuration: 'Full-day',
          ComplexityLevel: 'Medium',
          PricingModel: 'Fixed',
          BasePrice: 15000,
          RequiredRoles: JSON.stringify(['Solution Architect']),
          Prerequisites: 'Global Admin or Reports Reader access',
          IsActive: true,
          SortOrder: 4,
          IconName: 'ShieldCheckmark',
        },
        {
          Title: 'Enterprise Copilot Agents',
          Description: 'Design and implementation of Microsoft Copilot agents for enterprise scenarios including custom plugins, knowledge bases, and workflow automation.',
          ShortDescription: 'AI-Powered Copilot Solutions',
          Category: 'Copilot Agents',
          TypicalDuration: '2hr',
          ComplexityLevel: 'Enterprise',
          PricingModel: 'Project-based',
          BasePrice: 75000,
          RequiredRoles: JSON.stringify(['Solution Architect', 'Technical Specialist']),
          Prerequisites: 'Copilot license, Azure subscription for custom plugins',
          IsActive: true,
          SortOrder: 5,
          IconName: 'Bot',
        },
        {
          Title: 'Microsoft Viva Suite',
          Description: 'Implementation of Microsoft Viva modules including Viva Connections, Viva Engage, Viva Learning, Viva Insights, and Viva Goals for employee experience.',
          ShortDescription: 'Employee Experience Platform',
          Category: 'MS Viva',
          TypicalDuration: 'Half-day',
          ComplexityLevel: 'Medium',
          PricingModel: 'Project-based',
          BasePrice: 40000,
          RequiredRoles: JSON.stringify(['Solution Architect', 'Consultant']),
          Prerequisites: 'Viva license, SharePoint home site configured',
          IsActive: true,
          SortOrder: 6,
          IconName: 'PeopleTeam',
        },
        {
          Title: 'Tender Response Services',
          Description: 'Professional tender response services including RFP/RFI analysis, solution design, pricing, and documentation for Microsoft technology opportunities.',
          ShortDescription: 'RFP/RFI Response Support',
          Category: 'Tenders',
          TypicalDuration: 'Multi-day',
          ComplexityLevel: 'High',
          PricingModel: 'Project-based',
          BasePrice: 30000,
          RequiredRoles: JSON.stringify(['Solution Architect', 'Pre-Sales Consultant']),
          Prerequisites: 'Tender documentation, deadline requirements',
          IsActive: true,
          SortOrder: 7,
          IconName: 'DocumentBriefcase',
        },
        {
          Title: 'Proposal Development',
          Description: 'End-to-end proposal development services including scoping, solution architecture, effort estimation, risk assessment, and professional documentation.',
          ShortDescription: 'Solution Proposals & Quotes',
          Category: 'Proposals',
          TypicalDuration: 'Half-day',
          ComplexityLevel: 'Medium',
          PricingModel: 'Fixed',
          BasePrice: 10000,
          RequiredRoles: JSON.stringify(['Solution Architect', 'Pre-Sales Consultant']),
          Prerequisites: 'Client requirements gathered, discovery completed',
          IsActive: true,
          SortOrder: 8,
          IconName: 'Document',
        },
        {
          Title: 'Pre-Sales Discovery',
          Description: 'Initial discovery and requirements gathering sessions to understand client needs, assess technical environment, and recommend appropriate Microsoft solutions.',
          ShortDescription: 'Discovery & Requirements',
          Category: 'Pre-Sales',
          TypicalDuration: '2hr',
          ComplexityLevel: 'Low',
          PricingModel: 'Fixed',
          BasePrice: 5000,
          RequiredRoles: JSON.stringify(['Solution Architect', 'Pre-Sales Consultant']),
          Prerequisites: 'Initial contact established, basic company info available',
          IsActive: true,
          SortOrder: 9,
          IconName: 'Search',
        },
        {
          Title: 'Ad-Hoc Support',
          Description: 'On-demand technical support and consulting services for existing Microsoft 365 environments including troubleshooting, guidance, and best practice advice.',
          ShortDescription: 'On-Demand Technical Help',
          Category: 'Ad-Hoc Support',
          TypicalDuration: '1hr',
          ComplexityLevel: 'Low',
          PricingModel: 'Hourly',
          BasePrice: 2500,
          RequiredRoles: JSON.stringify(['Technical Specialist', 'Consultant']),
          Prerequisites: 'Active M365 subscription, issue description',
          IsActive: true,
          SortOrder: 10,
          IconName: 'PersonSupport',
        },
      ];

      let createdCount = 0;
      for (const item of seedData) {
        const response = await fetch(
          `${this.siteUrl}/_api/web/lists/getbytitle('${listName}')/items`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/json;odata=verbose',
              'Content-Type': 'application/json;odata=verbose',
              'X-RequestDigest': digest,
            },
            body: JSON.stringify({
              __metadata: { type: 'SP.Data.DWxServicesListItem' },
              ...item,
            }),
          }
        );

        if (response.ok) {
          createdCount++;
        } else {
          console.error(`[Provisioning] Failed to create service: ${item.Title}`, await response.text());
        }
      }

      return { success: true, message: `Seeded ${createdCount} services to DWxServices`, count: createdCount };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to seed DWxServices',
        count: 0,
      };
    }
  }

  /**
   * Complete DWx setup: provision lists and seed initial data
   */
  async setupDWxTrafficManager(): Promise<{
    lists: { results: Array<{ list: string; success: boolean; message: string }> };
    seed: { success: boolean; message: string; count: number };
  }> {
    const lists = await this.provisionAllDWxLists();
    const seed = await this.seedDWxServicesData();
    return { lists, seed };
  }

  // ==================== LPDEMOSCHEDULER FORMATTING ====================

  /**
   * Apply formatting to the existing LPDemoScheduler list
   */
  async applyLPDemoSchedulerFormatting(): Promise<{ results: Array<{ item: string; success: boolean; message: string }> }> {
    const results: Array<{ item: string; success: boolean; message: string }> = [];
    const listName = 'LPDemoScheduler';

    // Status column formatter - colored pills
    const statusFormatter = {
      $schema: 'https://developer.microsoft.com/json-schemas/sp/v2/column-formatting.schema.json',
      elmType: 'div',
      style: {
        display: 'flex',
        'align-items': 'center',
      },
      children: [
        {
          elmType: 'span',
          style: {
            padding: '4px 12px',
            'border-radius': '16px',
            'font-size': '12px',
            'font-weight': '600',
            'background-color': {
              operator: '?',
              operands: [
                { operator: '==', operands: ['[$Status]', 'Pending Review'] },
                '#fff4ce',
                {
                  operator: '?',
                  operands: [
                    { operator: '==', operands: ['[$Status]', 'Awaiting Approval'] },
                    '#dff6dd',
                    {
                      operator: '?',
                      operands: [
                        { operator: '==', operands: ['[$Status]', 'Confirmed'] },
                        '#d0e7ff',
                        {
                          operator: '?',
                          operands: [
                            { operator: '==', operands: ['[$Status]', 'Cancelled'] },
                            '#fde7e9',
                            {
                              operator: '?',
                              operands: [
                                { operator: '==', operands: ['[$Status]', 'Rescheduling Required'] },
                                '#e8daef',
                                '#f0f0f0',
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            color: {
              operator: '?',
              operands: [
                { operator: '==', operands: ['[$Status]', 'Pending Review'] },
                '#7a6400',
                {
                  operator: '?',
                  operands: [
                    { operator: '==', operands: ['[$Status]', 'Awaiting Approval'] },
                    '#107c10',
                    {
                      operator: '?',
                      operands: [
                        { operator: '==', operands: ['[$Status]', 'Confirmed'] },
                        '#0078d4',
                        {
                          operator: '?',
                          operands: [
                            { operator: '==', operands: ['[$Status]', 'Cancelled'] },
                            '#a80000',
                            {
                              operator: '?',
                              operands: [
                                { operator: '==', operands: ['[$Status]', 'Rescheduling Required'] },
                                '#5b2d90',
                                '#333333',
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          },
          txtContent: '[$Status]',
        },
      ],
    };

    const statusResult = await this.applyColumnFormatting(listName, 'Status', statusFormatter);
    results.push({ item: 'Status Column', ...statusResult });

    // Premium client formatter - star icon
    const premiumFormatter = {
      $schema: 'https://developer.microsoft.com/json-schemas/sp/v2/column-formatting.schema.json',
      elmType: 'div',
      style: {
        display: 'flex',
        'align-items': 'center',
        'justify-content': 'center',
      },
      children: [
        {
          elmType: 'span',
          attributes: {
            iconName: {
              operator: '?',
              operands: ['@currentField', 'FavoriteStarFill', ''],
            },
          },
          style: {
            color: {
              operator: '?',
              operands: ['@currentField', '#ffb900', '#ccc'],
            },
            'font-size': '18px',
          },
        },
      ],
    };

    const premiumResult = await this.applyColumnFormatting(listName, 'IsPremiumClient', premiumFormatter);
    results.push({ item: 'Premium Client Column', ...premiumResult });

    // Booking type formatter - icons
    const bookingTypeFormatter = {
      $schema: 'https://developer.microsoft.com/json-schemas/sp/v2/column-formatting.schema.json',
      elmType: 'div',
      style: {
        display: 'flex',
        'align-items': 'center',
        gap: '8px',
      },
      children: [
        {
          elmType: 'span',
          attributes: {
            iconName: {
              operator: '?',
              operands: [
                { operator: '==', operands: ['@currentField', 'Demo'] },
                'Play',
                {
                  operator: '?',
                  operands: [
                    { operator: '==', operands: ['@currentField', 'Deployment'] },
                    'Rocket',
                    'Calendar',
                  ],
                },
              ],
            },
          },
          style: {
            color: {
              operator: '?',
              operands: [
                { operator: '==', operands: ['@currentField', 'Demo'] },
                '#0078d4',
                {
                  operator: '?',
                  operands: [
                    { operator: '==', operands: ['@currentField', 'Deployment'] },
                    '#107c10',
                    '#666',
                  ],
                },
              ],
            },
          },
        },
        {
          elmType: 'span',
          txtContent: '@currentField',
        },
      ],
    };

    const typeResult = await this.applyColumnFormatting(listName, 'BookingType', bookingTypeFormatter);
    results.push({ item: 'Booking Type Column', ...typeResult });

    return { results };
  }

  /**
   * Apply Gallery/Card view formatting to LPDemoScheduler default view
   * This controls how items appear in the Gallery (card) layout
   */
  async applyLPDemoSchedulerGalleryFormatting(): Promise<{ success: boolean; message: string }> {
    try {
      const token = await authService.getGraphToken();
      const digest = await this.getRequestDigest();
      const listName = 'LPDemoScheduler';

      // Get the default view
      const viewResponse = await fetch(
        `${this.siteUrl}/_api/web/lists/getbytitle('${listName}')/defaultview`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json;odata=verbose',
          },
        }
      );

      if (!viewResponse.ok) {
        throw new Error('Failed to get default view');
      }

      const viewData = await viewResponse.json();
      const viewId = viewData.d.Id;

      // Gallery/Tile formatter for card layout
      // Note: The CustomFormatter should contain this object directly (not wrapped in tileFormatter)
      const galleryFormatter = {
        '$schema': 'https://developer.microsoft.com/json-schemas/sp/v2/tile-formatting.schema.json',
        height: 180,
        width: 320,
        hideSelection: false,
        formatter: {
          elmType: 'div',
          style: {
            display: 'flex',
            'flex-direction': 'column',
            'background-color': '#ffffff',
            'border-radius': '8px',
            'box-shadow': '0 2px 4px rgba(0,0,0,0.1)',
            overflow: 'hidden',
            height: '100%',
            'border-left': {
              operator: '?',
              operands: [
                { operator: '==', operands: ['[$Status]', 'Confirmed'] },
                '4px solid #107c10',
                {
                  operator: '?',
                  operands: [
                    { operator: '==', operands: ['[$Status]', 'Cancelled'] },
                    '4px solid #d13438',
                    {
                      operator: '?',
                      operands: [
                        { operator: '==', operands: ['[$Status]', 'Pending Review'] },
                        '4px solid #f7630c',
                        '4px solid #0078d4',
                      ],
                    },
                  ],
                },
              ],
            },
          },
          children: [
            // Header section with client name and status
            {
              elmType: 'div',
              style: {
                display: 'flex',
                'justify-content': 'space-between',
                'align-items': 'flex-start',
                padding: '12px 12px 8px 12px',
                gap: '8px',
              },
              children: [
                // Client name
                {
                  elmType: 'div',
                  style: {
                    'font-size': '14px',
                    'font-weight': '600',
                    color: '#242424',
                    overflow: 'hidden',
                    'text-overflow': 'ellipsis',
                    'white-space': 'nowrap',
                    flex: '1',
                  },
                  txtContent: '[$ClientName]',
                },
                // Premium star
                {
                  elmType: 'span',
                  style: {
                    display: {
                      operator: '?',
                      operands: ['[$IsPremiumClient]', 'inline', 'none'],
                    },
                    color: '#ffb900',
                    'font-size': '16px',
                  },
                  attributes: {
                    iconName: 'FavoriteStarFill',
                    title: 'Premium Client',
                  },
                },
              ],
            },
            // Badges row (booking type + status)
            {
              elmType: 'div',
              style: {
                display: 'flex',
                gap: '6px',
                padding: '0 12px 8px 12px',
                'flex-wrap': 'wrap',
              },
              children: [
                // Booking type badge
                {
                  elmType: 'div',
                  style: {
                    display: 'flex',
                    'align-items': 'center',
                    gap: '4px',
                    padding: '2px 8px',
                    'border-radius': '4px',
                    'background-color': '#f5f5f5',
                    'font-size': '11px',
                    color: '#616161',
                  },
                  children: [
                    {
                      elmType: 'span',
                      style: {
                        color: {
                          operator: '?',
                          operands: [
                            { operator: '==', operands: ['[$BookingType]', 'Demo'] },
                            '#0078d4',
                            '#107c10',
                          ],
                        },
                      },
                      attributes: {
                        iconName: {
                          operator: '?',
                          operands: [
                            { operator: '==', operands: ['[$BookingType]', 'Demo'] },
                            'Play',
                            'Rocket',
                          ],
                        },
                      },
                    },
                    {
                      elmType: 'span',
                      txtContent: '[$BookingType]',
                    },
                  ],
                },
                // Status badge
                {
                  elmType: 'div',
                  style: {
                    padding: '2px 8px',
                    'border-radius': '10px',
                    'font-size': '11px',
                    'font-weight': '600',
                    'background-color': {
                      operator: '?',
                      operands: [
                        { operator: '==', operands: ['[$Status]', 'Confirmed'] },
                        '#dff6dd',
                        {
                          operator: '?',
                          operands: [
                            { operator: '==', operands: ['[$Status]', 'Cancelled'] },
                            '#fde7e9',
                            {
                              operator: '?',
                              operands: [
                                { operator: '==', operands: ['[$Status]', 'Pending Review'] },
                                '#fff4ce',
                                '#deecf9',
                              ],
                            },
                          ],
                        },
                      ],
                    },
                    color: {
                      operator: '?',
                      operands: [
                        { operator: '==', operands: ['[$Status]', 'Confirmed'] },
                        '#107c10',
                        {
                          operator: '?',
                          operands: [
                            { operator: '==', operands: ['[$Status]', 'Cancelled'] },
                            '#d13438',
                            {
                              operator: '?',
                              operands: [
                                { operator: '==', operands: ['[$Status]', 'Pending Review'] },
                                '#7a6400',
                                '#0078d4',
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  },
                  txtContent: '[$Status]',
                },
              ],
            },
            // Details section
            {
              elmType: 'div',
              style: {
                display: 'flex',
                'flex-direction': 'column',
                gap: '4px',
                padding: '8px 12px',
                'border-top': '1px solid #edebe9',
                flex: '1',
              },
              children: [
                // Account Manager
                {
                  elmType: 'div',
                  style: {
                    display: 'flex',
                    'align-items': 'center',
                    gap: '6px',
                    'font-size': '12px',
                    color: '#616161',
                  },
                  children: [
                    {
                      elmType: 'span',
                      attributes: { iconName: 'Contact' },
                      style: { 'font-size': '12px' },
                    },
                    {
                      elmType: 'span',
                      txtContent: '[$AccountManagerName]',
                    },
                  ],
                },
                // Date
                {
                  elmType: 'div',
                  style: {
                    display: 'flex',
                    'align-items': 'center',
                    gap: '6px',
                    'font-size': '12px',
                    color: '#616161',
                  },
                  children: [
                    {
                      elmType: 'span',
                      attributes: { iconName: 'Calendar' },
                      style: { 'font-size': '12px' },
                    },
                    {
                      elmType: 'span',
                      txtContent: {
                        operator: '?',
                        operands: [
                          '[$ConfirmedDateTime]',
                          '=toLocaleDateString([$ConfirmedDateTime])',
                          '=toLocaleDateString([$ProposedSlot1])',
                        ],
                      },
                    },
                  ],
                },
                // License count
                {
                  elmType: 'div',
                  style: {
                    display: 'flex',
                    'align-items': 'center',
                    gap: '6px',
                    'font-size': '12px',
                    color: '#616161',
                  },
                  children: [
                    {
                      elmType: 'span',
                      attributes: { iconName: 'Badge' },
                      style: { 'font-size': '12px' },
                    },
                    {
                      elmType: 'span',
                      txtContent: "=[$LicenseCount] + ' licenses'",
                    },
                  ],
                },
              ],
            },
          ],
        },
      };

      // Apply the gallery formatter to the default view
      // The CustomFormatter property should contain the formatter object directly
      const updateResponse = await fetch(
        `${this.siteUrl}/_api/web/lists/getbytitle('${listName}')/views('${viewId}')`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json;odata=verbose',
            'Content-Type': 'application/json;odata=verbose',
            'X-RequestDigest': digest,
            'IF-MATCH': '*',
            'X-HTTP-Method': 'MERGE',
          },
          body: JSON.stringify({
            __metadata: { type: 'SP.View' },
            CustomFormatter: JSON.stringify(galleryFormatter),
          }),
        }
      );

      if (!updateResponse.ok) {
        throw new Error(await updateResponse.text());
      }

      return { success: true, message: 'Gallery card formatting applied to default view' };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to apply gallery formatting',
      };
    }
  }

  /**
   * Create custom views for LPDemoScheduler list
   */
  async createLPDemoSchedulerViews(): Promise<{ results: Array<{ item: string; success: boolean; message: string }> }> {
    const results: Array<{ item: string; success: boolean; message: string }> = [];
    const listName = 'LPDemoScheduler';

    // Pending Bookings View
    const pendingView: ViewDefinition = {
      title: 'Pending Bookings',
      viewFields: ['Title', 'ClientName', 'BookingType', 'Status', 'ProposedSlot1', 'AccountManagerName', 'IsPremiumClient'],
      query: '<Where><Eq><FieldRef Name="Status" /><Value Type="Choice">Pending Review</Value></Eq></Where><OrderBy><FieldRef Name="Created" Ascending="FALSE" /></OrderBy>',
      rowLimit: 50,
    };
    const pendingResult = await this.createCustomView(listName, pendingView);
    results.push({ item: 'Pending Bookings View', ...pendingResult });

    // Confirmed Bookings View
    const confirmedView: ViewDefinition = {
      title: 'Confirmed Bookings',
      viewFields: ['Title', 'ClientName', 'BookingType', 'ConfirmedDateTime', 'AccountManagerName', 'IsPremiumClient'],
      query: '<Where><Eq><FieldRef Name="Status" /><Value Type="Choice">Confirmed</Value></Eq></Where><OrderBy><FieldRef Name="ConfirmedDateTime" Ascending="TRUE" /></OrderBy>',
      rowLimit: 50,
    };
    const confirmedResult = await this.createCustomView(listName, confirmedView);
    results.push({ item: 'Confirmed Bookings View', ...confirmedResult });

    // Premium Clients View
    const premiumView: ViewDefinition = {
      title: 'Premium Clients',
      viewFields: ['Title', 'ClientName', 'BookingType', 'Status', 'ProposedSlot1', 'AccountManagerName'],
      query: '<Where><Eq><FieldRef Name="IsPremiumClient" /><Value Type="Boolean">1</Value></Eq></Where><OrderBy><FieldRef Name="Created" Ascending="FALSE" /></OrderBy>',
      rowLimit: 50,
    };
    const premiumResult = await this.createCustomView(listName, premiumView);
    results.push({ item: 'Premium Clients View', ...premiumResult });

    // This Week View
    const thisWeekView: ViewDefinition = {
      title: 'This Week',
      viewFields: ['Title', 'ClientName', 'BookingType', 'Status', 'ProposedSlot1', 'ConfirmedDateTime', 'AccountManagerName'],
      query: '<Where><And><Geq><FieldRef Name="ProposedSlot1" /><Value Type="DateTime"><Today /></Value></Geq><Leq><FieldRef Name="ProposedSlot1" /><Value Type="DateTime"><Today OffsetDays="7" /></Value></Leq></And></Where><OrderBy><FieldRef Name="ProposedSlot1" Ascending="TRUE" /></OrderBy>',
      rowLimit: 100,
    };
    const weekResult = await this.createCustomView(listName, thisWeekView);
    results.push({ item: 'This Week View', ...weekResult });

    // By Account Manager View (grouped)
    const byAMView: ViewDefinition = {
      title: 'By Account Manager',
      viewFields: ['Title', 'ClientName', 'BookingType', 'Status', 'ProposedSlot1'],
      query: '<OrderBy><FieldRef Name="AccountManagerName" Ascending="TRUE" /><FieldRef Name="Created" Ascending="FALSE" /></OrderBy>',
      rowLimit: 100,
    };
    const amResult = await this.createCustomView(listName, byAMView);
    results.push({ item: 'By Account Manager View', ...amResult });

    return { results };
  }

  /**
   * Apply all formatting and views to LPDemoScheduler
   */
  async setupLPDemoScheduler(): Promise<{
    formatting: { results: Array<{ item: string; success: boolean; message: string }> };
    views: { results: Array<{ item: string; success: boolean; message: string }> };
  }> {
    const formatting = await this.applyLPDemoSchedulerFormatting();
    const views = await this.createLPDemoSchedulerViews();
    return { formatting, views };
  }
}

export const sharePointProvisioningService = new SharePointProvisioningService();
