"use client";

import React, { useState } from "react";
import { Check, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerTrigger,
} from "@/components/ui/drawer";
import WheelPicker from "@/components/ui/wheel-picker";

interface TimePickerSheetProps {
  /** Hora em HH:MM (24h). */
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
}

/**
 * Seletor de horário 24h em sheet com efeito de surgimento rápido (de baixo para cima).
 * Ao tocar, abre uma sheet animada com o wheel picker 3D (hora + minuto, sem AM/PM).
 */
export function TimePickerSheet({
  value,
  onChange,
  label,
  placeholder = "Escolher horário",
}: TimePickerSheetProps) {
  const [open, setOpen] = useState(false);
  const [hour, setHour] = useState(value.split(":")[0] ?? "08");
  const [minute, setMinute] = useState(value.split(":")[1] ?? "00");

  const setTime = (h: string, m: string) => {
    setHour(h);
    setMinute(m);
    onChange(`${h}:${m}`);
  };

  return (
    <div>
      {label && (
        <span className="block text-[11px] font-semibold text-ceci-tertiary mb-1.5 uppercase tracking-wider">
          {label}
        </span>
      )}

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <button
            type="button"
            onClick={() => {
              setHour(value.split(":")[0] ?? "08");
              setMinute(value.split(":")[1] ?? "00");
              setOpen(true);
            }}
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-label={label ?? placeholder}
            className={cn(
              "w-full border border-transparent rounded-2xl px-4 py-4 text-sm flex items-center justify-between gap-2 focus:outline-none focus:ring-2 focus:ring-ceci-brand/30 focus:border-ceci-brand cursor-pointer transition-colors",
              !value && "border-ceci-border-default",
            )}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Clock className="w-4 h-4 text-ceci-tertiary shrink-0" />
              <span className="truncate">
                {value ? (
                  <span className="text-ceci-primary">{value}</span>
                ) : (
                  <span className="text-ceci-faded">{placeholder}</span>
                )}
              </span>
            </div>
          </button>
        </DrawerTrigger>

        <DrawerContent className="w-auto overflow-hidden p-0 sm:rounded-[28px]">
          <DrawerHeader className="px-5 pt-4 pb-2 border-b border-ceci-border-subtle">
            <DrawerTitle className="text-lg font-display font-bold leading-none tracking-tight text-ceci-primary">
              Selecionar horário
            </DrawerTitle>
            <DrawerDescription className="text-sm text-ceci-secondary">Formato 24 horas</DrawerDescription>
          </DrawerHeader>

          <div className="px-6 pt-4 pb-1">
            <WheelPicker
              value={{ hour, minute }}
              onValueChange={(v) => {
                setHour(v.hour);
                setMinute(v.minute);
              }}
              label="Escolher horário"
            />
          </div>

          <div className="px-6 pt-3 pb-5">
            <button
              type="button"
              onClick={() => {
                setTime(hour, minute);
                setOpen(false);
              }}
              className="w-full min-h-[44px] rounded-2xl bg-ceci-primary text-ceci-on-primary text-sm font-semibold active:scale-[0.98] transition-transform cursor-pointer"
            >
              <Check className="w-4 h-4 mr-1.5" /> definir horário
            </button>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

export default TimePickerSheet;
