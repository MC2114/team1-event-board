import { UserRole } from "../auth/User";
import { Result } from "../lib/result";
import {
    EventNotFound,
    NotAuthorized,
    InvalidEventState,
    UnexpectedError,
    type EventError,
} from "./errors";
import type { Event, EventWithAttendeeCount, OrganizerDashboard } from "./EventTypes";

export interface IEventService {
    getEventsByOrganizer(
        actingUserId: string,
        actingUserRole: UserRole,
    ): Promise<Result<OrganizerDashboard, EventError>>;
    updateEventStatus(
        eventId: string,
        actingUserId: string,
        actingUserRole: UserRole,
        newStatus: "published" | "cancelled",
    ): Promise<Result<Event, EventError>>;
}