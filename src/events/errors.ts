export type EventError = 
    | { name: "EventNotFoundError"; message: string }
    | { name: "NotAuthorizedError"; message: string }
    | { name: "InvalidEventStateError"; message: string }
    | { name: "InvalidInputError"; message: string }
    | { name: "InvalidRSVPError"; message: string }
    | { name: "UnexpectedDependencyError"; message: string };

export const EventNotFound = (message: string): EventError => ({
    name: "EventNotFoundError",
    message,
});

export const NotAuthorizedError = (message: string): EventError => ({
    name: "NotAuthorizedError",
    message,
});

export const InvalidEventStateError = (message: string): EventError => ({
    name: "InvalidEventStateError",
    message,
});

export const InvalidInputError = (message: string): EventError => ({
    name: "InvalidInputError",
    message,
});

export const InvalidRSVPError = (message: string): EventError => ({
    name: "InvalidRSVPError",
    message,
});

export const UnexpectedDependencyError = (message: string): EventError => ({
    name: "UnexpectedDependencyError",
    message,
});