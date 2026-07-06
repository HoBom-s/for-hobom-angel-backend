import { AsyncLocalStorage } from "async_hooks";
import { ClientSession } from "mongoose";

const sessionStorage = new AsyncLocalStorage<ClientSession>();

/**
 * Carries the active Mongo {@link ClientSession} through async chains so
 * repositories can transparently enlist in the ambient transaction without
 * threading a session parameter through every call. Plain module singleton
 * (not a Nest provider), matching the sister service's pattern.
 */
export const MongoSessionContext = {
  runWithSession: <T>(
    session: ClientSession,
    fn: () => Promise<T>,
  ): Promise<T> => sessionStorage.run(session, fn),
  getSession: (): ClientSession | undefined => sessionStorage.getStore(),
} as const;
