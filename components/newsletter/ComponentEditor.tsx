"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronUp } from "lucide-react"
import type { DataSource, NewsletterComponent } from "@/types/newsletter"

interface ComponentEditorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  component?: NewsletterComponent | null
  dataSources: DataSource[]
  onSave: (component: Omit<NewsletterComponent, "id" | "dataSource">) => void
  onCancel?: () => void
}

const COMPONENT_TYPES = [
  { value: "data", label: "Data Source", description: "Pulls content from a configured data source" },
  { value: "static", label: "Static Content", description: "Custom HTML/text content" },
  { value: "system", label: "System", description: "Built-in components like header, footer" },
]

const LAYOUT_OPTIONS = [
  { value: "list", label: "List" },
  { value: "cards", label: "Cards" },
  { value: "grid", label: "Grid" },
  { value: "featured", label: "Featured" },
]

export function ComponentEditor({
  open,
  onOpenChange,
  component,
  dataSources,
  onSave,
  onCancel,
}: ComponentEditorProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [type, setType] = useState<"data" | "static" | "system">("data")
  const [dataSourceId, setDataSourceId] = useState<string>("")
  const [maxItems, setMaxItems] = useState<number>(5)
  const [layout, setLayout] = useState<string>("list")
  const [optionsOpen, setOptionsOpen] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Reset form when dialog opens/closes or component changes
  useEffect(() => {
    if (open && component) {
      setName(component.name)
      setDescription(component.description || "")
      setType(component.type)
      setDataSourceId(component.dataSourceId || "")
      setMaxItems(component.displayOptions?.maxItems ?? 5)
      setLayout(component.displayOptions?.layout || "list")
    } else if (open && !component) {
      // Reset for new component
      setName("")
      setDescription("")
      setType("data")
      setDataSourceId("")
      setMaxItems(5)
      setLayout("list")
    }
    setErrors({})
  }, [open, component])

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!name.trim()) {
      newErrors.name = "Name is required"
    }

    if (type === "data" && !dataSourceId) {
      newErrors.dataSourceId = "Data source is required for data components"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = () => {
    if (!validate()) return

    onSave({
      name: name.trim(),
      description: description.trim() || null,
      type,
      dataSourceId: type === "data" ? dataSourceId : null,
      displayOptions: type === "data" ? {
        maxItems,
        layout,
      } : null,
    })
  }

  const handleCancel = () => {
    onCancel?.()
    onOpenChange(false)
  }

  const isEditing = !!component?.id

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Component" : "Add Component"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the component configuration"
              : "Create a new newsletter component"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Top AI News, Weekly Recipe"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Component Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMPONENT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    <div>
                      <span>{t.label}</span>
                      <span className="ml-2 text-xs text-muted-foreground">{t.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {type === "data" && (
            <div className="space-y-2">
              <Label htmlFor="dataSource">Data Source *</Label>
              <Select value={dataSourceId} onValueChange={setDataSourceId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a data source" />
                </SelectTrigger>
                <SelectContent>
                  {dataSources.map((ds) => (
                    <SelectItem key={ds.id} value={ds.id}>
                      {ds.name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                      {ds.tableName && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          ({ds.tableName})
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.dataSourceId && (
                <p className="text-sm text-destructive">{errors.dataSourceId}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">Description (internal)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional notes about this component"
              rows={2}
            />
          </div>

          {type === "data" && (
            <Collapsible open={optionsOpen} onOpenChange={setOptionsOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 p-0 h-auto">
                  {optionsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  <span className="text-sm font-medium">Display Options</span>
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="maxItems">Max Items</Label>
                    <Input
                      id="maxItems"
                      type="number"
                      min={1}
                      max={20}
                      value={maxItems}
                      onChange={(e) => setMaxItems(parseInt(e.target.value) || 5)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="layout">Layout</Label>
                    <Select value={layout} onValueChange={setLayout}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LAYOUT_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {isEditing ? "Save Changes" : "Add Component"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
