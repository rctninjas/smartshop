import type { CategoryDto } from '@smartshop/types';
import { Button } from '../../../shared/ui/button';
import { Card, CardContent } from '../../../shared/ui/card';
import { Input } from '../../../shared/ui/input';
import { Label } from '../../../shared/ui/label';
import { Select } from '../../../shared/ui/select';

type CategoryFormProps = {
  action: string;
  category?: CategoryDto;
  rootCategories: CategoryDto[];
};

export function CategoryForm({ action, category, rootCategories }: CategoryFormProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <form className="grid max-w-2xl gap-4" action={action} method="post">
      {category ? <Input type="hidden" name="id" value={category.id} /> : null}
      <Label className="grid gap-1">
        Название
        <Input name="name" required defaultValue={category?.name ?? ''} />
      </Label>
      <Label className="grid gap-1">
        Slug
        <Input name="slug" required defaultValue={category?.slug ?? ''} />
      </Label>
      <Label className="grid gap-1">
        Родительская категория
        <Select name="parentId" defaultValue={category?.parentId ?? ''}>
          <option value="">Без родителя (корневая)</option>
          {rootCategories
            .filter((item) => item.id !== category?.id)
            .map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
        </Select>
      </Label>
      <Label className="grid gap-1">
        Порядок сортировки
        <Input type="number" name="sortOrder" defaultValue={category?.sortOrder ?? 0} />
      </Label>
      <Button type="submit" className="w-fit">
        {category ? 'Сохранить категорию' : 'Создать категорию'}
      </Button>
        </form>
      </CardContent>
    </Card>
  );
}
