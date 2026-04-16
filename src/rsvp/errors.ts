export type RSVPError =
    | { name: "EventNotFoundError"; message: string }
    | { name: "NotAuthorizedError"; message: string }
    | { name: "InvalidRSVPError"; message: string }
    | { name: "UnexpectedDependencyError"; message: string };

export const EventNotFoundError = (message: string): RSVPError => ({
    name: "EventNotFoundError",
    message,
});

export const NotAuthorizedError = (message: string): RSVPError => ({
    name: "NotAuthorizedError",
    message,
});

export const InvalidRSVPError = (message: string): RSVPError => ({
    name: "InvalidRSVPError",
    message,
});

export const UnexpectedDependencyError = (message: string): RSVPError => ({
    name: "UnexpectedDependencyError",
    message,
});
