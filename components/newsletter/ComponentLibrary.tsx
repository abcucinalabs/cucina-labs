"use client"

import { useDraggable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, GripVertical, Settings, Database, FileText, Cog } from "lucide-react"
import type { NewsletterComponent } from "@/types/newsletter"

interface ComponentLibraryProps {
  components: NewsletterComponent[]
  onAddComponent: () => void
  onEditComponent: (component: NewsletterComponent) => void
}

function DraggableComponent({
  component,
  onEdit,
}: {
  component: NewsletterComponent
  onEdit: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: component.id,
    data: {
      type: "library-component",
      component,
    },
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  }

  const getTypeIcon = () => {
    switch (component.type) {
      case "data":
        return <Database className="h-4 w-4" />
      case "static":
        return <FileText className="h-4 w-4" />
      case "system":
        return <Cog className="h-4 w-4" />
    }
  }

  const getTypeBadgeVariant = () => {
    switch (component.type) {
      case "data":
        return "default"
      case "static":
        return "secondary"
      case "system":
        return "outline"
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group flex items-center gap-2 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-grab active:cursor-grabbing"
    >
      <button
        {...attributes}
        {...listeners}
        className="touch-none text-muted-foreground hover:text-foreground"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{component.name}</span>
          <Badge variant={getTypeBadgeVariant()} className="text-xs flex items-center gap-1">
            {getTypeIcon()}
            {component.type}
          </Badge>
        </div>
        {component.dataSource && (
          <p className="text-xs text-muted-foreground truncate">
            {component.dataSource.name.replace(/_/g, " ")}
            {component.displayOptions?.maxItems && ` (${component.displayOptions.maxItems} items)`}
          </p>
        )}
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => {
          e.stopPropagation()
          onEdit()
        }}
      >
        <Settings className="h-4 w-4" />
      </Button>
    </div>
  )
}

export function ComponentLibrary({
  components,
  onAddComponent,
  onEditComponent,
}: ComponentLibraryProps) {
  const dataComponents = components.filter((c) => c.type === "data")
  const staticComponents = components.filter((c) => c.type === "static")
  const systemComponents = components.filter((c) => c.type === "system")

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Component Library</CardTitle>
          <Button size="sm" onClick={onAddComponent}>
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto space-y-4 p-4 pt-0">
        {components.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No components yet</p>
            <p className="text-xs mt-1">Add your first component to get started</p>
          </div>
        ) : (
          <>
            {dataComponents.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Data Components
                </h4>
                <div className="space-y-2">
                  {dataComponents.map((component) => (
                    <DraggableComponent
                      key={component.id}
                      component={component}
                      onEdit={() => onEditComponent(component)}
                    />
                  ))}
                </div>
              </div>
            )}

            {staticComponents.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Static Content
                </h4>
                <div className="space-y-2">
                  {staticComponents.map((component) => (
                    <DraggableComponent
                      key={component.id}
                      component={component}
                      onEdit={() => onEditComponent(component)}
                    />
                  ))}
                </div>
              </div>
            )}

            {systemComponents.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  System Components
                </h4>
                <div className="space-y-2">
                  {systemComponents.map((component) => (
                    <DraggableComponent
                      key={component.id}
                      component={component}
                      onEdit={() => onEditComponent(component)}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
