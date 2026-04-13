export type EventError = 
    | { name: "EventNotFound"; message: string }
    | { name: "NotAuthorized"; message: string }
    | { name: "InvalidEventState"; message: string }
    | { name: "InvalidInput"; message: string }
    | { name: "UnexpectedDependencyError"; message: string };

export const EventNotFound = (message: string): EventError => ({
    name: "EventNotFound",
    message,
});

export const NotAuthorizedError = (message: string): EventError => ({
    name: "NotAuthorized",
    message,
});

export const InvalidEventStateError = (message: string): EventError => ({
    name: "InvalidEventState",
    message,
});

export const InvalidInputError = (message: string): EventError => ({
    name: "InvalidInput",
    message,
});

export const UnexpectedDependencyError = (message: string): EventError => ({
    name: "UnexpectedDependencyError",
    message,
});