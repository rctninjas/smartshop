'use client';

import { useMemo, useState } from 'react';
import type {
  CategoryAttributeFieldDto,
  CategoryAttributeFieldType,
  CategoryAttributesSchemaResponse
} from '@smartshop/types';
import { Alert } from '../../../shared/ui/alert';
import { Badge } from '../../../shared/ui/badge';
import { Button } from '../../../shared/ui/button';
import { Card, CardContent } from '../../../shared/ui/card';
import { Input } from '../../../shared/ui/input';
import { Label } from '../../../shared/ui/label';
import { Select } from '../../../shared/ui/select';

type AttributesSchemaEditorProps = {
  categoryId: string;
  schema: CategoryAttributesSchemaResponse;
};

type EditableField = CategoryAttributeFieldDto;

const typeOptions: CategoryAttributeFieldType[] = ['text', 'number', 'boolean', 'select', 'multiselect'];

function toEditableFields(schema: CategoryAttributesSchemaResponse): EditableField[] {
  if (schema.draft) {
    return schema.draft.fields;
  }
  if (schema.active) {
    return schema.active.fields;
  }
  return [];
}

function parseOptions(raw: string): string[] {
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function AttributesSchemaEditor({ categoryId, schema }: AttributesSchemaEditorProps) {
  const [fields, setFields] = useState<EditableField[]>(toEditableFields(schema));
  const initialJson = useMemo(() => JSON.stringify(fields), [fields]);
  const duplicateKeys = useMemo(() => {
    const normalized = fields.map((field) => field.key.trim()).filter(Boolean);
    return normalized.filter((key, index) => normalized.indexOf(key) !== index);
  }, [fields]);

  function updateField(index: number, patch: Partial<EditableField>) {
    setFields((current) => current.map((field, idx) => (idx === index ? { ...field, ...patch } : field)));
  }

  function removeField(index: number) {
    setFields((current) => current.filter((_, idx) => idx !== index));
  }

  function addField() {
    setFields((current) => [
      ...current,
      {
        key: '',
        label: '',
        type: 'text',
        required: false,
        options: []
      }
    ]);
  }

  return (
    <Card>
      <CardContent className="grid gap-4 p-5">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-semibold">Схема характеристик</h2>
        <Badge variant="info">Активная: {schema.active?.version ?? '-'}</Badge>
        <Badge variant="warning">Черновик: {schema.draft?.version ?? 'не создан'}</Badge>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <form action="/admin/api/admin-crud/categories/attributes/create-draft" method="post">
          <input type="hidden" name="categoryId" value={categoryId} />
          <Button type="submit" variant="outline">
            Создать черновик
          </Button>
        </form>
        <form action="/admin/api/admin-crud/categories/attributes/publish" method="post">
          <input type="hidden" name="categoryId" value={categoryId} />
          <Button type="submit">Опубликовать черновик</Button>
        </form>
      </div>
      {duplicateKeys.length ? (
        <Alert variant="warning">
          Найдены повторяющиеся ключи: {Array.from(new Set(duplicateKeys)).join(', ')}. Сохранение черновика будет
          недоступно, пока не устраните дубли.
        </Alert>
      ) : null}

      <div className="grid gap-3">
        {fields.map((field, index) => (
          <div key={`${index}-${field.key}`} className="grid gap-3 rounded-lg border bg-white p-3">
            <Label className="grid gap-1">
              Ключ
              <Input
                value={field.key}
                onChange={(event) => updateField(index, { key: event.target.value })}
                placeholder="material_key"
              />
            </Label>
            <Label className="grid gap-1">
              Название
              <Input
                value={field.label}
                onChange={(event) => updateField(index, { label: event.target.value })}
                placeholder="Материал"
              />
            </Label>
            <Label className="grid gap-1">
              Тип
              <Select
                value={field.type}
                onChange={(event) => updateField(index, { type: event.target.value as CategoryAttributeFieldType })}
              >
                {typeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
            </Label>
            <Label className="grid gap-1">
              Обязательное
              <Input
                type="checkbox"
                checked={Boolean(field.required)}
                onChange={(event) => updateField(index, { required: event.target.checked })}
              />
            </Label>
            <Label className="grid gap-1">
              Варианты (через запятую)
              <Input
                value={(field.options ?? []).join(', ')}
                onChange={(event) => updateField(index, { options: parseOptions(event.target.value) })}
                disabled={field.type !== 'select' && field.type !== 'multiselect'}
              />
            </Label>
            <Button type="button" variant="destructive" className="w-fit" onClick={() => removeField(index)}>
              Удалить
            </Button>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" onClick={addField}>
          Добавить поле
        </Button>
        <form action="/admin/api/admin-crud/categories/attributes/save-draft" method="post">
          <input type="hidden" name="categoryId" value={categoryId} />
          <input type="hidden" name="fields" value={initialJson} />
          <Button type="submit" disabled={duplicateKeys.length > 0}>
            Сохранить черновик
          </Button>
        </form>
      </div>
      </CardContent>
    </Card>
  );
}
