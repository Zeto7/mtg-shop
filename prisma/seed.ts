import { Prisma } from "@prisma/client";
import { additionals, categories, products } from "./constants";
import { prisma } from "./prisma-client";
import { hashSync } from "bcrypt";

const randomDecimalNumber = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min) * 10 + min * 10) / 10;
};

const generateProductItem = ({ productId, amount, }: { productId: number; amount?: 1 | 2 | 3 }) => {
    return {
      productId,
      price: randomDecimalNumber(15, 100),
      amount,
    } as Prisma.ProductItemUncheckedCreateInput;
  };

async function up() {
    await prisma.user.createMany({
        data: [
            {
                fullName: 'Jane Doe',
                email: 'User1@example.com',
                password: hashSync('123456', 10),
                verified: new Date(),
                role: 'USER',
            },
            {
                fullName: 'John Doe',   
                email: 'Admin1@example.com',
                password: hashSync('123456', 10),
                verified: new Date(),
                role: 'ADMIN',
            },
        ],
    });

    await prisma.category.createMany({
        data: categories,
    });

    await prisma.additional.createMany({
        data: additionals,
    });

    await prisma.product.createMany({
        data: products,
    });

    const item1 = await prisma.product.create({
        data: {
            name: 'Дуэльный набор Final Fantasy',
            imageUrl:
              "https://www.trader-online.de/out/pictures/generated/product/1/540_340_75/Final-Fantasy-Einsteigerpaket-englisch_195166271170.png",
            categoryId: 1,
            price: 120,
            Additionals: {
              connect: additionals.slice(0, 5),
            },
          },
    });

    const item2 = await prisma.product.create({
        data: {
            name: 'Дуэльный набор 2023',
            imageUrl:
              "https://www.trader-online.de/out/pictures/generated/product/1/540_340_75/magic_the_gathering_einsteigerpaket_2023_starter_kit_englisch_english_guenstig_billig_kaufen_tcg_mtg.png",
            categoryId: 1,
            price: 91,
            Additionals: {
              connect: additionals.slice(0, 5),
            },
          },
    });

    const item3 = await prisma.product.create({
        data: {
            name: 'Дуэльный набор Universes Beyond: Assassins Creed ',
            imageUrl:
              "https://www.trader-online.de/out/pictures/generated/product/1/540_340_75/assassins_creed_einsteiger_paket_starter_kit_englisch_english_guenstig_billig_kaufen_tcg_mtg_acr.png",
            categoryId: 1,
            price: 86,
            Additionals: {
              connect: additionals.slice(0, 5),
            },
          },
    });

    const item4 = await prisma.product.create({
        data: {
            name: 'Дуэльный набор Bloomburrow',
            imageUrl:
              "https://www.trader-online.de/out/pictures/generated/product/1/540_340_75/bloomburrow_starter_kit_englisch_english_guenstig_billig_kaufen_tcg_mtg_blb.png",
            categoryId: 1,
            price: 65,
            Additionals: {
              connect: additionals.slice(0, 5),
            },
          },
    });

    const item5 = await prisma.product.create({
        data: {
            name: 'Дуэльный набор The Lord of the Rings: Tales of Middle-Earth',
            imageUrl:
              "https://www.trader-online.de/out/pictures/generated/product/1/540_340_75/the_lord_of_the_rings_tales_of_middle-earth_starter_kit_englisch_english_guenstig_billig_kaufen_ltr_tcg_mtg_2.png",
            categoryId: 1,
            price: 71,
            Additionals: {
              connect: additionals.slice(0, 5),
            },
          },
    });

    await prisma.productItem.createMany({
        data: [
            generateProductItem({ productId: item1.id, amount: 1 }),
            generateProductItem({ productId: item1.id, amount: 2 }),
            generateProductItem({ productId: item1.id, amount: 3 }),

            generateProductItem({ productId: item2.id, amount: 2 }),
            generateProductItem({ productId: item2.id, amount: 2 }),
            generateProductItem({ productId: item2.id, amount: 3 }),

            generateProductItem({ productId: item3.id, amount: 3 }),
            generateProductItem({ productId: item3.id, amount: 3 }),
            generateProductItem({ productId: item3.id, amount: 1 }),

            // // Остальное
            // generateProductItem({ productId: 1 }),
            // generateProductItem({ productId: 2 }),
            // generateProductItem({ productId: 3 }),
            // generateProductItem({ productId: 4 }),
            // generateProductItem({ productId: 5 }),
            // generateProductItem({ productId: 6 }),
            // generateProductItem({ productId: 7 }),
            // generateProductItem({ productId: 8 }),
            // generateProductItem({ productId: 9 }),
            // generateProductItem({ productId: 10 }),
            // generateProductItem({ productId: 11 }),
            // generateProductItem({ productId: 12 }),
            // generateProductItem({ productId: 13 }),
            // generateProductItem({ productId: 14 }),
            // generateProductItem({ productId: 15 }),
            // generateProductItem({ productId: 16 }),            
        ],
    })

    await prisma.cart.createMany({
        data: [
            {
                userId: 1,
                totalAmount: 0,
                token: '11111',
            },
            {
                userId: 2,
                totalAmount: 0,
                token: '22222',
            },
        ],
    })

    await prisma.cartItem.create({
        data: {
            cartId: 1,
            productItemId: 1,
            quantity: 2,
            Additionals: {
                connect: [ { id: 1 }, { id: 2 }, { id: 3 }, ],
            },
        },
    });
}

async function down() {
    await prisma.$executeRaw`TRUNCATE TABLE "User" RESTART IDENTITY CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "Category" RESTART IDENTITY CASCADE`; 
    await prisma.$executeRaw`TRUNCATE TABLE "Product" RESTART IDENTITY CASCADE`; 
    await prisma.$executeRaw`TRUNCATE TABLE "ProductItem" RESTART IDENTITY CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "Cart" RESTART IDENTITY CASCADE`; 
    await prisma.$executeRaw`TRUNCATE TABLE "CartItem" RESTART IDENTITY CASCADE`; 
    await prisma.$executeRaw`TRUNCATE TABLE "Additional" RESTART IDENTITY CASCADE`; 
}

async function main() {
    try{
        await down();
        await up();
    }
    catch (e){
        console.error(e);
    }
}

main()
.then(async () => {
    await prisma.$disconnect();
})
.catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
});