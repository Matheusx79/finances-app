"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { renameTagAction, deleteTagAction } from "./actions";

export function TagRow({ tag }: { tag: { id: string; name: string } }) {
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <li className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5">
        <span className="truncate text-sm font-medium">{tag.name}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Editar etiqueta ${tag.name}`}
          onClick={() => setEditing(true)}
        >
          <Pencil />
        </Button>
      </li>
    );
  }

  return (
    <li className="flex flex-col gap-2 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
      <form action={renameTagAction} className="flex flex-1 gap-2 min-w-0">
        <input type="hidden" name="tagId" value={tag.id} />
        <Input
          key={tag.name}
          name="name"
          defaultValue={tag.name}
          aria-label={`Nome da etiqueta ${tag.name}`}
          required
          autoFocus
          className="min-w-0"
        />
        <Button type="submit" variant="outline" size="sm">
          Salvar
        </Button>
      </form>
      <div className="flex gap-2">
        <form action={deleteTagAction}>
          <input type="hidden" name="tagId" value={tag.id} />
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
