import { Ok, Err, type Result } from "../lib/result";

export interface IEventRepository {
    findById(eventId: string): Promise<Result<Event | undefined, EventError>>;
    
}