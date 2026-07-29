"use client";

import { useState } from "react";
import type { Account } from "@/domain/accounts/types";
import type { HouseholdMember } from "@/domain/household/types";
import { CARD_BILL_PROMPT_TEMPLATE } from "@/domain/card-bill/prompt-template";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const SELECT_CLASSNAME =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30";

/**
 * Paste flow for "Fatura do cartão": the extraction step happens outside
 * this app, in the user's own Claude.ai chat — this form only offers the
 * prompt to copy and a textarea for Claude's JSON reply, plus the same
 * batch-level Conta/Responsável pickers OFX upload uses.
 */
export function CardBillPasteForm({
  action,
  accounts,
  members,
}: {
  action: (formData: FormData) => Promise<void>;
  accounts: Account[];
  members: HouseholdMember[];
}) {
  const [copied, setCopied] = useState(false);

  async function copyPrompt() {
    await navigator.clipboard.writeText(CARD_BILL_PROMPT_TEMPLATE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <form action={action} className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <Label htmlFor="prompt-template">Prompt para o Claude.ai</Label>
        <textarea
          id="prompt-template"
          readOnly
          value={CARD_BILL_PROMPT_TEMPLATE}
          rows={6}
          className="w-full rounded-lg border border-input bg-muted px-2.5 py-2 text-xs text-zinc-600 dark:text-zinc-400"
        />
        <Button type="button" variant="outline" onClick={copyPrompt}>
          {copied ? "Copiado!" : "Copiar"}
        </Button>
        <p className="text-xs text-zinc-500">
          Copie o prompt acima, cole no seu chat do Claude.ai junto com o PDF da fatura e cole a
          resposta em JSON abaixo.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="paste">Resposta em JSON</Label>
        <textarea
          id="paste"
          name="paste"
          required
          rows={8}
          placeholder='[{"data": "2026-07-10", "descricao": "...", "valor": 45.9, "parcela": null}]'
          className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 font-mono text-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="accountId">Conta</Label>
        <select id="accountId" name="accountId" defaultValue="" className={SELECT_CLASSNAME} required>
          <option value="" disabled>
            Selecione
          </option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="ownerId">Responsável</Label>
        <select id="ownerId" name="ownerId" defaultValue="" className={SELECT_CLASSNAME} required>
          <option value="" disabled>
            Selecione
          </option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.displayName}
            </option>
          ))}
        </select>
      </div>

      <Button type="submit">Importar</Button>
    </form>
  );
}
