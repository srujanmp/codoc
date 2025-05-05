"use client";

import { useState, useEffect } from "react";
import { api } from "~/trpc/react";
import Link from "next/link";
import { ShareDialog } from "./share-dialog";
import Pusher from "pusher-js";

export function Dashboard() {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [shareDocumentId, setShareDocumentId] = useState<string | null>(null);
  const [documentBody, setDocumentBody] = useState<string | null>(null);
  const utils = api.useUtils();

  // Queries
  const { data: ownedDocs } = api.document.getDocuments.useQuery();
  const { data: sharedDocs } = api.document.getShared.useQuery();

  // Mutations
  const createDocument = api.document.create.useMutation({
    onSuccess: async () => {
      await utils.document.getDocuments.invalidate();
      setName("");
      setError(null);
    },
    onError: (e) => {
      setError(e.message);
    },
  });

  const deleteDocument = api.document.delete.useMutation({
    onSuccess: async () => {
      await utils.document.getDocuments.invalidate();
    },
  });

  useEffect(() => {
    if (!shareDocumentId) return; // Ensure shareDocumentId is not null

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      authEndpoint: "/api/pusher/auth",
    });

    const channel = pusher.subscribe(`presence-document-${shareDocumentId}`);
    channel.bind("body-updated", (data: { body: string }) => {
      setDocumentBody(data.body);
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
    };
  }, [shareDocumentId]);

  return (
    <div className="container mx-auto p-4">
      <Link
        href="/"
        className="mb-4 inline-flex items-center text-white hover:text-gray-300"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 mr-1"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          />
        </svg>
        Back
      </Link>

      {/* Create Document Form */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Create New Document</h2>
        {error && <p className="text-red-500 mb-2">{error}</p>}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createDocument.mutate({ name });
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            placeholder="Document Title"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 rounded-lg bg-white/10 px-4 py-2 text-white"
          />
          <button
            type="submit"
            className="rounded-lg bg-white/10 px-4 py-2 font-semibold transition hover:bg-white/20"
            disabled={createDocument.isPending}
          >
            {createDocument.isPending ? "Creating..." : "Create"}
          </button>
        </form>
      </div>

      {/* Your Documents */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Your Documents</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {ownedDocs?.map((doc) => (
            <div key={doc.id} className="p-4 rounded-lg bg-white/5 hover:bg-white/10 relative">
              <div className="absolute top-2 right-2 flex gap-2">
                <button
                  onClick={() => setShareDocumentId(doc.id)}
                  className="p-2 text-purple-500 hover:text-purple-400"
                  title="Share document"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                  </svg>
                </button>
                <button
                  onClick={() => deleteDocument.mutate({ id: doc.id })}
                  className="p-2 text-purple-500 hover:text-purple-400"
                  title="Delete document"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
              <Link href={`/documents/${doc.id}`} className="block">
                <h3 className="font-bold">{doc.title}</h3>
                <p className="text-sm text-gray-400">
                  Created: {doc.createdAt.toLocaleDateString()}
                </p>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Shared Documents */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Shared With You</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {sharedDocs?.map((doc) => (
            <Link
              key={doc.id}
              href={`/documents/${doc.id}`}
              className="p-4 rounded-lg bg-white/5 hover:bg-white/10"
            >
              <h3 className="font-bold">{doc.title}</h3>
              <p className="text-sm text-gray-400">
                Created: {doc.createdAt.toLocaleDateString()}
              </p>
            </Link>
          ))}
        </div>
      </div>

      <ShareDialog
        documentId={shareDocumentId ?? ""}
        isOpen={shareDocumentId !== null}
        onClose={() => setShareDocumentId(null)}
      />
    </div>
  );
}
