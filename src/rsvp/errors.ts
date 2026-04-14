export type RsvpError =
    | { name: "EventNotFound"; message: string }
    | { name: "NotAuthorized"; message: string }
    | { name: "InvalidRSVP"; message: string }
    | { name: "UnexpectedError"; message: string };

export const EventNotFound = (message: string): RsvpError => ({
    name: "EventNotFound",
    message,
});

export const NotAuthorized = (message: string): RsvpError => ({
    name: "NotAuthorized",
    message,
});

export const InvalidRSVP = (message: string): RsvpError => ({
    name: "InvalidRSVP",
    message,
});

export const UnexpectedError = (message: string): RsvpError => ({
    name: "UnexpectedError",
    message,
});