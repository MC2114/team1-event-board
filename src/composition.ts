import { CreateAdminUserService } from "./auth/AdminUserService";
import { CreateAuthController } from "./auth/AuthController";
import { CreateAuthService } from "./auth/AuthService";
import { CreateInMemoryUserRepository } from "./auth/InMemoryUserRepository";
import { CreatePasswordHasher } from "./auth/PasswordHasher";
import { CreateApp } from "./app";
import type { IApp } from "./contracts";
import { CreateLoggingService } from "./service/LoggingService";
import type { ILoggingService } from "./service/LoggingService";
import { CreateInMemoryEventRepository } from "./events/InMemoryEventRepository";
import { CreateEventService } from "./events/EventService";
import { CreateInMemoryRsvpRepository } from "./rsvp/InMemoryRsvpRepository";
import { CreateEventController } from "./events/EventController";
import { CreateRsvpController } from "./rsvp/RsvpController";
import { CreateRsvpService } from "./rsvp/RsvpService";

export function createComposedApp(logger?: ILoggingService): IApp {
  const resolvedLogger = logger ?? CreateLoggingService();

  // Authentication & authorization wiring
  const authUsers = CreateInMemoryUserRepository();
  const passwordHasher = CreatePasswordHasher();
  const authService = CreateAuthService(authUsers, passwordHasher);
  const adminUserService = CreateAdminUserService(authUsers, passwordHasher);
  const authController = CreateAuthController(
    authService,
    adminUserService,
    resolvedLogger,
  );

  // Event & RSVP wiring
  const eventRepository = CreateInMemoryEventRepository();
  const rsvpRepository = CreateInMemoryRsvpRepository();
  const eventService = CreateEventService(eventRepository, rsvpRepository);
  const eventController = CreateEventController(
    eventService,
    rsvpRepository,
    resolvedLogger,
  );
  const rsvpService = CreateRsvpService(rsvpRepository, eventRepository, resolvedLogger);
  const rsvpController = CreateRsvpController(rsvpService, resolvedLogger);

  return CreateApp(authController, eventController, rsvpController, resolvedLogger);
}
