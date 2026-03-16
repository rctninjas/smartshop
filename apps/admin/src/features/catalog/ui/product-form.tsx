'use client';

import { useEffect, useMemo, useState } from 'react';
import type {
  CategoryAttributeFieldDto,
  CategoryAttributeSchemaDto,
  CategoryDto,
  ProductDto
} from '@smartshop/types';
import { Alert } from '../../../shared/ui/alert';
import { Button } from '../../../shared/ui/button';
import { Card, CardContent } from '../../../shared/ui/card';
import { Input } from '../../../shared/ui/input';
import { Label } from '../../../shared/ui/label';
import { Select } from '../../../shared/ui/select';
import { Textarea } from '../../../shared/ui/textarea';

type ProductFormProps = {
  mode: 'create' | 'edit';
  action: string;
  categories: CategoryDto[];
  activeSchemasByCategoryId: Record<string, CategoryAttributeSchemaDto | null>;
  product?: ProductDto;
};

type ProductFormValues = {
  title: string;
  itemNumber: string;
  slug: string;
  description: string;
  categoryId: string;
  price: string;
  sale: string;
};

type ProductFormField = keyof ProductFormValues;
type ProductFormErrors = Partial<Record<ProductFormField, string>>;

function toPrettyJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function defaultValueForField(field: CategoryAttributeFieldDto): unknown {
  if (field.type === 'boolean') {
    return false;
  }
  if (field.type === 'multiselect') {
    return [];
  }
  return '';
}

