export type EntityType =
  | "person"
  | "vehicle"
  | "object"
  | "location"
  | "text"
  | "feature"
  | "environment";

export interface Entity {
  type: EntityType | string;
  description: string;
}

export interface ImageAnalysis {
  imageNumber: number;
  description: string;
  entities: Entity[];
}

export interface Relationship {
  from: string;
  to: string;
  type: string;
  description: string;
  evidence: string[];
  confidence: number;
}

export interface Analysis {
  images: ImageAnalysis[];
  relationships: Relationship[];
  importantFindings: string[];
  summary: string;
  confidence: number;
}

export interface AnalyzeResponse {
  success: boolean;
  analysis: Analysis;
}

export interface UploadedImage {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
}

export type SlotStatus = "empty" | "validating" | "uploading" | "uploaded" | "error";

export interface ImageSlot {
  status: SlotStatus;
  previewUrl?: string | undefined;
  progress: number;
  error?: string | undefined;
  uploaded?: UploadedImage | undefined;
  fileName?: string | undefined;
}
