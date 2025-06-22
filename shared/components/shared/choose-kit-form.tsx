import { cn } from "@/shared/lib/utils";
import React from "react";
import { ProductImage } from "./Product-Imange";
import { Title } from "./title";
import { Button } from "@/shared/components/ui/button";
import { GroupVariants } from "./group-variants";
import { KitAmount, kitAmount } from "@/shared/constants/kit";
import { Additional, ProductItem } from "@prisma/client";
import { AdditionalItem } from "./additional-item";
import { useSet } from "react-use";
import { on } from "events";

interface Props {
    imageUrl: string;
    name: string;
    className?: string; 
    additionals: Additional[];
    description: string;
    items: ProductItem[];
    onSubmit: (itemId: number, additionals: number[]) => void
    onClickAddCart?: VoidFunction;
}


export const ChooseKitForm: React.FC<Props> = ({ className, imageUrl, name, additionals, description, items, onSubmit, onClickAddCart }) => {
    const [amount, setAmount] = React.useState<KitAmount>(1);
    const [selectedAdditionals, {toggle: addAdditional}] = useSet(new Set<number>([]));


    const kitPrice = items.find((item) => item.amount === amount)?.price || 0;
    const totalAdditionnalsPrice = additionals.filter((additional) => selectedAdditionals.has(additional.id)).reduce((acc, additional) => acc + additional.price, 0);
    const totalPrice = kitPrice + totalAdditionnalsPrice;

    const handleClickAdd = () => {onClickAddCart?.();
      if(currentItemId) {
        onSubmit(currentItemId, Array.from(selectedAdditionals));
      }
    }

    const filteredkitsByType = items.filter((item) => item.amount === amount);
    const availablekitsCount = kitAmount.map((item) => ({
      name: item.name,
      value: item.value,
      disabled: !filteredkitsByType.some((kit) => Number(kit.amount) === Number(item.value)),
    }));

    const currentItemId = items.find((item) => item.amount === amount)?.id;

    React.useEffect(() => {
      const isAvaliableAmount = availablekitsCount?.find((item) => Number(item.value) === amount && !item.disabled);
      const availableCount = availablekitsCount.find((item) => !item.disabled);

      if (!isAvaliableAmount && availableCount) {
        setAmount(Number(availableCount.value) as KitAmount);
      }
    }, [additionals]);

  return (
    <div className={cn(className, 'flex flex-1')}>
        <ProductImage imageUrl={imageUrl} amount={1} />

        <div className="w-[490px] bg-[#FCFCFC] p-7">
            <Title text={name} size="md" className="font-extrabold mb-1"/>
            <p className="text-sm text-[#5C6370] mb-4 overflow-hidden break-words flex-grow whitespace-pre-line">
                {description || 'Описание отсутствует.'}
            </p>
            {/* <GroupVariants className=" gap-4 mt-3" items={availablekitsCount} value={String(amount)} onClick={value => setAmount(Number(value))}/> */}
            <p className="text-[#5C6370] mt-6">Дополнительный бустер</p>
              <div className="bg-[gray-100] mt-2 p-5 rounded-md h-[430px] overflow-auto scrollbar">
                <div className='grid grid-cols-3 gap-3'>
                  {additionals.map((additional) => (
                    <AdditionalItem key={additional.id} imageUrl={additional.imageUrl} name={additional.name} price={additional.price} 
                      onClick={() => addAdditional(additional.id)}
                      active={selectedAdditionals.has(additional.id)}
                    />
                  ))}
                </div>
              </div>
            <Button onClick={handleClickAdd} className="h-[55px] px-10 text-base rounded-3xl w-full mt-10 bg-[#B22222]">Добавить в корзину за {totalPrice} Br</Button>
        </div>
    </div>
  )
};