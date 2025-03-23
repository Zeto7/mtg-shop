import { Container } from "@/shared/components/shared/container";
import { Title } from "@/shared/components/shared/title";
import { WhiteBlock } from "@/shared/components/shared/white-block";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";

export default function Checkout() {
    return <Container className="mt-5">
        <Title text="Оформление заказа" className="font-extrabold mb-8 text-[36px]" />

        <div className="flex gap-10">
            {/*Левая часть*/}
            <div className="flex flex-col gap-10 flex-1 mb-10">
                <WhiteBlock title="1. Корзина">123123123</WhiteBlock>

                <WhiteBlock title="1. Персональные данные">
                    <div className="grid grid-cols-2 gap-5">
                        <Input name="firstName" className="text-base" placeholder="Имя" />
                        <Input name="lastName" className="text-base" placeholder="Фамилия" />
                        <Input name="email" className="text-base" placeholder="E-Mail" />
                        <Input name="phone" className="text-base" placeholder="Телефон" />
                    </div>
                </WhiteBlock>

                <WhiteBlock title="3. Адрес доставки">
                    <div className="grid grid-cols gap-5">
                        <Input name="firstName" className="text-base" placeholder="Адрес" />
                        <Textarea rows={5} className="text-base" placeholder="Комментарий к заказу"/>
                    </div>
                </WhiteBlock>
            </div>

            {/*Правая часть*/}
            <div className="w-[450px]">
                <WhiteBlock className="p-6 sticky top-4">
                    <div className="flex flex-col gap-1">
                        <span className="text-xl">Итого:</span>
                        <span className="text-3xl font-extrabold">144 Br</span>
                    </div>
                </WhiteBlock>
            </div>
        </div>
    </Container>
}