import type { ProductDto } from '@smartshop/types';
import Link from 'next/link';
import { Badge } from '../../../shared/ui/badge';
import { Button } from '../../../shared/ui/button';
import { Card, CardContent } from '../../../shared/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../shared/ui/table';

type CatalogAdminTableProps = {
  items: ProductDto[];
};

export function CatalogAdminTable({ items }: CatalogAdminTableProps) {
  if (!items.length) {
    return (
      <Card>
        <CardContent className="p-6">
          <h3 className="mb-1 text-base font-semibold">Пока нет товаров</h3>
          <p className="text-sm text-slate-600">Создайте первый товар, чтобы он появился в каталоге.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Название</TableHead>
              <TableHead>Цена</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Варианты</TableHead>
              <TableHead>Обновлён</TableHead>
              <TableHead>Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell>
              <div className="flex flex-col">
                <Link href={`/catalog/${item.id}`}>{item.title}</Link>
                <span className="text-xs text-slate-600">Артикул: {item.itemNumber}</span>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex flex-col">
                <span>{item.price} RUB</span>
                {item.sale !== null ? <span className="text-xs text-slate-600">Со скидкой: {item.sale} RUB</span> : null}
              </div>
            </TableCell>
            <TableCell>
              {item.isPublished ? (
                <Badge variant="success">Опубликован</Badge>
              ) : (
                <Badge variant="warning">Черновик</Badge>
              )}
            </TableCell>
            <TableCell>{item.variants.length}</TableCell>
            <TableCell>{new Date(item.updatedAt).toLocaleString()}</TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/catalog/${item.id}`}>Редактировать</Link>
                </Button>
                <form action="/api/admin-crud/catalog/publish" method="post">
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="isPublished" value={item.isPublished ? 'false' : 'true'} />
                  <Button type="submit" variant="outline" size="sm">
                    {item.isPublished ? 'Снять с публикации' : 'Опубликовать'}
                  </Button>
                </form>
                <form action={`/api/admin-crud/catalog/delete?id=${item.id}`} method="post">
                  <input type="hidden" name="id" value={item.id} />
                  <Button type="submit" variant="destructive" size="sm">
                    Удалить
                  </Button>
                </form>
              </div>
            </TableCell>
          </TableRow>
        ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
