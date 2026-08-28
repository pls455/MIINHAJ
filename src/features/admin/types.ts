export type AdminRecordValue = string | number | boolean | string[];
export type AdminRecord = Record<string, AdminRecordValue> & { id?: string };

export interface AdminRepository {
  list(collection: string, pageSize: number): Promise<AdminRecord[]>;
  create(collection: string, data: AdminRecord): Promise<void>;
  update(collection: string, id: string, data: AdminRecord): Promise<void>;
  remove(collection: string, id: string): Promise<void>;
}
