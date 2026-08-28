export type AdminRole = 'reviewer' | 'content_admin' | 'superadmin';
export type ResourceType = 'book' | 'summary' | 'solution' | 'exam' | 'worksheet' | 'video' | 'link' | 'other';

export interface BaseDocument { id: string; createdAt?: unknown; updatedAt?: unknown; }
export interface Branch extends BaseDocument { name: string; description?: string; icon?: string; order: number; active: boolean; stableId?: string; }
export interface Subject extends BaseDocument { name: string; description?: string; icon?: string; order: number; active: boolean; branchId?: string; branchIds?: string[]; stableId?: string; }
export interface Category extends BaseDocument { name: string; description?: string; icon?: string; order: number; active: boolean; stableId?: string; }
export interface Resource extends BaseDocument { title: string; description?: string; url: string; normalizedUrl?: string; type: ResourceType; branchId?: string; branchIds?: string[]; subjectId?: string; categoryId?: string; active: boolean; order: number; }
export interface Foundation extends BaseDocument { title: string; description?: string; url?: string; branchId?: string; subjectId?: string; categoryId?: string; active: boolean; order: number; }
export interface Flashcard extends BaseDocument { question: string; answer: string; group?: string; active: boolean; order: number; }
export interface Solution extends BaseDocument { title: string; category?: string; content: string; links?: string[]; active: boolean; order: number; }
export type SubmissionStatus = 'pending' | 'approved' | 'rejected' | 'resolved' | 'closed';
export interface Suggestion extends BaseDocument { type: string; title: string; description?: string; url?: string; status: SubmissionStatus; }
export interface ProblemReport extends BaseDocument { type: string; title?: string; resourceId?: string; description: string; status: SubmissionStatus; }
export interface Contributor extends BaseDocument { name: string; description?: string; imageUrl?: string; link?: string; order: number; active: boolean; }
export interface AdminUser extends BaseDocument { email: string; role: AdminRole; active: boolean; displayName?: string; permissions?: Record<string, boolean>; }
export interface Template extends BaseDocument { name: string; entity: string; schema: Record<string, unknown>; active: boolean; }
export interface AdminLog extends BaseDocument { actorUid: string; actorEmail?: string; role?: AdminRole; action: string; target: string; targetId?: string; metadata?: Record<string, unknown>; }

export interface Page<T> { items: T[]; nextCursor?: string; hasMore: boolean; }
export interface ListOptions { pageSize?: number; cursor?: string; search?: string; active?: boolean; branchId?: string; subjectId?: string; categoryId?: string; }
export interface AIClassification { branchIds: string[]; subjectId: string; categoryId: string; confidence: { branch: number; subject: number; category: number }; evidence: string[]; conflicts: string[]; needsReview: boolean; }
export interface AIRequest { question: string; branchId?: string; subjectId?: string; }
export interface AIResponse { answer: string; resources: Array<Pick<Resource,'id'|'title'|'url'>>; model?: string; }
export interface DriveFile { id: string; name: string; path?: string; mimeType?: string; url: string; }
export interface DriveScanRequest { folderUrl: string; files?: DriveFile[]; }
export interface DriveScanResult { file: DriveFile; status: 'success'|'review'|'failed'; suggestion?: AIClassification; error?: string; }
