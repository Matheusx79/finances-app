import type { Category } from "@/domain/categories/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { formatBRL, formatDateBR } from "@/lib/currency";
import type { OfxBatchRow } from "./batch-codec";

const SELECT_CLASSNAME =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30";

/**
 * Server-rendered staging list — every field the confirm action needs
 * (date/amount/type/description/fitid) round-trips as a hidden input per
 * row rather than being held in client state; only `categoryId` and
 * `include` are live user input. A duplicate-flagged row (`row.duplicate`,
 * from the upload action's `external_id` check) starts unchecked with a
 * "já importado" label, but the checkbox stays interactive — the user can
 * still re-include it, which is why `importTransactions` re-checks
 * duplicates itself rather than trusting this flag.
 */
export function OfxStagingForm({
  action,
  rows,
  categories,
  accountId,
  ownerId,
  accountName,
  ownerName,
}: {
  action: (formData: FormData) => Promise<void>;
  rows: OfxBatchRow[];
  categories: Category[];
  accountId: string;
  ownerId: string;
  accountName: string;
  ownerName: string;
}) {
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="accountId" value={accountId} />
      <input type="hidden" name="ownerId" value={ownerId} />
      <input type="hidden" name="rowCount" value={rows.length} />

      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Conta: <strong className="text-foreground">{accountName}</strong> · Responsável:{" "}
        <strong className="text-foreground">{ownerName}</strong>
      </p>

      {rows.length === 0 ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Nenhuma transação encontrada no arquivo.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((row, i) => (
            <li
              key={i}
              className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800 lg:flex-row lg:items-center lg:justify-between"
            >
              <input type="hidden" name={`date-${i}`} value={row.date} />
              <input type="hidden" name={`amount-${i}`} value={row.amount} />
              <input type="hidden" name={`type-${i}`} value={row.type} />
              <input type="hidden" name={`description-${i}`} value={row.description} />
              <input type="hidden" name={`fitid-${i}`} value={row.fitid ?? ""} />

              <div className="flex flex-col gap-1 text-sm">
                <span className="flex items-center gap-2">
                  <span className="text-zinc-600 dark:text-zinc-400">
                    {formatDateBR(row.date)}
                  </span>
                  <span
                    className={
                      row.type === "expense"
                        ? "font-medium text-red-600 dark:text-red-400"
                        : "font-medium text-green-600 dark:text-green-400"
                    }
                  >
                    {row.type === "expense" ? "-" : "+"}
                    {formatBRL(row.amount)}
                  </span>
                  {row.duplicate && (
                    <span className="text-xs text-amber-600 dark:text-amber-500">
                      já importado
                    </span>
                  )}
                </span>
                <span className="text-zinc-500">{row.description || "Sem descrição"}</span>
              </div>

              <div className="flex items-center gap-3">
                <select
                  name={`categoryId-${i}`}
                  defaultValue=""
                  aria-label="Categoria"
                  className={SELECT_CLASSNAME}
                >
                  <option value="">Nenhuma</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>

                <Label htmlFor={`include-${i}`} className="whitespace-nowrap text-sm">
                  <input
                    id={`include-${i}`}
                    type="checkbox"
                    name={`include-${i}`}
                    defaultChecked={!row.duplicate}
                  />
                  Incluir
                </Label>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Button type="submit" disabled={rows.length === 0}>
        Confirmar importação
      </Button>
    </form>
  );
}
