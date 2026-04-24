import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

import { CreateAdminUserService } from "./auth/AdminUserService";
import { CreateAuthController } from "./auth/AuthController";
import { CreateAuthService } from "./auth/AuthService";
import { CreateInMemoryUserRepository } from "./auth/InMemoryUserRepository";
import { CreatePasswordHasher } from "./auth/PasswordHasher";
import { CreateApp } from "./app";
import type { IApp } from "./contracts";
import { CreateInMemoryEventRepository } from "./events/InMemoryEventRepository";
import { PrismaEventRepository } from "./events/PrismaEventRepository";
import { CreateEventController } from "./events/EventController";
import { CreateEventService } from "./events/EventService";
import { CreateInMemoryRsvpRepository } from "./rsvp/InMemoryRsvpRepository";
import { CreateRsvpController } from "./rsvp/RsvpController";
import { CreateRsvpService } from "./rsvp/RsvpService";
import { CreateLoggingService } from "./service/LoggingService";
import type { ILoggingService } from "./service/LoggingService";

function createAuthWiring(resolvedLogger: ILoggingService) {
  const authUsers = CreateInMemoryUserRepository();
  const passwordHasher = CreatePasswordHasher();
  const authService = CreateAuthService(authUsers, passwordHasher);
  const adminUserService = CreateAdminUserService(authUsers, passwordHasher);

  return CreateAuthController(
    authService,
    adminUserService,
    resolvedLogger,
  );
}

export function createComposedApp(logger?: ILoggingService): IApp {
  const resolvedLogger = logger ?? CreateLoggingService();

  const authController = createAuthWiring(resolvedLogger);

  const eventRepository = CreateInMemoryEventRepository();
  const rsvpRepository = CreateInMemoryRsvpRepository();

  const eventService = CreateEventService(eventRepository, rsvpRepository);
  const eventController = CreateEventController(
    eventService,
    rsvpRepository,
    resolvedLogger,
  );

  const rsvpService = CreateRsvpService(
    rsvpRepository,
    eventRepository,
    resolvedLogger,
  );

  const rsvpController = CreateRsvpController(
    rsvpService,
    eventService,
    resolvedLogger,
  );

  return CreateApp(
    authController,
    eventController,
    rsvpController,
    resolvedLogger,
  );
}

export function createComposedAppWithPrismaEventRepository(
  logger?: ILoggingService,
): IApp {
  const resolvedLogger = logger ?? CreateLoggingService();

  const authController = createAuthWiring(resolvedLogger);

  const adapter = new PrismaBetterSqlite3({
    url: "file:./prisma/dev.db",
  });

  const prisma = new PrismaClient({ adapter });

  const eventRepository = new PrismaEventRepository(prisma);
  const rsvpRepository = CreateInMemoryRsvpRepository();

  const eventService = CreateEventService(eventRepository, rsvpRepository);
  const eventController = CreateEventController(
    eventService,
    rsvpRepository,
    resolvedLogger,
  );

  const rsvpService = CreateRsvpService(
    rsvpRepository,
    eventRepository,
    resolvedLogger,
  );

  const rsvpController = CreateRsvpController(
    rsvpService,
    eventService,
    resolvedLogger,
  );

  return CreateApp(
    authController,
    eventController,
    rsvpController,
    resolvedLogger,
  );
}