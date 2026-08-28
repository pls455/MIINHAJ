import type { BaseDocument } from '../../types';

export interface AdminRepository {
  list: (options: { pageSize: number; cursor?: string; search?: string }) => Promise<{ items: BaseDocument[]; nextCursor?: string; hasMore: boolean }>;
  create: (data: Omit<BaseDocument, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  update: (id: string, data: Partial<Omit<BaseDocument, 'id'>>) => Promise<void>;
  remove: (id: string) => Promise<void>;
}
