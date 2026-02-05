"use client"

import { useDroppable } from "@dnd-kit/core"
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { GripVertical, X, Database, FileText, Cog, LayoutTemplate } from "lucide-react"
import type { NewsletterComponent, LayoutItem } from "@/types/newsletter"

interface LayoutCanvasProps {
  layout: LayoutItem[]
  components: NewsletterComponent[]
  onRemoveItem: (instanceId: string) => void
}

function SortableItem({
  item,
  component,
  onRemove,
}: {
  item: LayoutItem
  component: NewsletterComponent | undefined
  onRemove: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    data: {
      type: "layout-item",
      item,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const getTypeIcon = () => {
    if (!component) return null
    switch (component.type) {
      case "data":
        return <Database className="h-4 w-4" />
      case "static":
        return <FileText className="h-4 w-4" />
      case "system":
        return <Cog className="h-4 w-4" />
    }
  }

  if (!component) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="p-3 rounded-lg border border-destructive/50 bg-destructive/5 text-destructive"
      >
        <span className="text-sm">Component not found</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 ml-2"
          onClick={onRemove}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group flex items-center gap-3 p-4 rounded-lg border-2 border-dashed border-border bg-card hover:border-primary/50 transition-colors"
    >
      <button
        {...attributes}
        {...listeners}
        className="touch-none text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="h-5 w-5" />
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {getTypeIcon()}
          <span className="font-medium">{component.name}</span>
        </div>
        {component.dataSource && (
          <p className="text-sm text-muted-foreground mt-1">
            Source: {component.dataSource.name.replace(/_/g, " ")}
            {component.displayOptions?.maxItems && ` • ${component.displayOptions.maxItems} items`}
            {component.displayOptions?.layout && ` • ${component.displayOptions.layout} layout`}
          </p>
        )}
      </div>

      <Badge variant="outline" className="text-xs">
        #{item.order + 1}
      </Badge>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
        onClick={onRemove}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}

export function LayoutCanvas({
  layout,
  components,
  onRemoveItem,
}: LayoutCanvasProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: "layout-canvas",
  })

  const getComponentById = (componentId: string) =>
    components.find((c) => c.id === componentId)

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0 pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <LayoutTemplate className="h-4 w-4" />
          Newsletter Layout
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-4 pt-0">
        <SortableContext
          items={layout.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <div
            ref={setNodeRef}
            className={`min-h-[200px] space-y-3 p-4 rounded-lg border-2 border-dashed transition-colors ${
              isOver
                ? "border-primary bg-primary/5"
                : layout.length === 0
                  ? "border-muted-foreground/25"
                  : "border-transparent"
            }`}
          >
            {layout.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                <LayoutTemplate className="h-10 w-10 mb-3 opacity-50" />
                <p className="text-sm font-medium">Drag components here</p>
                <p className="text-xs mt-1">Build your newsletter by dragging components from the library</p>
              </div>
            ) : (
              layout.map((item) => (
                <SortableItem
                  key={item.id}
                  item={item}
                  component={getComponentById(item.componentId)}
                  onRemove={() => onRemoveItem(item.id)}
                />
              ))
            )}
          </div>
        </SortableContext>
      </CardContent>
    </Card>
  )
}
