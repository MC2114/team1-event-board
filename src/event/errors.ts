export type EventError =
  | { name: "InvalidInputError"; message: string }
  | { name: "EventNotFoundError"; message: string }
  | { name: "NotAuthorizedError"; message: string }
  | { name: "InvalidEventStateError"; message: string };

export const InvalidInputError = (message: string): EventError => ({
  name: "InvalidInputError",
  message,
});

export const EventNotFoundError = (message: string): EventError => ({
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
