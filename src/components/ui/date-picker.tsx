"use client"

import * as React from "react"
import { CalendarDate, getLocalTimeZone } from "@internationalized/date"
import { CalendarPlusIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { CeciFieldShell } from "./ceci/CeciFieldShell"

import { Calendar } from "@/components/ui/calendar-rac"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"

export interface DatePickerProps {
  label?: string
  htmlFor?: string
  /** Data civil em ISO `YYYY-MM-DD`. `null` = vazio. */
  value: string | null
  onChange: (value: string | null) => void
  placeholder?: string
  description?: string
  error?: string
  className?: string
}

export function DatePicker({
  label,
  htmlFor,
  value,
  onChange,
  placeholder = "Selecionar data",
  description,
  error,
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [date, setDate] = React.useState<CalendarDate | null>(
    value
      ? (() => {
          const parts = value.split("-")
          const y = Number(parts[0])
          const m = Number(parts[1])
          const d = Number(parts[2])
          return new CalendarDate(y, m, d)
        })()
      : null,
  )

  const formatted =
    date
      ? date.toDate(getLocalTimeZone()).toLocaleDateString("pt-BR")
      : placeholder

  return (
    <div className={cn(className)}>
      <CeciFieldShell
        label={label}
        htmlFor={htmlFor}
        description={description}
        error={error}
      >
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-label={label ?? placeholder ?? "selecionar data"}
            className={cn(
              "w-full border border-transparent rounded-2xl px-4 py-4 text-sm flex items-center justify-between gap-2 focus:outline-none focus:ring-2 focus:ring-ceci-brand/30 focus:border-ceci-brand cursor-pointer transition-colors",
              error && "border-ceci-border-brand focus:ring-ceci-brand",
            )}
          >
            <div className="flex items-center gap-2 min-w-0">
              <CalendarPlusIcon className="w-4 h-4 text-ceci-tertiary shrink-0" />
              <span className="truncate">
                {date
                  ? <span className="text-ceci-primary">{formatted}</span>
                  : <span className="text-ceci-faded">{placeholder}</span>}
              </span>
            </div>
          </button>
        </DrawerTrigger>
        <DrawerContent className="w-auto overflow-hidden p-0">
          <DrawerHeader className="sr-only">
            <DrawerTitle>Selecionar data</DrawerTitle>
            <DrawerDescription>Escolha uma data no calendário</DrawerDescription>
          </DrawerHeader>
          <Calendar
            aria-label="Data"
            value={date}
            onChange={(newDate) => {
              const chosen = newDate as CalendarDate
              const iso = `${chosen.year}-${String(chosen.month).padStart(2, "0")}-${String(chosen.day).padStart(2, "0")}`
              setDate(chosen)
              onChange(iso)
              setOpen(false)
            }}
            className="mx-auto [--cell-size:clamp(0px,calc(100vw/7.5),52px)]"
          />
        </DrawerContent>
      </Drawer>
      </CeciFieldShell>
    </div>
  )
}
