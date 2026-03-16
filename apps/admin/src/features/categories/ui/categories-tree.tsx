import type { CategoryTreeNodeDto } from '@smartshop/types';
import Link from 'next/link';
import { Card, CardContent } from '../../../shared/ui/card';

type CategoriesTreeProps = {
  nodes: CategoryTreeNodeDto[];
};

function Tree({ nodes }: CategoriesTreeProps) {
  return (
    <ul className="grid gap-2">
      {nodes.map((node) => (
        <li key={node.id}>
          <div className="rounded-md border bg-white px-3 py-2 text-sm">
            <span>
              <Link className="font-medium text-slate-900 hover:underline" href={`/categories/${node.id}`}>
                {node.name}
              </Link>{' '}
              <span className="text-slate-500">({node.slug})</span>
            </span>
            {node.children.length ? <div className="mt-2 pl-4"><Tree nodes={node.children} /></div> : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

export function CategoriesTree({ nodes }: CategoriesTreeProps) {
  return (
    <section>
      {nodes.length ? (
        <Tree nodes={nodes} />
      ) : (
        <Card>
          <CardContent className="p-6">
            <h3 className="mb-1 text-base font-semibold">Пока нет категорий</h3>
            <p className="text-sm text-slate-600">Создайте первую категорию, чтобы начать работу с каталогом.</p>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
