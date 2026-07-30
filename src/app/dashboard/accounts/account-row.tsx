"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { formatBRL } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { renameAccountAction, deleteAccountAction } from "./actions";

export function AccountRow({
  account,
  balance,
}: {
  account: { id: string; name: string };
  balance: number;
}) {
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <li className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5">
        <span className="truncate text-sm font-medium">{account.name}</span>
        <div className="flex shrink-0 items-center gap-3">
          <span className="text-sm font-medium whitespace-nowrap">
            {formatBRL(balance)}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Editar conta ${account.name}`}
            onClick={() => setEditing(true)}
          >
            <Pencil />
          </Button>
        </div>
      </li>
    );
  }

  return (
    <li className="flex flex-col gap-2 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
      <form action={renameAccountAction} className="flex flex-1 items-center gap-2 min-w-0">
        <input type="hidden" name="accountId" value={account.id} />
        <Input
          name="name"
          defaultValue={account.name}
          aria-label={`Nome da conta ${account.name}`}
          required
          autoFocus
          className="min-w-0"
        />
        <span className="shrink-0 text-sm font-medium whitespace-nowrap">{formatBRL(balance)}</span>
        <Button type="submit" variant="outline" size="sm">
          Salvar
        </Button>
      </form>
      <div className="flex gap-2">
        <form action={deleteAccountAction}>
          <input type="hidden" name="accountId" value={account.id} />
          <Button type="submit" variant="destructive" size="sm">
            Excluir
          </Button>
        </form>
        <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
          Cancelar
        </Button>
      </div>
    </li>
  );
}
