"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { ShareDialog } from "./share-dialog";
import { PusherService, type WebSocketMessage } from "~/lib/websocket";

interface DocumentViewProps {
  document: {
    id: string;
    title: string;
    body: string;
    ownerId: string;
    editors: { id: string }[];
    viewers: { id: string }[];
    owner: {
      name: string | null;
      image: string | null;
    };
  };
  userId: string;
}

export function DocumentView({ document, userId }: DocumentViewProps) {
  const [content, setContent] = useState(document.body);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [activeUsers, setActiveUsers] = useState<number>(1);
  const utils = api.useUtils();
  const router = useRouter();

  // Determine user role
  const isOwner = document.ownerId === userId;
  const isEditor = document.editors.some(editor => editor.id === userId);
  const userRole = isOwner ? "owner" : isEditor ? "editor" : "viewer";

  // Delete mutation
  const deleteDocument = api.document.delete.useMutation({
    onSuccess: () => {
      router.push('/dashboard');
    },
  });

  // Update document mutation with debounce
  const updateDocument = api.document.update.useMutation({
    onSuccess: async () => {
      await utils.document.getById.invalidate({ id: document.id });
    },
  });

  // WebSocket setup with Pusher
  useEffect(() => {
    const ws = new PusherService();
    
    // Only try to connect if we have valid IDs
    if (document.id && userId) {
      ws.connect(document.id, userId);
      
      ws.onMessage((data: WebSocketMessage) => {
        if (data.type === 'content' && data.content) {
          setContent(data.content);
        }
      });
    }

    return () => {
      ws.disconnect();
    };
  }, [document.id, userId]);

  // Send updates through websocket
  const handleContentChange = (newContent: string) => {
    const ws = new PusherService();
    setContent(newContent);
    
    ws.send({
      type: 'content',
      content: newContent,
      documentId: document.id,
      userId: userId
    });

    // Also update in database
    updateDocument.mutate({
      id: document.id,
      body: newContent,
    });
  };

  const roleColors = {
    owner: "text-yellow-500",
    editor: "text-green-500",
    viewer: "text-blue-500"
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold">{document.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              {document.owner.image && (
                <Image
                  src={document.owner.image}
                  alt={document.owner.name ?? "Owner"}
                  width={24}
                  height={24}
                  className="rounded-full"
                />
              )}
              <span className="text-sm text-gray-400">
                Owned by {document.owner.name ?? "Unknown"}
              </span>
              <span className={`text-sm font-medium ${roleColors[userRole]}`}>
                ({userRole})
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-400">
            Active Users: {activeUsers}
          </div>
          {isOwner && (
            <>
              <button
                onClick={() => setIsShareOpen(true)}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20"
                title="Share document"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                </svg>
              </button>
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to delete this document?')) {
                    deleteDocument.mutate({ id: document.id });
                  }
                }}
                className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500"
                title="Delete document"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>

      <textarea
        value={content}
        onChange={(e) => handleContentChange(e.target.value)}
        className="w-full min-h-[500px] rounded-lg bg-white/10 p-4 text-white"
        disabled={userRole === "viewer"}
      />

      {isShareOpen && (
        <ShareDialog
          documentId={document.id}
          isOpen={isShareOpen}
          onClose={() => setIsShareOpen(false)}
        />
      )}
    </div>
  );
}
