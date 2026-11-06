"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Dialog } from "@/shared/ui/dialog";

interface Props {
  /** E-mails que serão excluídos; vazio fecha o diálogo. */
  emails: string[];
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

/** Um usuário: digitar o e-mail. Vários: digitar EXCLUIR. */
export function ConfirmDeleteDialog({ emails, busy, onCancel, onConfirm }: Props) {
  return (
    <Dialog
      isOpen={emails.length > 0}
      onClose={onCancel}
      title={emails.length === 1 ? "Excluir usuário" : `Excluir ${emails.length} usuários`}
      description="Apaga a conta e todos os dados (tarefas, finanças, hábitos e perfil) de forma permanente."
      containerClassName="z-[60]"
    >
      {emails.length > 0 ? <ConfirmBody key={emails.join("|")} emails={emails} busy={busy} onCancel={onCancel} onConfirm={onConfirm} /> : null}
    </Dialog>
  );
}

function ConfirmBody({ emails, busy, onCancel, onConfirm }: Props) {
  const [typed, setTyped] = useState("");
  const expected = emails.length === 1 ? emails[0] : "EXCLUIR";
  const matches = typed.trim().toLowerCase() === expected.toLowerCase();

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (matches && !busy) onConfirm();
      }}
    >
      {emails.length > 1 ? (
        <ul className="max-h-32 overflow-auto rounded-xl border border-zinc-200 p-2 text-xs text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
          {emails.map((email) => (
            <li key={email} className="truncate">{email}</li>
          ))}
        </ul>
      ) : null}
      <label className="block text-sm text-zinc-700 dark:text-zinc-300">
        Para confirmar, digite <strong className="break-all">{expected}</strong>
        <input
          autoFocus
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          className="mt-2 h-10 w-full rounded-xl border border-zinc-200 bg-transparent px-3 text-sm dark:border-zinc-800"
        />
      </label>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="cursor-pointer rounded-xl border border-zinc-300 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
          Cancelar
        </button>
        <button type="submit" disabled={!matches || busy} className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50">
          <Trash2 className="h-3.5 w-3.5" /> {busy ? "Excluindo…" : "Excluir"}
        </button>
      </div>
    </form>
  );
}
