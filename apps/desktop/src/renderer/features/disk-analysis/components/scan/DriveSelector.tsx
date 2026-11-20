import { SearchableSelect, type SelectOption } from "@/components/ui";
import type { DriveInfo } from "@/types";

export interface DriveSelectorProps {
  drives: DriveInfo[];
  value: string;
  onChange: (driveId: string) => void;
}

export function DriveSelector({ drives, value, onChange }: DriveSelectorProps) {
  const options: SelectOption[] = drives.map((drive) => ({
    value: drive.id,
    label: `${drive.letter ? `${drive.letter} — ` : ""}${drive.name}`,
  }));

  return (
    <SearchableSelect
      aria-label="Select drive"
      options={options}
      value={value}
      onValueChange={onChange}
      placeholder="Select a drive"
      searchPlaceholder="Search drives"
      className="w-56"
    />
  );
}
