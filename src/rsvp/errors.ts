export type RSVPError =
    | { name: "EventNotFound"; message: string }
    | { name: "NotAuthorized"; message: string }
    | { name: "InvalidRsvp"; message: string }
    | { name: "UnexpectedError"; message: string };

export const EventNotFound = (message: string): RSVPError => ({
    name: "EventNotFound",
    message,
});

export const NotAuthorized = (message: string): RSVPError => ({
    name: "NotAuthorized",
    message,
});

export const InvalidRsvp = (message: string): RSVPError => ({
    name: "InvalidRsvp",
    message,
});

export const UnexpectedError = (message: string): RSVPError => ({
    name: "UnexpectedError",
    message,
});
