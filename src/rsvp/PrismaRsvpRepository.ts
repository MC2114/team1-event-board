import type { PrismaClient } from "@prisma/client";
import { Ok, Err, type Result } from "../lib/result";
import type { IRSVPRepository } from "./RsvpRepository";
import type { RSVP, RSVPAttendee, RSVPWithEvent } from "./RSVP";
import type { RSVPError } from "./errors";
import { UnexpectedDependencyError } from "./errors";

function toRSVP(record: any): RSVP {
  return {
    id: record.id,
    eventId: record.eventId,
    userId: record.userId,
    status: record.status,
    createdAt: record.createdAt,
  };
}

export class PrismaRsvpRepository implements IRSVPRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByUser(userId: string): Promise<Result<RSVPWithEvent[], RSVPError>> {
    throw new Error("Not implemented");
  }

  async findByEventId(eventId: string): Promise<Result<RSVP[], RSVPError>> {
    throw new Error("Not implemented");
  }

  async findAttendeesByEventId(eventId: string): Promise<Result<RSVPAttendee[], RSVPError>> {
    throw new Error("Not implemented");
  }

  async findByUserAndEvent(
    userId: string,
    eventId: string,
  ): Promise<Result<RSVP | null, RSVPError>> {
    try {
      const rsvp = await this.prisma.rSVP.findFirst({
        where: { userId, eventId },
      });

      return Ok(rsvp ? toRSVP(rsvp) : null);
    } catch {
      return Err(UnexpectedDependencyError("Unable to find RSVP."));
    }
  }

  async countGoing(eventId: string): Promise<Result<number, RSVPError>> {
    try {
      const count = await this.prisma.rSVP.count({
        where: {
          eventId,
          status: "going",
        },
      });

      return Ok(count);
    } catch {
      return Err(UnexpectedDependencyError("Unable to count attendees."));
    }
  }

  async save(rsvp: RSVP): Promise<Result<RSVP, RSVPError>> {
    try {
      const saved = await this.prisma.rSVP.upsert({
        where: { id: rsvp.id },
        update: {
          status: rsvp.status,
        },
        create: {
          id: rsvp.id,
          eventId: rsvp.eventId,
          userId: rsvp.userId,
          status: rsvp.status,
          createdAt: rsvp.createdAt,
        },
      });

      return Ok(toRSVP(saved));
    } catch {
      return Err(UnexpectedDependencyError("Unable to save RSVP."));
    }
  }
}