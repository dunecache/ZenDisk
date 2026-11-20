import {
  FileArchive,
  FileAudio,
  FileCode2,
  FileImage,
  FileText,
  FileVideo,
  Folder,
  Package,
  Settings2,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type FileCategory =
  | "documents"
  | "images"
  | "videos"
  | "audio"
  | "archives"
  | "applications"
  | "system"
  | "code"
  | "folder"
  | "other";

const extensionMap: Record<string, FileCategory> = {
  txt: "documents", md: "documents", pdf: "documents", doc: "documents", docx: "documents",
  xls: "documents", xlsx: "documents", ppt: "documents", pptx: "documents", csv: "documents",
  png: "images", jpg: "images", jpeg: "images", gif: "images", webp: "images", svg: "images", bmp: "images",
  mp4: "videos", mkv: "videos", avi: "videos", mov: "videos", webm: "videos",
  mp3: "audio", wav: "audio", flac: "audio", aac: "audio", ogg: "audio",
  zip: "archives", rar: "archives", "7z": "archives", tar: "archives", gz: "archives",
  exe: "applications", msi: "applications", apk: "applications", dmg: "applications",
  dll: "system", sys: "system", ini: "system",
  js: "code", ts: "code", tsx: "code", jsx: "code", json: "code", html: "code", css: "code", py: "code",
};

const categoryIcons: Record<FileCategory, LucideIcon> = {
  documents: FileText,
  images: FileImage,
  videos: FileVideo,
  audio: FileAudio,
  archives: FileArchive,
  applications: Package,
  system: Settings2,
  code: FileCode2,
  folder: Folder,
  other: FileText,
};

const categoryColor: Record<FileCategory, string> = {
  documents: "text-[color:var(--chart-documents)]",
  images: "text-[color:var(--chart-images)]",
  videos: "text-[color:var(--chart-videos)]",
  audio: "text-[color:var(--chart-audio)]",
  archives: "text-[color:var(--chart-archives)]",
  applications: "text-[color:var(--chart-applications)]",
  system: "text-[color:var(--chart-system)]",
  code: "text-[color:var(--chart-videos)]",
  folder: "text-secondary",
  other: "text-[color:var(--chart-other)]",
};

export function categoryForName(name: string, isDirectory = false): FileCategory {
  if (isDirectory) return "folder";
  const ext = name.includes(".") ? name.split(".").pop()!.toLowerCase() : "";
  return extensionMap[ext] ?? "other";
}

export interface FileIconProps {
  name: string;
  isDirectory?: boolean;
  size?: number;
  className?: string;
}

/** Maps file extensions/categories to consistent 16–18px icons. */
export function FileIcon({ name, isDirectory = false, size = 16, className }: FileIconProps) {
  const category = categoryForName(name, isDirectory);
  const Icon = categoryIcons[category];
  return (
    <Icon
      size={size}
      className={cn("shrink-0", categoryColor[category], className)}
      aria-hidden="true"
    />
  );
}
