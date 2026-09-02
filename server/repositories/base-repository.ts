/**
 * Base Repository Interface for Data Access Layer
 */
export interface BaseRepository<T, TInsert = Partial<T>, TUpdate = Partial<T>> {
  findById(id: string): Promise<T | null>;
  findMany(filter?: Record<string, unknown>): Promise<T[]>;
  create(data: TInsert): Promise<T>;
  update(id: string, data: TUpdate): Promise<T>;
  delete(id: string): Promise<boolean>;
}
