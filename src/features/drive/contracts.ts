export type DriveItemStatus = 'pending' | 'success' | 'review' | 'failed';

export interface DriveItemSuggestion {
  branchIds: string[];
  subjectId?: string;
  categoryId?: string;
  confidence: Record<string, number>;
}

export interface DriveImportItem {
  id: string;
  name: string;
  url: string;
  mimeType?: string;
  status: DriveItemStatus;
  suggestion?: DriveItemSuggestion;
  error?: string;
}

export interface DriveScanResult {
  folderUrl: string;
  items: DriveImportItem[];
  scannedAt: string;
}
