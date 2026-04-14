import type { ICreateEventRecordInput, IEventRecord } from "./Event";

export interface IEventRepository {
  create(input: ICreateEventRecordInput): Promise<IEventRecord>;
  findById(id: string): Promise<IEventRecord | null>;
  listAll(): Promise<IEventRecord[]>;
  listPublishedUpcoming(now?: Date): Promise<IEventRecord[]>;
}
