import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Search, Package, Wrench, LayoutDashboard } from "lucide-react"
import { searchAll, type SearchResult } from "@/services/searchService"
import { Button } from "@/components/ui/button"

const typeIcons: Record<string, React.ElementType> = {
  page: LayoutDashboard,
  part: Package,
  job: Wrench,
}

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const handleSelect = useCallback(
    (item: SearchResult) => {
      setOpen(false)
      navigate(item.to)
    },
    [navigate]
  )

  useEffect(() => {
    if (open) {
      searchAll("", setResults)
    }
  }, [open])

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="relative h-9 w-9 p-0 lg:h-10 lg:w-64 lg:justify-start lg:px-3 lg:py-2"
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4 lg:mr-2" />
        <span className="hidden lg:inline-flex">Search...</span>
        <kbd className="pointer-events-none ml-auto hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 lg:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search pages, parts, job cards..."
          onValueChange={(value) => searchAll(value, setResults)}
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {results.length > 0 && (
            <CommandGroup heading="Results">
              {results.map((item) => {
                const Icon = typeIcons[item.type] || Search
                return (
                  <CommandItem
                    key={item.id}
                    value={`${item.label} ${item.description || ""}`}
                    onSelect={() => handleSelect(item)}
                    className="flex items-center gap-3"
                  >
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <div className="flex flex-col">
                      <span>{item.label}</span>
                      {item.description && (
                        <span className="text-xs text-muted-foreground">
                          {item.description}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}
