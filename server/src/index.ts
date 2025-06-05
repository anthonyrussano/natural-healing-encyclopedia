
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  createCategoryInputSchema,
  createTagInputSchema,
  createNaturalHealingItemInputSchema,
  updateNaturalHealingItemInputSchema,
  createProtocolInputSchema,
  updateProtocolInputSchema
} from './schema';

// Import handlers
import { createCategory } from './handlers/create_category';
import { getCategories } from './handlers/get_categories';
import { createTag } from './handlers/create_tag';
import { getTags } from './handlers/get_tags';
import { createNaturalHealingItem } from './handlers/create_natural_healing_item';
import { getNaturalHealingItems } from './handlers/get_natural_healing_items';
import { getNaturalHealingItemById } from './handlers/get_natural_healing_item_by_id';
import { updateNaturalHealingItem } from './handlers/update_natural_healing_item';
import { deleteNaturalHealingItem } from './handlers/delete_natural_healing_item';
import { createProtocol } from './handlers/create_protocol';
import { getProtocols } from './handlers/get_protocols';
import { getProtocolById } from './handlers/get_protocol_by_id';
import { updateProtocol } from './handlers/update_protocol';
import { deleteProtocol } from './handlers/delete_protocol';
import { getItemsByCategory } from './handlers/get_items_by_category';
import { getItemsByTag } from './handlers/get_items_by_tag';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  // Category endpoints
  createCategory: publicProcedure
    .input(createCategoryInputSchema)
    .mutation(({ input }) => createCategory(input)),
  getCategories: publicProcedure
    .query(() => getCategories()),
  
  // Tag endpoints
  createTag: publicProcedure
    .input(createTagInputSchema)
    .mutation(({ input }) => createTag(input)),
  getTags: publicProcedure
    .query(() => getTags()),
  
  // Natural healing item endpoints
  createNaturalHealingItem: publicProcedure
    .input(createNaturalHealingItemInputSchema)
    .mutation(({ input }) => createNaturalHealingItem(input)),
  getNaturalHealingItems: publicProcedure
    .query(() => getNaturalHealingItems()),
  getNaturalHealingItemById: publicProcedure
    .input(z.number())
    .query(({ input }) => getNaturalHealingItemById(input)),
  updateNaturalHealingItem: publicProcedure
    .input(updateNaturalHealingItemInputSchema)
    .mutation(({ input }) => updateNaturalHealingItem(input)),
  deleteNaturalHealingItem: publicProcedure
    .input(z.number())
    .mutation(({ input }) => deleteNaturalHealingItem(input)),
  
  // Protocol endpoints
  createProtocol: publicProcedure
    .input(createProtocolInputSchema)
    .mutation(({ input }) => createProtocol(input)),
  getProtocols: publicProcedure
    .query(() => getProtocols()),
  getProtocolById: publicProcedure
    .input(z.number())
    .query(({ input }) => getProtocolById(input)),
  updateProtocol: publicProcedure
    .input(updateProtocolInputSchema)
    .mutation(({ input }) => updateProtocol(input)),
  deleteProtocol: publicProcedure
    .input(z.number())
    .mutation(({ input }) => deleteProtocol(input)),
  
  // Cross-index endpoints
  getItemsByCategory: publicProcedure
    .input(z.number())
    .query(({ input }) => getItemsByCategory(input)),
  getItemsByTag: publicProcedure
    .input(z.number())
    .query(({ input }) => getItemsByTag(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
