"use client";

import { useState } from "react";
import { api } from "~/trpc/react";

interface ShareDialogProps {
  documentId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ShareDialog({ documentId, isOpen, onClose }: ShareDialogProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"editor" | "viewer">("viewer");
  const [error, setError] = useState<string | null>(null);

  const shareDocument = api.document.share.useMutation({
    onSuccess: () => {
      setEmail("");
      setError(null);
      onClose();
    },
    onError: (e) => {
      setError(e.message);
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-white/10 p-6 rounded-lg w-96">
        <h2 className="text-xl font-bold mb-4">Share Document</h2>
        {error && <p className="text-red-500 mb-2">{error}</p>}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            shareDocument.mutate({
              documentId,
              email,
              role,
            });
          }}
          className="space-y-4"
        >
          <input
            type="email"
            placeholder="User's email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg bg-white/10 px-4 py-2 text-white"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "editor" | "viewer")}
            className="w-full rounded-lg bg-white/10 px-4 py-2 text-white"
          >
            <option value="viewer">Viewer</option>
            <option value="editor">Editor</option>
          </select>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20"
              disabled={shareDocument.isPending}
            >
              {shareDocument.isPending ? "Sharing..." : "Share"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
