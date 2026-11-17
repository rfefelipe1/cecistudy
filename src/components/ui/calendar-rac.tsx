"use client"

import { cn } from "@/lib/utils"
import { getLocalTimeZone, today } from "@internationalized/date"
import { ComponentProps } from "react"
import {
  Button,
  CalendarCell as CalendarCellRac,
  CalendarGridBody as CalendarGridBodyRac,
    CalendarGridHeader as CalendarGridHeaderRac,
  CalendarGrid as CalendarGridRac,
  CalendarHeaderCell as CalendarHeaderCellRac,
  Calendar as CalendarRac,
  Heading as HeadingRac,
  RangeCalendar as RangeCalendarRac,
  composeRenderProps,
} from "react-aria-components"
import { ChevronLeftIcon, ChevronRightIcon } from "@radix-ui/react-icons"

interface BaseCalendarProps {
  className?: string
}

type CalendarProps = ComponentProps<typeof CalendarRac> & BaseCalendarProps
type RangeCalendarProps = ComponentProps<typeof RangeCalendarRac> &
  BaseCalendarProps

const CalendarHeader = () => (
  <header className="flex w-full items-center gap-1 pb-1">
    <button
      slot="previous"
      className="flex size-9 items-center justify-center rounded-xl text-ceci-tertiary outline-none transition-colors hover:bg-surface-muted hover:text-ceci-primary focus-visible:outline focus-visible:outline-1 focus-visible:outline-ceci-brand"
    >
      <ChevronLeftIcon width={14} height={14} strokeWidth={2} />
    </button>
    <HeadingRac className="grow text-center text-sm font-display font-bold text-ceci-primary" />
    <button
      slot="next"
      className="flex size-9 items-center justify-center rounded-xl text-ceci-tertiary outline-none transition-colors hover:bg-surface-muted hover:text-ceci-primary focus-visible:outline focus-visible:outline-1 focus-visible:outline-ceci-brand"
    >
      <ChevronRightIcon width={14} height={14} strokeWidth={2} />
    </button>
  </header>
)

const CalendarGridComponent = ({ isRange = false }: { isRange?: boolean }) => {
  const now = today(getLocalTimeZone())

  return (
    <CalendarGridRac>
      <CalendarGridHeaderRac>
        {(day) => (
          <CalendarHeaderCellRac
            className="size-9 rounded-xl p-0 text-[10px] font-semibold text-ceci-tertiary uppercase tracking-wider"
          >
            {day}
          </CalendarHeaderCellRac>
        )}
      </CalendarGridHeaderRac>
      <CalendarGridBodyRac className="[&_td]:px-0">
        {(date) => (
          <CalendarCellRac
            date={date}
            className={cn(
              "relative flex size-9 items-center justify-center whitespace-nowrap rounded-xl border border-transparent p-0 text-[11px] font-normal text-ceci-primary outline-offset-2 duration-150 transition-colors focus-visible:outline-none data-[disabled]:pointer-events-none data-[unavailable]:pointer-events-none data-[focus-visible]:z-10 data-[hovered]:bg-surface-muted data-[hovered]:text-ceci-primary data-[selected]:bg-ceci-brand data-[selected]:text-ceci-on-brand data-[unavailable]:line-through data-[disabled]:opacity-40 data-[unavailable]:opacity-40",
              // Range-specific styles
              isRange &&
                "data-[selected]:rounded-none data-[selection-end]:rounded-e-xl data-[selection-start]:rounded-s-xl data-[invalid]:bg-red-100 data-[selected]:bg-accent data-[selected]:text-foreground data-[invalid]:data-[selection-end]:[&:not([data-hover])]:bg-destructive data-[invalid]:data-[selection-start]:[&:not([data-hover])]:bg-destructive data-[selection-end]:[&:not([data-hover])]:bg-primary data-[selection-start]:[&:not([data-hover])]:bg-primary data-[invalid]:data-[selection-end]:[&:not([data-hover])]:text-destructive-foreground data-[invalid]:data-[selection-start]:[&:not([data-hover])]:text-destructive-foreground data-[selection-end]:[&:not([data-hover])]:text-primary-foreground data-[selection-start]:[&:not([data-hover])]:text-primary-foreground",
              // Today indicator styles
              date.compare(now) === 0 &&
                cn(
                  "after:pointer-events-none after:absolute after:bottom-1 after:start-1/2 after:z-10 after:size-[3px] after:-translate-x-1/2 after:rounded-full after:bg-ceci-brand",
                  isRange
                    ? "data-[selection-end]:[&:not([data-hover])]:after:bg-background data-[selection-start]:[&:not([data-hover])]:after:bg-background"
                    : "data-[selected]:after:bg-background",
                ),
            )}
          />
        )}
      </CalendarGridBodyRac>
    </CalendarGridRac>
  )
}

const Calendar = ({ className, ...props }: CalendarProps) => {
  return (
    <CalendarRac
      {...props}
      className={composeRenderProps(className, (className) =>
        cn("w-fit", className),
      )}
    >
      <CalendarHeader />
      <CalendarGridComponent />
    </CalendarRac>
  )
}

const RangeCalendar = ({ className, ...props }: RangeCalendarProps) => {
  return (
    <RangeCalendarRac
      {...props}
      className={composeRenderProps(className, (className) =>
        cn("w-fit", className),
      )}
    >
      <CalendarHeader />
      <CalendarGridComponent isRange />
    </RangeCalendarRac>
  )
}

export { Calendar, RangeCalendar }
