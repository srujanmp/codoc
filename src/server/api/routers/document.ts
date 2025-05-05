import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import PusherServer from "~/lib/pusher-server";

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

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const document = await ctx.db.document.findFirst({
        where: {
          id: input.id,
          OR: [
            { ownerId: ctx.session.user.id },
            { editors: { some: { id: ctx.session.user.id } } },
            { viewers: { some: { id: ctx.session.user.id } } },
          ],
        },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              image: true,
            }
          },
          editors: {
            select: {
              id: true,
            }
          },
          viewers: {
            select: {
              id: true,
            }
          }
        }
      });

      if (!document) {
        throw new Error(
         "Document not found or access denied"
        );
      }

      return document;
    }),

  update: protectedProcedure
    .input(z.object({ 
      id: z.string(),
      body: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const document = await ctx.db.document.findFirst({
        where: {
          id: input.id,
          OR: [
            { ownerId: ctx.session.user.id },
            { editors: { some: { id: ctx.session.user.id } } },
          ],
        },
      });

      if (!document) {
        throw new Error(
          "Document not found or access denied"
        );
      }

      return ctx.db.document.update({
        where: { id: input.id },
        data: { 
          body: input.body,
          lastActive: new Date(),
        },
      });
    }),

  share: protectedProcedure
    .input(
      z.object({
        documentId: z.string(),
        email: z.string().email(),
        role: z.enum(["editor", "viewer"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // First verify the user is the owner
      const document = await ctx.db.document.findFirst({
        where: {
          id: input.documentId,
          ownerId: ctx.session.user.id,
        },
      });

      if (!document) {
        throw new Error("Document not found or unauthorized");
      }

      // Find the user to share with
      const shareUser = await ctx.db.user.findUnique({
        where: { email: input.email },
      });

      if (!shareUser) {
        throw new Error("User not found with this email");
      }

      // Update document with new share settings
      return ctx.db.document.update({
        where: { id: input.documentId },
        data: {
          [input.role === "editor" ? "editors" : "viewers"]: {
            connect: { id: shareUser.id },
          },
        },
      });
    }),

  updateBody: protectedProcedure
    .input(z.object({ id: z.string(), body: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const document = await ctx.db.document.findFirst({
        where: {
          id: input.id,
          OR: [
            { ownerId: ctx.session.user.id },
            { editors: { some: { id: ctx.session.user.id } } },
          ],
        },
      });

      if (!document) {
        throw new Error("Document not found or unauthorized");
      }

      const updatedDocument = await ctx.db.document.update({
        where: { id: input.id },
        data: { body: input.body, lastActive: new Date() },
      });

      const pusher = PusherServer.getInstance();
      pusher.trigger(`presence-document-${input.id}`, "body-updated", {
        body: input.body,
        updatedAt: new Date(),
      });

      return updatedDocument;
    }),
});
