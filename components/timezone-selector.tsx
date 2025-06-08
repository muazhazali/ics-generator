"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, ChevronsUpDown } from "lucide-react"
import { TIMEZONES } from "@/lib/constants"

interface TimezoneSelectorProps {
  value: string
  onChange: (timezone: string) => void
}

export function TimezoneSelector({ value, onChange }: TimezoneSelectorProps) {
  const [open, setOpen] = useState(false)

  return (
    <div>
      <div className="flex items-center gap-2">
        <Label htmlFor="timezone">Timezone</Label>
        {value && !TIMEZONES.find(tz => tz.value === value) && (
          <Badge variant="secondary" className="text-xs">AI Detected</Badge>
        )}
      </div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {value
              ? TIMEZONES.find((timezone) => timezone.value === value)?.label || `${value} (AI Detected)`
              : "Select timezone..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Search timezone..." />
            <CommandList>
              <CommandEmpty>No timezone found.</CommandEmpty>
              <CommandGroup>
                {/* Show AI-detected timezone first if it's not in the predefined list */}
                {value && !TIMEZONES.find(tz => tz.value === value) && (
                  <CommandItem
                    key={value}
                    value={value}
                    onSelect={(currentValue) => {
                      onChange(currentValue)
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={`mr-2 h-4 w-4 ${
                        value === value ? "opacity-100" : "opacity-0"
                      }`}
                    />
                    <div className="flex flex-col">
                      <span className="font-medium text-blue-600">AI Detected</span>
                      <span className="text-sm text-muted-foreground">{value}</span>
                    </div>
                  </CommandItem>
                )}
                {TIMEZONES.map((timezone) => (
                  <CommandItem
                    key={timezone.value}
                    value={timezone.value}
                    onSelect={(currentValue) => {
                      onChange(currentValue)
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={`mr-2 h-4 w-4 ${
                        value === timezone.value ? "opacity-100" : "opacity-0"
                      }`}
                    />
                    <div className="flex flex-col">
                      <span className="font-medium">{timezone.offset}</span>
                      <span className="text-sm text-muted-foreground">{timezone.city}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
} 