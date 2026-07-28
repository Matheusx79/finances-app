import type { Account } from "@/domain/accounts/types";
import type { HouseholdMember } from "@/domain/household/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const SELECT_CLASSNAME =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30";

/**
 * Unlike `TransactionForm`'s "Responsável" (optional — blank means shared),
 * `ownerId` here has no blank option: every ticket requires the whole
 * import be attributed to a single account and a single household member.
 */
export function OfxUploadForm({
  action,
  accounts,
  members,
}: {
  action: (formData: FormData) => Promise<void>;
  accounts: Account[];
  members: HouseholdMember[];
}) {
  return (
    <form action={action} encType="multipart/form-data" className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <Label htmlFor="file">Arquivo OFX</Label>
        <input
          id="file"
          name="file"
          type="file"
          accept=".ofx,.qfx"
          required
          className="text-sm file:mr-2 file:rounded-lg file:border-0 file:bg-muted file:px-2.5 file:py-1 file:text-sm"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="accountId">Conta</Label>
        <select
          id="accountId"
          name="accountId"
          defaultValue=""
          className={SELECT_CLASSNAME}
          required
        >
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
        <select
          id="ownerId"
          name="ownerId"
          defaultValue=""
          className={SELECT_CLASSNAME}
          required
        >
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
