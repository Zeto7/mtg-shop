import { Container } from "@/shared/components/shared/container";
import { Filters } from "@/shared/components/shared/filters";
import { ProductsGroupList } from "@/shared/components/shared/products-group-list";
import { Title } from "@/shared/components/shared/title";
import { TopBar } from "@/shared/components/shared/top-bar";
import { Suspense } from "react";
import { findKits, GetSearchParams } from "@/shared/lib/find-kits";


export default async function Home({searchParams} : { searchParams: GetSearchParams }) {
  const categories = await findKits(searchParams);
  return (
    <>
      <Container className="mt-10">
        <Title text="Все товары" size="lg" className="font-extrabold"/>
      </Container>

      <TopBar categories={categories.filter((category) => category.products.length > 0)}/>

      <Container className="mt-10 pb-14">
        <div className="flex gap-[100px]">

          {/* Фильтрация */}
          <div className="w-[250px]">
            <Suspense>
              <Filters/>
            </Suspense>
          </div>

          {/* Список товаров */}
          <div className="flex-1">
            <div className="flex flex-col gap-16">
                {
                  categories.map((category) => (
                    category.products.length > 0 && (
                      <ProductsGroupList
                        key={category.id}
                        title={category.name}
                        categoryId={category.id}
                        products={category.products}
                      />
                    ) 
                  ))
                }
            </div>
          </div>
        </div>
      </Container>
    </>
  );
}
