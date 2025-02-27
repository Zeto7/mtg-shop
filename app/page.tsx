import { Container } from "@/components/shared/container";
import { Filters } from "@/components/shared/filters";
import { ProductCard } from "@/components/shared/product-card";
import { ProductsGroupList } from "@/components/shared/products-group-list";
import { Title } from "@/components/shared/title";
import { TopBar } from "@/components/shared/top-bar";;


export default function Home() {
  return (
    <>
      <Container className="mt-10">
        <Title text="Все товары" size="lg" className="font-extrabold"/>
      </Container>
      <TopBar/>

      <Container className="mt-10 pb-14">
        <div className="flex gap-[100px]">

          {/* Фильтрация */}
          <div className="w-[250px]">
            <Filters/>
          </div>

          {/* Список товаров */}
          <div className="flex-1">
            <div className="flex flex-col gap-16">
              <ProductsGroupList title="Дуо наборы" categoryId={1} products={[
                {
                  id: 1,
                  name: "набор 1",
                  imageUrl: "https://hobbygames.by/image/cache/hobbygames/data/Wizarsds_Of_the_Coast/Magic_the_Gathering/Wilds_of_Eldraine/Starter_Kit/starter-kit-01-1000x416-wm.JPG",
                  price: 91,
                  products: [{price: 91}]
                },
                {
                  id: 2,
                  name: "набор 2",
                  imageUrl: "https://hobbygames.by/image/cache/hobbygames/data/Wizarsds_Of_the_Coast/Magic_the_Gathering/Wilds_of_Eldraine/Starter_Kit/starter-kit-01-1000x416-wm.JPG",
                  price: 91,
                  products: [{price: 91}]
                },
                {
                  id: 3,
                  name: "набор 3",
                  imageUrl: "https://hobbygames.by/image/cache/hobbygames/data/Wizarsds_Of_the_Coast/Magic_the_Gathering/Wilds_of_Eldraine/Starter_Kit/starter-kit-01-1000x416-wm.JPG",
                  price: 91,
                  products: [{price: 91}]
                },
                {
                  id: 4,
                  name: "набор 1",
                  imageUrl: "https://hobbygames.by/image/cache/hobbygames/data/Wizarsds_Of_the_Coast/Magic_the_Gathering/Wilds_of_Eldraine/Starter_Kit/starter-kit-01-1000x416-wm.JPG",
                  price: 91,
                  products: [{price: 91}]
                },
                {
                  id: 5,
                  name: "набор 2",
                  imageUrl: "https://hobbygames.by/image/cache/hobbygames/data/Wizarsds_Of_the_Coast/Magic_the_Gathering/Wilds_of_Eldraine/Starter_Kit/starter-kit-01-1000x416-wm.JPG",
                  price: 91,
                  products: [{price: 91}]
                },
                {
                  id: 6,
                  name: "набор 3",
                  imageUrl: "https://hobbygames.by/image/cache/hobbygames/data/Wizarsds_Of_the_Coast/Magic_the_Gathering/Wilds_of_Eldraine/Starter_Kit/starter-kit-01-1000x416-wm.JPG",
                  price: 91,
                  products: [{price: 91}]
                },

              ]}/>

              <ProductsGroupList title="Planeswalker наборы" categoryId={2} products={[
                {
                  id: 1,
                  name: "набор 1",
                  imageUrl: "https://hobbygames.by/image/cache/hobbygames/data/Wizarsds_Of_the_Coast/Magic_the_Gathering/Wilds_of_Eldraine/Starter_Kit/starter-kit-01-1000x416-wm.JPG",
                  price: 91,
                  products: [{price: 91}]
                },
                {
                  id: 2,
                  name: "набор 2",
                  imageUrl: "https://hobbygames.by/image/cache/hobbygames/data/Wizarsds_Of_the_Coast/Magic_the_Gathering/Wilds_of_Eldraine/Starter_Kit/starter-kit-01-1000x416-wm.JPG",
                  price: 91,
                  products: [{price: 91}]
                },
                {
                  id: 3,
                  name: "набор 3",
                  imageUrl: "https://hobbygames.by/image/cache/hobbygames/data/Wizarsds_Of_the_Coast/Magic_the_Gathering/Wilds_of_Eldraine/Starter_Kit/starter-kit-01-1000x416-wm.JPG",
                  price: 91,
                  products: [{price: 91}]
                },
                {
                  id: 4,
                  name: "набор 1",
                  imageUrl: "https://hobbygames.by/image/cache/hobbygames/data/Wizarsds_Of_the_Coast/Magic_the_Gathering/Wilds_of_Eldraine/Starter_Kit/starter-kit-01-1000x416-wm.JPG",
                  price: 91,
                  products: [{price: 91}]
                },
                {
                  id: 5,
                  name: "набор 2",
                  imageUrl: "https://hobbygames.by/image/cache/hobbygames/data/Wizarsds_Of_the_Coast/Magic_the_Gathering/Wilds_of_Eldraine/Starter_Kit/starter-kit-01-1000x416-wm.JPG",
                  price: 91,
                  products: [{price: 91}]
                },
                {
                  id: 6,
                  name: "набор 3",
                  imageUrl: "https://hobbygames.by/image/cache/hobbygames/data/Wizarsds_Of_the_Coast/Magic_the_Gathering/Wilds_of_Eldraine/Starter_Kit/starter-kit-01-1000x416-wm.JPG",
                  price: 91,
                  products: [{price: 91}]
                },

              ]}/>
            </div>
          </div>
        </div>
      </Container>
    </>
  );
}
