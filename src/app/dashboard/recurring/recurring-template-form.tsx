import type { Account } from "@/domain/accounts/types";
import type { Category } from "@/domain/categories/types";
import type { HouseholdMember } from "@/domain/household/types";
import type { RecurringTemplate } from "@/domain/recurring/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const SELECT_CLASSNAME =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30";

/**
 * Shared create/edit form for recurring templates — same shape/rationale as
 * `TransactionForm` (category field always shown; required-for-expense is
 * enforced server-side, not by conditionally hiding the field with client
 * JS), minus the date field and plus `dayOfMonth`.
 */
export function RecurringTemplateForm({
  action,
  accounts,
  categories,
  members,
  submitLabel,
  template,
}: {
  action: (formData: FormData) => Promise<void>;
  accounts: Account[];
  categories: Category[];
  members: HouseholdMember[];
  submitLabel: string;
  template?: RecurringTemplate;
}) {
  const fieldId = template?.id ?? "new";

  return (
    <form
      action={action}
      className="flex flex-col gap-3 lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-4 lg:gap-y-3"
    >
      {template && <input type="hidden" name="templateId" value={template.id} />}

      <div className="flex flex-col gap-2">
        <Label htmlFor={`type-${fieldId}`}>Tipo</Label>
        <select
          id={`type-${fieldId}`}
          name="type"
          defaultValue={template?.type ?? "expense"}
          className={SELECT_CLASSNAME}
          required
        >
          <option value="expense">Despesa</option>
          <option value="income">Receita</option>
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`amount-${fieldId}`}>Valor (R$)</Label>
        <Input
          id={`amount-${fieldId}`}
          name="amount"
          type="number"
          step="0.01"
          min="0.01"
          defaultValue={template?.amount}
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`dayOfMonth-${fieldId}`}>Dia do mês</Label>
        <Input
          id={`dayOfMonth-${fieldId}`}
          name="dayOfMonth"
          type="number"
          step="1"
          min="1"
          max="31"
          defaultValue={template?.dayOfMonth ?? 1}
          required
        />
        <p className="text-xs text-muted-foreground">
          Em meses mais curtos, lança no último dia do mês.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`account-${fieldId}`}>Conta</Label>
        <select
          id={`account-${fieldId}`}
          name="accountId"
          defaultValue={template?.accountId ?? ""}
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
        <Label htmlFor={`category-${fieldId}`}>
          Categoria <span className="text-muted-foreground">(obrigatória para despesas)</span>
        </Label>
        <select
          id={`category-${fieldId}`}
          name="categoryId"
          defaultValue={template?.categoryId ?? ""}
          className={SELECT_CLASSNAME}
        >
          <option value="">Nenhuma</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`owner-${fieldId}`}>Responsável</Label>
        <select
          id={`owner-${fieldId}`}
          name="owner"
          defaultValue={template?.ownerHouseholdMemberId ?? ""}
          className={SELECT_CLASSNAME}
        >
          <option value="">Compartilhado</option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.displayName}
            </option>
          ))}
        </select>
      </div>

      <Button type="submit" className="lg:col-span-2">
        {submitLabel}
      </Button>
    </form>
  );
}
