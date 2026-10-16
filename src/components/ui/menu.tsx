import * as Popover from "@radix-ui/react-popover";
import type { ReactNode } from "react";

export function Menu({
  label,
  active,
  count,
  children,
}: {
  label: string;
  active?: boolean;
  count?: number;
  children: ReactNode;
}) {
  return (
    <Popover.Root>
      <Popover.Trigger className="desk-chip pressable" data-active={active ? "true" : "false"}>
        <span>{label}</span>
        {count ? <span className="tabular-nums text-muted">{count}</span> : null}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={8}
          className="z-30 w-72 rounded-lg border border-line bg-surface p-2 shadow-panel"
        >
          {children}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
