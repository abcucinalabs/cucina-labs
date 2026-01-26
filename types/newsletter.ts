export interface DataSource {
  id: string
  name: string
  type: string
  tableName: string | null
}

export interface NewsletterComponent {
  id: string
  name: string
  description?: string | null
  type: "data" | "static" | "system"
  dataSourceId?: string | null
  dataSource?: DataSource | null
  displayOptions?: {
    maxItems?: number
    layout?: string
    fieldMap?: Record<string, string>
  } | null
}

export interface LayoutItem {
  id: string
  componentId: string
  order: number
}