export function ProductForm({ mode, action, categories, activeSchemasByCategoryId, product }: ProductFormProps) {
  const initialCategoryId = product?.categoryId ?? categories[0]?.id ?? '';
  const [values, setValues] = useState<ProductFormValues>({
    title: product?.title ?? '',
    itemNumber: product?.itemNumber ?? '',
    slug: product?.slug ?? '',
    description: product?.description ?? '',
    categoryId: initialCategoryId,
    price: String(product?.price ?? 0),
    sale: product?.sale === null || product?.sale === undefined ? '' : String(product.sale)
  });
  const [attributesSnapshot, setAttributesSnapshot] = useState<Record<string, unknown>>(
    (product?.attributesSnapshot ?? {}) as Record<string, unknown>
  );
  const [schemaVersion, setSchemaVersion] = useState<number | ''>(product?.schemaVersion ?? '');
  const [variantsText, setVariantsText] = useState(
    toPrettyJson(
      product?.variants.map((variant) => ({
        sku: variant.sku,
        color: variant.color,
        size: variant.size,
        stock: variant.stock
      })) ?? []
    )
  );
  const [imagesText, setImagesText] = useState(
    toPrettyJson(
      product?.images.map((image) => ({
        url: image.url,
        sortOrder: image.sortOrder
      })) ?? []
    )
  );
  const [fieldErrors, setFieldErrors] = useState<ProductFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const activeSchema = activeSchemasByCategoryId[values.categoryId];
  const activeFields = useMemo(() => activeSchema?.fields ?? [], [activeSchema]);

  const inputErrorClass = 'border-red-500 focus-visible:ring-red-400';
  const fieldErrorClass = 'text-sm text-red-600';

  function clearFieldError(field: ProductFormField) {
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  }

  function updateValue(field: ProductFormField, nextValue: string) {
    setValues((current) => ({ ...current, [field]: nextValue }));
    clearFieldError(field);
    setFormError(null);
  }

  function validateForm(): ProductFormErrors {
    const nextErrors: ProductFormErrors = {};

    if (!values.title.trim()) {
      nextErrors.title = 'Укажите название товара.';
    }
    if (!values.slug.trim()) {
      nextErrors.slug = 'Укажите slug товара.';
    }
    if (!values.itemNumber.trim()) {
      nextErrors.itemNumber = 'Укажите артикул товара.';
    } else if (values.itemNumber.length > 100) {
      nextErrors.itemNumber = 'Артикул должен содержать не более 100 символов.';
    }
    if (!values.categoryId.trim()) {
      nextErrors.categoryId = 'Выберите категорию.';
    }

    const priceNumber = Number(values.price);
    if (!values.price.trim()) {
      nextErrors.price = 'Укажите цену товара.';
    } else if (!Number.isFinite(priceNumber) || priceNumber < 0) {
      nextErrors.price = 'Цена должна быть неотрицательным числом.';
    }

    if (values.sale.trim()) {
      const saleNumber = Number(values.sale);
      if (!Number.isFinite(saleNumber) || saleNumber < 0) {
        nextErrors.sale = 'Цена со скидкой должна быть неотрицательным числом.';
      } else if (Number.isFinite(priceNumber) && saleNumber > priceNumber) {
        nextErrors.sale = 'Цена со скидкой не может быть больше текущей цены.';
      }
    }

    return nextErrors;
  }

  function mapServerError(code: string | undefined, message: string | undefined) {
    if (code === 'CATALOG_SALE_GT_PRICE') {
      return {
        fieldErrors: { sale: 'Цена со скидкой не может быть больше текущей цены.' } as ProductFormErrors,
        formError: null
      };
    }
    if (code === 'CATALOG_SALE_INVALID') {
      return {
        fieldErrors: { sale: 'Цена со скидкой должна быть неотрицательным числом.' } as ProductFormErrors,
        formError: null
      };
    }
    if (code === 'CATALOG_ITEM_NUMBER_REQUIRED') {
      return {
        fieldErrors: { itemNumber: 'Укажите артикул товара.' } as ProductFormErrors,
        formError: null
      };
    }
    if (code === 'CATALOG_ITEM_NUMBER_TOO_LONG') {
      return {
        fieldErrors: { itemNumber: 'Артикул должен содержать не более 100 символов.' } as ProductFormErrors,
        formError: null
      };
    }
    return {
      fieldErrors: {} as ProductFormErrors,
      formError: message ?? 'Не удалось сохранить товар. Проверьте введённые данные.'
    };
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const clientErrors = validateForm();
    setFieldErrors(clientErrors);
    setFormError(null);

    if (Object.values(clientErrors).some(Boolean)) {
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData(event.currentTarget);
      const response = await fetch(action, {
        method: 'POST',
        body: formData
      });

      let payload: { ok?: boolean; code?: string; message?: string; redirectTo?: string } = {};
      try {
        payload = (await response.json()) as { ok?: boolean; code?: string; message?: string; redirectTo?: string };
      } catch {
        payload = {};
      }

      if (!response.ok || payload.ok === false) {
        const mapped = mapServerError(payload.code, payload.message);
        setFieldErrors((current) => ({ ...current, ...mapped.fieldErrors }));
        setFormError(mapped.formError);
        return;
      }

      if (payload.redirectTo) {
        window.location.assign(payload.redirectTo);
        return;
      }

      setFormError('Не удалось выполнить переход после сохранения. Обновите страницу и проверьте данные.');
    } catch {
      setFormError('Сервер недоступен. Проверьте подключение и повторите попытку.');
    } finally {
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    if (!activeSchema) {
      setSchemaVersion('');
      setAttributesSnapshot({});
      return;
    }
    setSchemaVersion(activeSchema.version);
    setAttributesSnapshot((current) => {
      const next: Record<string, unknown> = {};
      for (const field of activeSchema.fields) {
        next[field.key] = current[field.key] ?? defaultValueForField(field);
      }
      return next;
    });
  }, [activeSchema, values.categoryId]);

  return (
    <Card>
      <CardContent className="p-5">
        <form className="grid max-w-3xl gap-4" onSubmit={handleSubmit} noValidate>
          {product ? <input type="hidden" name="id" value={product.id} /> : null}
          <input type="hidden" name="attributesSnapshot" value={JSON.stringify(attributesSnapshot)} />
          <input type="hidden" name="schemaVersion" value={schemaVersion === '' ? '' : String(schemaVersion)} />

          {formError ? <Alert variant="destructive">{formError}</Alert> : null}

          <Label className="grid gap-1">
            Название
            <Input
              name="title"
              value={values.title}
              onChange={(event) => updateValue('title', event.target.value)}
              placeholder="Например, Кроссовки Runner Pro"
              className={fieldErrors.title ? inputErrorClass : undefined}
              aria-invalid={Boolean(fieldErrors.title)}
            />
            {fieldErrors.title ? <p className={fieldErrorClass}>{fieldErrors.title}</p> : null}
          </Label>

          <Label className="grid gap-1">
            Артикул
            <Input
              name="itemNumber"
              value={values.itemNumber}
              onChange={(event) => updateValue('itemNumber', event.target.value)}
              placeholder="Например, MRS05R36"
              maxLength={100}
              className={fieldErrors.itemNumber ? inputErrorClass : undefined}
              aria-invalid={Boolean(fieldErrors.itemNumber)}
            />
            {fieldErrors.itemNumber ? <p className={fieldErrorClass}>{fieldErrors.itemNumber}</p> : null}
          </Label>

          <Label className="grid gap-1">
            Slug
            <Input
              name="slug"
              value={values.slug}
              onChange={(event) => updateValue('slug', event.target.value)}
              placeholder="runner-pro"
              className={fieldErrors.slug ? inputErrorClass : undefined}
              aria-invalid={Boolean(fieldErrors.slug)}
            />
            {fieldErrors.slug ? <p className={fieldErrorClass}>{fieldErrors.slug}</p> : null}
          </Label>

          <Label className="grid gap-1">
            Описание
            <Textarea
              name="description"
              value={values.description}
              onChange={(event) => updateValue('description', event.target.value)}
              rows={4}
              placeholder="Краткое описание товара"
            />
          </Label>

          <Label className="grid gap-1">
            Категория
            <Select
              name="categoryId"
              value={values.categoryId}
              onChange={(event) => updateValue('categoryId', event.target.value)}
              className={fieldErrors.categoryId ? inputErrorClass : undefined}
              aria-invalid={Boolean(fieldErrors.categoryId)}
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
            {fieldErrors.categoryId ? <p className={fieldErrorClass}>{fieldErrors.categoryId}</p> : null}
          </Label>

          <Label className="grid gap-1">
            Цена
            <Input
              type="number"
              min="0"
              name="price"
              value={values.price}
              onChange={(event) => updateValue('price', event.target.value)}
              className={fieldErrors.price ? inputErrorClass : undefined}
              aria-invalid={Boolean(fieldErrors.price)}
            />
            {fieldErrors.price ? <p className={fieldErrorClass}>{fieldErrors.price}</p> : null}
          </Label>

          <Label className="grid gap-1">
            Цена со скидкой
            <Input
              type="number"
              min="0"
              name="sale"
              value={values.sale}
              onChange={(event) => updateValue('sale', event.target.value)}
              className={fieldErrors.sale ? inputErrorClass : undefined}
              aria-invalid={Boolean(fieldErrors.sale)}
            />
            {fieldErrors.sale ? <p className={fieldErrorClass}>{fieldErrors.sale}</p> : null}
          </Label>

          {activeFields.length ? (
            <section className="grid gap-3 rounded-lg border bg-white p-4">
              <h3 className="text-base font-semibold">Характеристики</h3>
              {activeFields.map((field) => (
                <Label key={field.key} className="grid gap-1">
                  {field.label}
                  {field.type === 'text' ? (
                    <Input
                      value={String(attributesSnapshot[field.key] ?? '')}
                      onChange={(event) =>
                        setAttributesSnapshot((current) => ({ ...current, [field.key]: event.target.value }))
                      }
                      required={field.required}
                    />
                  ) : null}
                  {field.type === 'number' ? (
                    <Input
                      type="number"
                      value={Number(attributesSnapshot[field.key] ?? 0)}
                      onChange={(event) =>
                        setAttributesSnapshot((current) => ({ ...current, [field.key]: Number(event.target.value) }))
                      }
                      required={field.required}
                    />
                  ) : null}
                  {field.type === 'boolean' ? (
                    <input
                      type="checkbox"
                      checked={Boolean(attributesSnapshot[field.key])}
                      onChange={(event) =>
                        setAttributesSnapshot((current) => ({ ...current, [field.key]: event.target.checked }))
                      }
                    />
                  ) : null}
                  {field.type === 'select' ? (
                    <Select
                      value={String(attributesSnapshot[field.key] ?? '')}
                      onChange={(event) =>
                        setAttributesSnapshot((current) => ({ ...current, [field.key]: event.target.value }))
                      }
                      required={field.required}
                    >
                      <option value="">Выберите значение</option>
                      {(field.options ?? []).map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </Select>
                  ) : null}
                  {field.type === 'multiselect' ? (
                    <Input
                      value={
                        Array.isArray(attributesSnapshot[field.key])
                          ? (attributesSnapshot[field.key] as unknown[]).map((item) => String(item)).join(', ')
                          : ''
                      }
                      placeholder="значение1, значение2"
                      onChange={(event) =>
                        setAttributesSnapshot((current) => ({
                          ...current,
                          [field.key]: event.target.value
                            .split(',')
                            .map((item) => item.trim())
                            .filter(Boolean)
                        }))
                      }
                      required={field.required}
                    />
                  ) : null}
                </Label>
              ))}
            </section>
          ) : (
            <Alert>Для этой категории нет активной схемы характеристик.</Alert>
          )}

          <details className="rounded-lg border bg-white p-4">
            <summary>Расширенные данные (JSON)</summary>
            <p className="mt-2 text-sm text-slate-600">
              Этот блок нужен для расширенного редактирования вариантов и изображений.
            </p>
            <Label className="mt-3 grid gap-1">
              Варианты JSON
              <Textarea
                name="variants"
                value={variantsText}
                onChange={(event) => setVariantsText(event.target.value)}
                rows={8}
              />
            </Label>
            <Label className="mt-3 grid gap-1">
              Изображения JSON
              <Textarea
                name="images"
                value={imagesText}
                onChange={(event) => setImagesText(event.target.value)}
                rows={6}
              />
            </Label>
          </details>

          <Button type="submit" className="w-fit" disabled={isSubmitting}>
            {isSubmitting ? 'Сохраняем...' : mode === 'create' ? 'Создать товар' : 'Сохранить изменения'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
