"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, RefreshCw, Monitor, Smartphone } from "lucide-react"
import type { NewsletterComponent, LayoutItem } from "@/types/newsletter"

interface LivePreviewProps {
  layout: LayoutItem[]
  components: NewsletterComponent[]
  previewHtml?: string | null
  isLoading?: boolean
  onRefresh?: () => void
}

export function LivePreview({
  layout,
  components,
  previewHtml,
  isLoading = false,
  onRefresh,
}: LivePreviewProps) {
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop")

  const getComponentById = (componentId: string) =>
    components.find((c) => c.id === componentId)

  // Generate a simple placeholder preview based on the layout
  const generatePlaceholderPreview = () => {
    if (layout.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
          <Eye className="h-10 w-10 mb-3 opacity-50" />
          <p className="text-sm">Preview will appear here</p>
          <p className="text-xs mt-1">Add components to see a preview</p>
        </div>
      )
    }

    return (
      <div className="space-y-4 p-4 bg-white text-black rounded-lg">
        {/* Newsletter header placeholder */}
        <div className="text-center border-b pb-4">
          <h1 className="text-xl font-bold">Newsletter Preview</h1>
          <p className="text-sm text-gray-500">This is a preview of your newsletter layout</p>
        </div>

        {/* Component placeholders */}
        {layout.map((item) => {
          const component = getComponentById(item.componentId)
          if (!component) return null

          return (
            <div key={item.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-semibold">{component.name}</h2>
                <Badge variant="outline" className="text-xs">
                  {component.type}
                </Badge>
              </div>

              {component.type === "data" && component.dataSource && (
                <div className="space-y-2">
                  {Array.from({ length: component.displayOptions?.maxItems || 3 }).map((_, i) => (
                    <div key={i} className="flex gap-3 p-2 bg-gray-50 rounded">
                      <div className="w-12 h-12 bg-gray-200 rounded flex-shrink-0" />
                      <div className="flex-1 space-y-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                        <div className="h-3 bg-gray-100 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                  <p className="text-xs text-gray-400 text-center">
                    Data from: {component.dataSource.name.replace(/_/g, " ")}
                  </p>
                </div>
              )}

              {component.type === "static" && (
                <div className="h-20 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-sm">
                  Static content placeholder
                </div>
              )}

              {component.type === "system" && (
                <div className="h-12 bg-gray-50 rounded flex items-center justify-center text-gray-400 text-sm">
                  System component
                </div>
              )}
            </div>
          )
        })}

        {/* Newsletter footer placeholder */}
        <div className="text-center border-t pt-4 text-xs text-gray-400">
          <p>Footer content • Unsubscribe link</p>
        </div>
      </div>
    )
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Live Preview
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex border rounded-md">
              <Button
                variant={viewMode === "desktop" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8 rounded-r-none"
                onClick={() => setViewMode("desktop")}
              >
                <Monitor className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "mobile" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8 rounded-l-none"
                onClick={() => setViewMode("mobile")}
              >
                <Smartphone className="h-4 w-4" />
              </Button>
            </div>
            {onRefresh && (
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={onRefresh}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-4 pt-0">
        <div
          className={`mx-auto transition-all duration-200 ${
            viewMode === "mobile" ? "max-w-[375px]" : "max-w-full"
          }`}
        >
          <div className="border rounded-lg overflow-hidden bg-gray-100">
            {previewHtml ? (
              <iframe
                srcDoc={previewHtml}
                className="w-full h-[600px] bg-white"
                title="Newsletter Preview"
              />
            ) : (
              generatePlaceholderPreview()
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
