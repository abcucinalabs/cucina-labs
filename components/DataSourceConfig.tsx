"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Database, RefreshCw, ChevronDown, ChevronUp, AlertCircle, CheckCircle2, Clock } from "lucide-react"

interface DataSource {
  id: string
  name: string
  type: string
  tableId: string | null
  tableName: string | null
  viewId: string | null
  viewName: string | null
  fieldMapping: Record<string, string> | null
  syncStatus: string
  lastSyncAt: string | null
}

interface DataSourceConfigProps {
  name: string
  displayName: string
  description: string
  requiredFields?: { id: string; name: string; description?: string }[]
}

export function DataSourceConfig({ name, displayName, description, requiredFields = [] }: DataSourceConfigProps) {
  const [dataSource, setDataSource] = useState<DataSource | null>(null)
  const [airtableConfig, setAirtableConfig] = useState<{ baseId: string; baseName: string } | null>(null)
  const [tables, setTables] = useState<{ id: string; name: string }[]>([])
  const [views, setViews] = useState<{ id: string; name: string; type: string }[]>([])
  const [fields, setFields] = useState<{ id: string; name: string; type: string }[]>([])
  const [selectedTable, setSelectedTable] = useState<string>("")
  const [selectedView, setSelectedView] = useState<string>("")
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({})
  const [isLoadingTables, setIsLoadingTables] = useState(false)
  const [isLoadingViews, setIsLoadingViews] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [mappingOpen, setMappingOpen] = useState(false)

  const fetchAirtableConfig = async () => {
    try {
      const response = await fetch("/api/integrations")
      if (response.ok) {
        const data = await response.json()
        if (data.airtable?.airtableBaseId) {
          setAirtableConfig({
            baseId: data.airtable.airtableBaseId,
            baseName: data.airtable.airtableBaseName || "Unknown Base",
          })
        }
      }
    } catch (error) {
      console.error("Failed to fetch Airtable config:", error)
    }
  }

  const fetchDataSource = async () => {
    try {
      const response = await fetch("/api/data-sources")
      if (response.ok) {
        const sources: DataSource[] = await response.json()
        const source = sources.find((s) => s.name === name)
        if (source) {
          setDataSource(source)
          setSelectedTable(source.tableId || "")
          setSelectedView(source.viewId || "")
          setFieldMapping(source.fieldMapping || {})
        }
      }
    } catch (error) {
      console.error("Failed to fetch data source:", error)
    }
  }

  const fetchTables = async (baseId: string) => {
    setIsLoadingTables(true)
    try {
      const response = await fetch("/api/airtable/tables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: "USE_STORED_KEY", baseId }),
      })
      if (response.ok) {
        const data = await response.json()
        setTables(data.tables || [])
      }
    } catch (error) {
      console.error("Failed to fetch tables:", error)
    } finally {
      setIsLoadingTables(false)
    }
  }

  const fetchViews = async (baseId: string, tableId: string) => {
    setIsLoadingViews(true)
    try {
      const response = await fetch("/api/airtable/views", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: "USE_STORED_KEY", baseId, tableId }),
      })
      if (response.ok) {
        const data = await response.json()
        setViews(data.views || [])
        setFields(data.fields || [])
      }
    } catch (error) {
      console.error("Failed to fetch views:", error)
    } finally {
      setIsLoadingViews(false)
    }
  }

  useEffect(() => {
    fetchAirtableConfig()
    fetchDataSource()
  }, [])

  // Fetch tables when airtableConfig is loaded
  useEffect(() => {
    if (airtableConfig?.baseId) {
      fetchTables(airtableConfig.baseId)
    }
  }, [airtableConfig])

  // Fetch views when table is selected
  useEffect(() => {
    if (selectedTable && airtableConfig?.baseId) {
      fetchViews(airtableConfig.baseId, selectedTable)
    }
  }, [selectedTable, airtableConfig])

  const handleTableChange = (tableId: string) => {
    setSelectedTable(tableId)
    setSelectedView("")
    setFieldMapping({})
  }

  const handleFieldMappingChange = (fieldId: string, airtableField: string) => {
    setFieldMapping((prev) => ({
      ...prev,
      [fieldId]: airtableField,
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const tableName = tables.find((t) => t.id === selectedTable)?.name
      const viewName = views.find((v) => v.id === selectedView)?.name

      const payload = {
        name,
        type: "airtable",
        tableId: selectedTable || null,
        tableName: tableName || null,
        viewId: selectedView || null,
        viewName: viewName || null,
        fieldMapping: Object.keys(fieldMapping).length > 0 ? fieldMapping : null,
      }

      if (dataSource) {
        await fetch(`/api/data-sources/${dataSource.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      } else {
        const response = await fetch("/api/data-sources", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (response.ok) {
          const newSource = await response.json()
          setDataSource(newSource)
        }
      }
      alert("Configuration saved!")
    } catch (error) {
      console.error("Failed to save:", error)
      alert("Failed to save configuration")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSync = async () => {
    if (!dataSource) return
    setIsSyncing(true)
    try {
      await fetch(`/api/data-sources/${dataSource.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ syncStatus: "syncing" }),
      })
      // TODO: Implement actual sync logic
      await new Promise((resolve) => setTimeout(resolve, 1500))
      await fetch(`/api/data-sources/${dataSource.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ syncStatus: "success" }),
      })
      fetchDataSource()
      alert("Sync completed!")
    } catch (error) {
      console.error("Failed to sync:", error)
      await fetch(`/api/data-sources/${dataSource.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ syncStatus: "error" }),
      })
      alert("Sync failed")
    } finally {
      setIsSyncing(false)
    }
  }

  const getSyncStatusBadge = () => {
    if (!dataSource?.syncStatus || dataSource.syncStatus === "idle") {
      return <Badge variant="secondary">Not synced</Badge>
    }
    switch (dataSource.syncStatus) {
      case "syncing":
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
            Syncing
          </Badge>
        )
      case "success":
        return (
          <Badge variant="outline" className="text-green-600 border-green-600">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Synced
          </Badge>
        )
      case "error":
        return (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" />
            Error
          </Badge>
        )
      default:
        return <Badge variant="secondary">{dataSource.syncStatus}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                {displayName}
              </CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {getSyncStatusBadge()}
              {dataSource?.lastSyncAt && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(dataSource.lastSyncAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!airtableConfig ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please configure your Airtable integration in Settings first, including selecting a base.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="text-sm text-muted-foreground">
                Base: <span className="font-medium text-foreground">{airtableConfig.baseName}</span>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Table</Label>
                  <Select
                    value={selectedTable || undefined}
                    onValueChange={handleTableChange}
                    disabled={isLoadingTables}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={isLoadingTables ? "Loading tables..." : "Select a table"} />
                    </SelectTrigger>
                    <SelectContent>
                      {tables.map((table) => (
                        <SelectItem key={table.id} value={table.id}>
                          {table.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>View (optional)</Label>
                  <Select
                    value={selectedView || "__none__"}
                    onValueChange={(v) => setSelectedView(v === "__none__" ? "" : v)}
                    disabled={!selectedTable || isLoadingViews}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={isLoadingViews ? "Loading views..." : "Select a view"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">No specific view</SelectItem>
                      {views.map((view) => (
                        <SelectItem key={view.id} value={view.id}>
                          {view.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedTable && fields.length > 0 && requiredFields.length > 0 && (
                <Collapsible open={mappingOpen} onOpenChange={setMappingOpen}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2 p-0 h-auto">
                      {mappingOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      <span className="text-sm font-medium">Field Mapping</span>
                      <span className="text-xs text-muted-foreground">
                        ({Object.keys(fieldMapping).filter((k) => fieldMapping[k]).length}/{requiredFields.length} mapped)
                      </span>
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-4">
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-1/3">Field</TableHead>
                            <TableHead className="w-1/3">Description</TableHead>
                            <TableHead className="w-1/3">Airtable Column</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {requiredFields.map((field) => (
                            <TableRow key={field.id}>
                              <TableCell className="font-medium">{field.name}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">{field.description || "-"}</TableCell>
                              <TableCell>
                                <Select
                                  value={fieldMapping[field.id] || "__none__"}
                                  onValueChange={(value) => handleFieldMappingChange(field.id, value === "__none__" ? "" : value)}
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select column" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="__none__">Not mapped</SelectItem>
                                    {fields.map((f) => (
                                      <SelectItem key={f.id} value={f.name}>
                                        {f.name} ({f.type})
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end pt-2">
                <Button
                  variant="outline"
                  onClick={handleSync}
                  disabled={!dataSource?.tableId || isSyncing}
                  isLoading={isSyncing}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync Now
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!selectedTable || isSaving}
                  isLoading={isSaving}
                >
                  Save Configuration
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
