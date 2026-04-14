export type EventError =
    | { name: "EventNotFound"; message: string }
    | { name: "NotAuthorized"; message: string }
    | { name: "InvalidEventState"; message: string }
    | { name: "InvalidInput"; message: string }
    | { name: "UnexpectedError"; message: string }

export const EventNotFound = (message: string): EventError => ({
    name: "EventNotFound",
    message,
})

export const NotAuthorized = (message: string): EventError => ({
    name: "NotAuthorized",
    message,
})

export const InvalidEventState = (message: string): EventError => ({
    name: "InvalidEventState",
    message,
})

export const InvalidInput = (message: string): EventError => ({
    name: "InvalidInput",
    message,
})

export const UnexpectedError = (message: string): EventError => ({
    name: "UnexpectedError",
    message,
})