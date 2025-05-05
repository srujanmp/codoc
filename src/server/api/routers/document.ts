import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const documentRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      // Check document count
      const documentCount = await ctx.db.document.count({
        where: { ownerId: ctx.session.user.id },
      });

      if (documentCount >= 10) {
        throw new Error("You have reached the maximum limit of 10 documents");
      }

      return ctx.db.document.create({
        data: {
          title: input.name,
          body: "your journey begins here...", 
          owner: { connect: { id: ctx.session.user.id } },
        },
      });
    }),

  getDocuments: protectedProcedure.query(async ({ ctx }) => {
    const document = await ctx.db.document.findMany({
      orderBy: { createdAt: "desc" },
      where: { owner: { id: ctx.session.user.id } },
    });

    return document ?? null;
  }),

  getShared: protectedProcedure.query(async ({ ctx }) => {
    const document = await ctx.db.document.findMany({
      orderBy: { createdAt: "desc" },
      where: {
        OR: [
          { editors: { some: { id: ctx.session.user.id } } },
          { viewers: { some: { id: ctx.session.user.id } } }
        ],
      },
    });

    return document ?? null;
  }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership before deletion
      const document = await ctx.db.document.findFirst({
        where: {
          id: input.id,
          ownerId: ctx.session.user.id,
        },
      });

      if (!document) {
        throw new Error("Document not found or unauthorized");
      }

      return ctx.db.document.delete({
        where: { id: input.id },
      });
    }),
});
