import { CreateAdminUserService } from "./auth/AdminUserService";
import { CreateAuthController } from "./auth/AuthController";
import { CreateAuthService } from "./auth/AuthService";
import { CreateInMemoryUserRepository } from "./auth/InMemoryUserRepository";
import { CreatePasswordHasher } from "./auth/PasswordHasher";
import { CreateApp } from "./app";
import type { IApp } from "./contracts";
import { EventController } from "./events/EventController";
import { EventService } from "./events/EventService";
import { InMemoryEventRepository } from "./events/InMemoryEventRepository";
import { InMemoryRSVPRepository } from "./events/InMemoryRSVPRepository";
import { CreateLoggingService } from "./service/LoggingService";
import type { ILoggingService } from "./service/LoggingService";

export function createComposedApp(logger?: ILoggingService): IApp {
  const resolvedLogger = logger ?? CreateLoggingService();

  // Authentication & authorization wiring
  const authUsers = CreateInMemoryUserRepository();
  const passwordHasher = CreatePasswordHasher();
  const authService = CreateAuthService(authUsers, passwordHasher);
  const adminUserService = CreateAdminUserService(authUsers, passwordHasher);
  const authController = CreateAuthController(authService, adminUserService, resolvedLogger);

  // Event wiring
  const eventRepository = new InMemoryEventRepository();
  const rsvpRepository = new InMemoryRSVPRepository();
  const eventService = new EventService(eventRepository, rsvpRepository);
  const eventController = new EventController(eventService, rsvpRepository);


  return CreateApp(authController, eventController, resolvedLogger);
}
