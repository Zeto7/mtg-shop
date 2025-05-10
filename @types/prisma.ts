import { Prisma, Product, Category, ProductItem, Additional } from '@prisma/client';

const productWithRelationsValidator = Prisma.validator<Prisma.ProductDefaultArgs>()({
  include: {
    category: true,
    items: true,
    additionals: true,
  },
});

export type ProductWithRelations = Prisma.ProductGetPayload<typeof productWithRelationsValidator>;

export type CategoryData = Category;
export type AdditionalData = Additional;
export type ProductItemData = ProductItem;