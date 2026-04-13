export type EventStatus = "draft" | "published" | "cancelled" | "past";

//Note: This needs to be an array of string since the event cateogry needs to be checked at runtime (types do only exist at compile time)
//Can come back and add more later just a placeholder for now
const validEventCategories = [
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

export type EventCategory = (typeof validEventCategories)[number];

//Note: Same sort of situation here with
//Again just a placeholder for now
const validEventTimeframes = ["all", "this_week", "this_month", "this_year"] as const;

export type EventTimeframe = (typeof validEventTimeframes)[number];

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