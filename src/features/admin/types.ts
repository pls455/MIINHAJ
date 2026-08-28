import type { BaseDocument, ListOptions, Page } from '../../types';

export interface AdminRepository {
  list: (options?: ListOptions) => Promise<Page<BaseDocument>>;
  create: (data: Record<string, unknown>) => Promise<string>;
  update: (id: string, data: Record<string, unknown>) => Promise<void>;
  remove: (id: string) => Promise<void>;
}
