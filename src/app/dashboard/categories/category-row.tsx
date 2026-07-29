"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { renameCategoryAction, deleteCategoryAction } from "./actions";

export function CategoryRow({ category }: { category: { id: string; name: string } }) {
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <li className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5">
        <span className="truncate text-sm font-medium">{category.name}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Editar categoria ${category.name}`}
          onClick={() => setEditing(true)}
        >
          <Pencil />
        </Button>
      </li>
    );
  }

  return (
    <li className="flex flex-col gap-2 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
      <form action={renameCategoryAction} className="flex flex-1 gap-2 min-w-0">
        <input type="hidden" name="categoryId" value={category.id} />
        <Input
          name="name"
          defaultValue={category.name}
          aria-label={`Nome da categoria ${category.name}`}
          required
          autoFocus
          className="min-w-0"
        />
        <Button type="submit" variant="outline" size="sm">
          Salvar
        </Button>
      </form>
      <div className="flex gap-2">
        <form action={deleteCategoryAction}>
          <input type="hidden" name="categoryId" value={category.id} />
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
