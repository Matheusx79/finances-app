import { requireHousehold } from "@/lib/current-household";
import { listCategories } from "@/domain/categories/list-categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createCategoryAction } from "./actions";
import { CategoryRow } from "./category-row";

export default async function CategoriesPage() {
  const { supabase, householdId } = await requireHousehold();
  const categories = await listCategories(supabase, { householdId });

  return (
    <div className="flex w-full max-w-sm flex-col gap-4 lg:max-w-5xl">
      <h1 className="font-heading text-2xl font-medium">Categorias</h1>

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
            <p className="text-sm text-muted-foreground">Nenhuma categoria cadastrada ainda.</p>
          ) : (
            <ul className="flex flex-col gap-2 lg:grid lg:grid-cols-2 xl:grid-cols-3">
              {categories.map((category) => (
                <CategoryRow key={category.id} category={category} />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
