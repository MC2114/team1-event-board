# CONTRACTS.md — Local Event Board

Interface contracts for every service method shared across two or more features.
Agreed upon before Sprint 1 development begins.

**Team assignments:**
- Athena Yung — Features 1, 3
- Anusha Arokiaraj — Features 2, 4
- Barrett — Features 5, 6
- Chau Tran — Features 7, 8
- Rayan Chahid — Features 10, 12

**Integration Compromise rule:** If you change a method's return shape after a teammate has built against it, that is a −10 point penalty on your individual sprint score. Communicate *before* you change anything documented here.

---
## Shared Result Pattern

All shared service methods return a `Result<T, E>` shape.

### Success
```ts
type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };

---
## EventService

### `getEventById`

**Used by:** Features 2, 3, 4, 5, 8, 10, 12

```ts
EventService.getEventById(eventId: string): Result<Event, EventNotFoundError>
```

**Success — `{ ok: true, value: Event }`**

```ts
{
  id: string
  title: string
  description: string
  location: string
  category: string
  status: "draft" | "published" | "cancelled" | "past"
  capacity: number | null        
  startDatetime: Date
  endDatetime: Date
  organizerId: string
  createdAt: Date
  updatedAt: Date
}
```

**Errors:**

|     Error class      |                When               |
|----------------------|-----------------------------------|
| `EventNotFoundError` | No event exists with the given ID |

---
### `createEvent`

**Used by:** Feature 1 (owned), Feature 3 (reads shape)

```ts
EventService.createEvent(data: {
  title: string
  description: string
  location: string
  category: string
  capacity: number | null
  startDatetime: Date
  endDatetime: Date
  organizerId: string
}): Result<Event, InvalidInputError>
```

**Success — `{ ok: true, value: Event }`**

Returns the full `Event` object as defined in `getEventById` above. Status is always `"draft"` on creation.

**Errors:**

|     Error class     |                                   When                                                |
|---------------------|---------------------------------------------------------------------------------------|
| `InvalidInputError` | Any required field is missing, endDatetime is not after startDatetime, or other validation failure |

---

### `updateEvent`

**Used by:** Feature 3 (owned), Feature 1 (shape dependency)

```ts
EventService.updateEvent(
  eventId: string,
  actingUserId: string,
  actingUserRole: string,
  data: Partial<{
    title: string
    description: string
    location: string
    category: string
    capacity: number | null
    startDatetime: Date
    endDatetime: Date
  }>
): Result<Event, EventNotFoundError | NotAuthorizedError | InvalidEventStateError | InvalidInputError>
```

**Success — `{ ok: true, value: Event }`**

Returns the full updated `Event` object.

**Errors:**

|        Error class       |                                     When                                      |
|--------------------------|-------------------------------------------------------------------------------|
|   `EventNotFoundError`   |                        No event exists with the given ID                      |
|   `NotAuthorizedError`   |             Acting user is not the organizer and is not an admin              |
| `InvalidEventStateError` |                 Event is in `"cancelled"` or `"past"` status                  |
|   `InvalidInputError`    | Updated field values fail validation (e.g., endDatetime before startDatetime) |

---

### `updateEventStatus`

**Used by:** Features 5, 8

```ts
EventService.updateEventStatus(
  eventId: string,
  actingUserId: string,
  actingUserRole: string,
  newStatus: "published" | "cancelled"
): Result<Event, EventNotFoundError | NotAuthorizedError | InvalidEventStateError>
```

**Success — `{ ok: true, value: Event }`**

Returns the full updated `Event` object with the new status applied.

**Valid transitions:**

| From | To |
|---|---|
| `"draft"` | `"published"` |
| `"published"` | `"cancelled"` |

All other transitions are rejected.

**Errors:**

|        Error class       |                             When                                  |
|--------------------------|-------------------------------------------------------------------|
|    `EventNotFoundError`  |                 No event exists with the given ID                 |
|   `NotAuthorizedError`   |          Acting user is not the organizer and is not an admin.    |
| `InvalidEventStateError` | Requested transition is not valid from the event's current status |

---

### `listEvents`

**Used by:** Features 6, 10

```ts
EventService.listEvents(filters?: {
  category?: string
  timeframe?: "all" | "this_week" | "this_weekend"
  searchQuery?: string
}): Result<Event[], InvalidInputError>
```

**Success — `{ ok: true, value: Event[] }`**

Returns an array of `Event` objects. Only `"published"` events with a `startDatetime` in the future are returned. An empty array is a valid success result (not an error). If `filters` is omitted or all filter fields are undefined, all published upcoming events are returned.

**Errors:**

|      Error class    |                             When                              |
|---------------------|---------------------------------------------------------------|
| `InvalidInputError` | `category` or `timeframe` is a value outside the accepted set |

---

### `getEventsByOrganizer`

**Used by:** Feature 8 (owned), Feature 5 (shape dependency)

```ts
EventService.getEventsByOrganizer(
  actingUserId: string,
  actingUserRole: string
): Result<Event[], never>
```

**Success — `{ ok: true, value: Event[] }`**

If `actingUserRole === "admin"`, returns all events across all organizers. Otherwise returns only events where `organizerId === actingUserId`. Always succeeds (empty array if none found). Sorted by `createdAt` descending.

**Errors:** None.

---

## RSVPService

### `getRSVPsByEvent`

**Used by:** Features 4, 8, 12

```ts
RSVPService.getRSVPsByEvent(
  eventId: string
): Result<RSVP[], EventNotFoundError>
```

**Success — `{ ok: true, value: RSVP[] }`**

```ts
{
  id: string
  eventId: string
  userId: string
  status: "going" | "waitlisted" | "cancelled"
  createdAt: Date
}
```

Returns all RSVPs for the event regardless of status, sorted by `createdAt` ascending. Returns an empty array if there are no RSVPs.

**Errors:**

|      Error class.    |               When                |
|----------------------|-----------------------------------|
| `EventNotFoundError` | No event exists with the given ID |

---

### `getRSVPsByUser`

**Used by:** Features 4, 7

```ts
RSVPService.getRSVPsByUser(userId: string): Result<RSVP[], never>
```

**Success — `{ ok: true, value: RSVP[] }`**

Returns all RSVPs for the given user across all events, in all statuses. Sorted by `createdAt` descending. Returns an empty array if none exist. Always succeeds.

**Errors:** None.

---

### `toggleRSVP`

**Used by:** Feature 4 (owned), Features 7, 8 (shape dependency — cancel path)

```ts
RSVPService.toggleRSVP(
  eventId: string,
  userId: string
): Result<RSVP, EventNotFoundError | InvalidRSVPError>
```

**Success — `{ ok: true, value: RSVP }`**

Returns the resulting RSVP record after the toggle. The three cases:

|                   Prior state                  |  Result status |
|------------------------------------------------|----------------|
|        No existing RSVP, event not full        |   `"going"`    |
|       No existing RSVP, event at capacity      | `"waitlisted"` |
|   Existing `"going"` or `"waitlisted"` RSVP    |  `"cancelled"` |
|   Existing `"cancelled"` RSVP, event not full  |   `"going"`    |
| Existing `"cancelled"` RSVP, event at capacity | `"waitlisted"` |

**Errors:**

| Error class | When |
|---|---|
| `EventNotFoundError` | No event exists with the given ID |
| `InvalidRSVPError` | Event is `"cancelled"` or `"past"`, or acting user is an organizer or admin |

---

### `getAttendeeCount`

**Used by:** Features 2, 8

```ts
RSVPService.getAttendeeCount(eventId: string): Result<number, EventNotFoundError>
```

**Success — `{ ok: true, value: number }`**

Returns the count of RSVPs with `status === "going"` for the given event. Returns `0` if there are none.

**Errors:**

|      Error class     |                When               |
|----------------------|-----------------------------------|
| `EventNotFoundError` | No event exists with the given ID |

---

## Shared Error Classes

All errors below extend a base `AppError` class and are returned inside `Result` objects — never thrown.

```ts
class AppError extends Error {
  constructor(message: string) { super(message) }
}

class EventNotFoundError extends AppError {}
class NotAuthorizedError extends AppError {}
class InvalidEventStateError extends AppError {}
class InvalidInputError extends AppError {}
class InvalidRSVPError extends AppError {}
```

These are defined once in a shared `errors.ts` file and imported by all service and controller files that need them.

---

## Notes

- Services never read from `req.session` directly. Controllers extract `userId` and `role` from the session and pass them as parameters.
- The `Event` and `RSVP` shapes above define the in-memory data structure for Sprints 1–2. The Prisma schema in Sprint 3 must match these field names so only the repository layer changes.
- `capacity: null` means the event has no limit. Capacity enforcement in `toggleRSVP` compares the current `going` count from `getAttendeeCount` against the event's `capacity` field.

