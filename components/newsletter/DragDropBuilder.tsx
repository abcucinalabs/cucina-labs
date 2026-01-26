"use client"

import { useState, useEffect, useCallback } from "react"
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core"
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable"
import { Button } from "@/components/ui/button"
import { ComponentLibrary } from "./ComponentLibrary"
import { LayoutCanvas } from "./LayoutCanvas"
import { LivePreview } from "./LivePreview"
import { ComponentEditor } from "./ComponentEditor"
import { Save, Undo } from "lucide-react"
import type { DataSource, NewsletterComponent, LayoutItem } from "@/types/newsletter"

interface DragDropBuilderProps {
  sequenceId: string
  initialLayout?: LayoutItem[]
  onSave?: (layout: LayoutItem[]) => void
}

export function DragDropBuilder({
  sequenceId,
  initialLayout = [],
  onSave,
}: DragDropBuilderProps) {
  const [components, setComponents] = useState<NewsletterComponent[]>([])
  const [dataSources, setDataSources] = useState<DataSource[]>([])
  const [layout, setLayout] = useState<LayoutItem[]>(initialLayout)
  const [originalLayout, setOriginalLayout] = useState<LayoutItem[]>(initialLayout)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingComponent, setEditingComponent] = useState<NewsletterComponent | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const fetchComponents = useCallback(async () => {
    try {
      const response = await fetch("/api/newsletter-components")
      if (response.ok) {
        const data = await response.json()
        setComponents(data)
      }
    } catch (error) {
      console.error("Failed to fetch components:", error)
    }
  }, [])

  const fetchDataSources = useCallback(async () => {
    try {
      const response = await fetch("/api/data-sources")
      if (response.ok) {
        const data = await response.json()
        setDataSources(data)
      }
    } catch (error) {
      console.error("Failed to fetch data sources:", error)
    }
  }, [])

  useEffect(() => {
    fetchComponents()
    fetchDataSources()
  }, [fetchComponents, fetchDataSources])

  useEffect(() => {
    const layoutChanged = JSON.stringify(layout) !== JSON.stringify(originalLayout)
    setHasChanges(layoutChanged)
  }, [layout, originalLayout])

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const activeData = active.data.current
    const overId = over.id

    // Dropping from library onto canvas
    if (activeData?.type === "library-component" && overId === "layout-canvas") {
      const component = activeData.component as NewsletterComponent
      const newItem: LayoutItem = {
        id: `layout-${Date.now()}`,
        componentId: component.id,
        order: layout.length,
      }
      setLayout([...layout, newItem])
      return
    }

    // Reordering within canvas
    if (activeData?.type === "layout-item" && active.id !== over.id) {
      const oldIndex = layout.findIndex((item) => item.id === active.id)
      const newIndex = layout.findIndex((item) => item.id === over.id)

      if (oldIndex !== -1 && newIndex !== -1) {
        const newLayout = arrayMove(layout, oldIndex, newIndex).map((item, index) => ({
          ...item,
          order: index,
        }))
        setLayout(newLayout)
      }
    }
  }

  const handleRemoveItem = (instanceId: string) => {
    setLayout(layout.filter((item) => item.id !== instanceId).map((item, index) => ({
      ...item,
      order: index,
    })))
  }

  const handleAddComponent = () => {
    setEditingComponent(null)
    setEditorOpen(true)
  }

  const handleEditComponent = (component: NewsletterComponent) => {
    setEditingComponent(component)
    setEditorOpen(true)
  }

  const handleSaveComponent = async (componentData: Omit<NewsletterComponent, "id" | "dataSource">) => {
    try {
      const url = editingComponent
        ? `/api/newsletter-components/${editingComponent.id}`
        : "/api/newsletter-components"
      const method = editingComponent ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(componentData),
      })

      if (response.ok) {
        fetchComponents()
        setEditorOpen(false)
        setEditingComponent(null)
      }
    } catch (error) {
      console.error("Failed to save component:", error)
    }
  }

  const handleSaveLayout = async () => {
    if (!onSave) return
    setIsSaving(true)
    try {
      await onSave(layout)
      setOriginalLayout(layout)
    } catch (error) {
      console.error("Failed to save layout:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleResetLayout = () => {
    setLayout(originalLayout)
  }

  const activeComponent = activeId
    ? components.find((c) => c.id === activeId)
    : null

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {layout.length} component{layout.length !== 1 ? "s" : ""} in layout
          </span>
          {hasChanges && (
            <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded">
              Unsaved changes
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetLayout}
            disabled={!hasChanges}
          >
            <Undo className="h-4 w-4 mr-1" />
            Reset
          </Button>
          <Button
            size="sm"
            onClick={handleSaveLayout}
            disabled={!hasChanges || isSaving}
            isLoading={isSaving}
          >
            <Save className="h-4 w-4 mr-1" />
            Save Layout
          </Button>
        </div>
      </div>

      {/* Main content */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 overflow-hidden">
          {/* Component Library */}
          <div className="lg:col-span-1 overflow-hidden">
            <ComponentLibrary
              components={components}
              onAddComponent={handleAddComponent}
              onEditComponent={handleEditComponent}
            />
          </div>

          {/* Layout Canvas */}
          <div className="lg:col-span-1 overflow-hidden">
            <LayoutCanvas
              layout={layout}
              components={components}
              onRemoveItem={handleRemoveItem}
            />
          </div>

          {/* Live Preview */}
          <div className="lg:col-span-1 overflow-hidden">
            <LivePreview
              layout={layout}
              components={components}
            />
          </div>
        </div>

        <DragOverlay>
          {activeComponent && (
            <div className="p-3 rounded-lg border-2 border-primary bg-card shadow-lg">
              <span className="font-medium">{activeComponent.name}</span>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Component Editor Modal */}
      <ComponentEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        component={editingComponent}
        dataSources={dataSources}
        onSave={handleSaveComponent}
      />
    </div>
  )
}
