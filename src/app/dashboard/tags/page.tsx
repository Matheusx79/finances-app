import { requireHousehold } from "@/lib/current-household";
import { listTags } from "@/domain/tags/list-tags";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createTagAction } from "./actions";
import { TagRow } from "./tag-row";

export default async function TagsPage() {
  const { supabase, householdId } = await requireHousehold();
  const tags = await listTags(supabase, { householdId });

  return (
    <div className="flex w-full max-w-sm flex-col gap-4 lg:max-w-5xl">
      <h1 className="font-heading text-2xl font-medium">Etiquetas</h1>

      <Card className="lg:max-w-sm">
        <CardHeader>
          <CardTitle>Nova etiqueta</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createTagAction} className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" name="name" placeholder="Ex.: Reembolsável" required />
            </div>
            <Button type="submit">Adicionar</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Suas etiquetas</CardTitle>
        </CardHeader>
        <CardContent>
          {tags.length === 0 ? (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Nenhuma etiqueta cadastrada ainda.
            </p>
          ) : (
            <ul className="flex flex-col gap-2 lg:grid lg:grid-cols-2 xl:grid-cols-3">
              {tags.map((tag) => (
                <TagRow key={tag.id} tag={tag} />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
