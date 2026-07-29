import { requireHousehold } from "@/lib/current-household";
import { listCategories } from "@/domain/categories/list-categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createCategoryAction, deleteCategoryAction, renameCategoryAction } from "./actions";

export default async function CategoriesPage() {
  const { supabase, householdId } = await requireHousehold();
  const categories = await listCategories(supabase, { householdId });

  return (
    <div className="flex w-full max-w-sm flex-col gap-4 lg:max-w-5xl">
      <h1 className="text-xl font-semibold">Categorias</h1>

      <Card className="lg:max-w-sm">
        <CardHeader>
          <CardTitle>Nova categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createCategoryAction} className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" name="name" placeholder="Ex.: Lazer" required />
            </div>
            <Button type="submit">Adicionar</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Suas categorias</CardTitle>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Nenhuma categoria cadastrada ainda.
            </p>
          ) : (
            <ul className="flex flex-col gap-3 lg:grid lg:grid-cols-2 xl:grid-cols-3">
              {categories.map((category) => (
                <li
                  key={category.id}
                  className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between"
                >
                  <form action={renameCategoryAction} className="flex flex-1 gap-2">
                    <input type="hidden" name="categoryId" value={category.id} />
                    <Input
                      name="name"
                      defaultValue={category.name}
                      aria-label={`Nome da categoria ${category.name}`}
                      required
                    />
                    <Button type="submit" variant="outline" size="sm">
                      Salvar
                    </Button>
                  </form>
                  <form action={deleteCategoryAction}>
                    <input type="hidden" name="categoryId" value={category.id} />
                    <Button type="submit" variant="destructive" size="sm">
                      Excluir
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
