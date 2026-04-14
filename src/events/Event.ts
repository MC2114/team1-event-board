export type EventStatus = "draft" | "published" | "cancelled" | "past";

const VALID_CATEGORIES = [
    "technology",
    "business",
    "music",
    "art",
    "food",
    "health",
    "education",
    "sports",
    "gaming",
    "networking",
    "party",
    "holiday",
    "birthday",
    "graduation",
    "wedding",
    "movies and tv",
    "other"] as const;

export type EventCategory = (typeof VALID_CATEGORIES)[number];

const VALID_TIMEFRAMES = ["all", "this_week", "this_month", "this_year"] as const;

export type EventTimeframe = (typeof VALID_TIMEFRAMES)[number];

export interface Event {
    id: string
    title: string
    description: string
    location: string
    category: string
    status: EventStatus
    capacity: number | null
    startDatetime: Date
    endDatetime: Date
    organizerId: string
    createdAt: Date
    updatedAt: Date
}
