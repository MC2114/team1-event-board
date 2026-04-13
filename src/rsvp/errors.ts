export type RsvpError =
    | { name: "EventNotFound"; message: string }
    | { name: "NotAuthorized"; message: string }
    | { name: "InvalidRsvp"; message: string }

export const EventNotFound = (message: string): RsvpError => ({
    name: "EventNotFound",
    message
})

export const NotAuthorized = (message: string): RsvpError => ({
    name: "NotAuthorized",
    message
})

export const InvalidRsvp = (message: string): RsvpError => ({
    name: "InvalidRsvp",
    message
})

