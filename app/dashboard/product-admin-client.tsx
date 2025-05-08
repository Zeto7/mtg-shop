'use client';

import { useState } from 'react';
import { ProductWithRelations, CategoryData, AdditionalData } from '@/@types/prisma';
import { AdminProductForm } from '@/shared/components/shared/admin-product-form';
import { Button } from "@/shared/components/ui/button";
import { toast } from 'react-hot-toast';
import { deleteProductAction } from '@/app/actions/product-actions';
import { Badge } from '@/shared/components/ui/badge';

// Компонент для отображения одного продукта в списке
function ProductListItem({ product, onEdit, onDelete }: {
    product: ProductWithRelations;
    onEdit: (product: ProductWithRelations) => void;
    onDelete: (id: number) => Promise<void>;
}) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
         if (!confirm(`Вы точно хотите удалить этот товар? "${product.name}"?`)) {
             return;
         }
         setIsDeleting(true);
         await onDelete(product.id);
         // setIsDeleting(false); // Не нужно, т.к. компонент перерисуется
    };

    return (
        <div className="border p-4 rounded shadow flex flex-col space-y-3">
             <div className="flex justify-between items-start">
                 <div>
                     <h2 className="text-lg font-bold">{product.name}</h2>
                     <p className="text-sm text-gray-600">Категория: {product.category?.name || 'N/A'}</p>
                     <p className="text-sm text-gray-600">Базовая цена: {(product.price).toFixed(2)}</p>
                 </div>
                 <div className="flex space-x-2 flex-shrink-0">
                     <Button variant="outline" size="sm" onClick={() => onEdit(product)}>
                         Редактировать
                     </Button>
                     <Button
                         variant="destructive"
                         size="sm"
                         onClick={handleDelete}
                         disabled={isDeleting}
                     >
                         {isDeleting ? 'Удаление...' : 'Удалить'}
                     </Button>
                 </div>
             </div>

             {/* Отображение вариаций (items) */}
             {product.items && product.items.length > 0 && (
                 <div>
                     <span className="text-sm font-medium">Цена: </span>
                     {product.items.map(item => (
                         <Badge key={item.id} variant="secondary" className="mr-1">
                            Br {(item.price).toFixed(2)} {item.amount ? `(${item.amount} left)` : ''}
                         </Badge>
                     ))}
                 </div>
             )}

             {/* Отображение additionals */}
              {product.additionals && product.additionals.length > 0 && (
                 <div>
                     <span className="text-sm font-medium">Доп. товары: </span>
                     {product.additionals.map(add => (
                         <Badge key={add.id} variant="outline" className="mr-1">
                             {add.name}
                         </Badge>
                     ))}
                 </div>
             )}
        </div>
    );
}


interface ProductAdminClientProps {
    initialProducts: ProductWithRelations[];
    categories: CategoryData[];
    allAdditionals: AdditionalData[];
}

export function ProductAdminClient({ initialProducts, categories, allAdditionals }: ProductAdminClientProps) {
    const [selectedProduct, setSelectedProduct] = useState<ProductWithRelations | null>(null);
    const [showForm, setShowForm] = useState(false);

    const handleEditProduct = (product: ProductWithRelations) => {
        setSelectedProduct(product);
        setShowForm(true);
    };

    const handleAddNewClick = () => {
        setSelectedProduct(null);
        setShowForm(true);
    };

    const handleFormSuccess = () => {
        setShowForm(false);
        setSelectedProduct(null);
        // Данные обновятся через revalidatePath в Server Action
    };

     const handleCancelForm = () => {
         setShowForm(false);
         setSelectedProduct(null);
     };

    const handleDeleteProduct = async (id: number) => {
        const result = await deleteProductAction(id);
        if (result.success) {
            toast.success('Product deleted successfully!');
        } else {
            toast.error(result.message || 'Failed to delete product.');
        }
    };

    // Используем initialProducts напрямую, т.к. Next.js обновит их после revalidate
    const currentProducts = initialProducts;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Управление товарами</h1>
                 {!showForm && <Button onClick={handleAddNewClick}>Добавить новый товар</Button>}
            </div>

            {showForm && (
                <div className="border p-6 rounded shadow-md bg-white">
                     <h2 className="text-2xl font-semibold mb-4">
                         {selectedProduct ? 'Изменить продукт' : 'Добавить новый продукт'}
                     </h2>
                    <AdminProductForm
                        key={selectedProduct?.id ?? 'new'} // Ключ для сброса формы
                        product={selectedProduct}
                        categories={categories}
                        allAdditionals={allAdditionals}
                        onSuccess={handleFormSuccess}
                        onCancel={handleCancelForm}
                    />
                </div>
            )}

            {!showForm && (
                 <div className="space-y-4">
                     <h2 className="text-2xl font-semibold border-b pb-2">Список товаров</h2>
                     {currentProducts.length === 0 ? (
                         <p className="text-gray-500">Товаров не найдено</p>
                     ) : (
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             {currentProducts.map((product) => (
                                 <ProductListItem
                                     key={product.id}
                                     product={product}
                                     onEdit={handleEditProduct}
                                     onDelete={handleDeleteProduct}
                                 />
                             ))}
                         </div>
                     )}
                 </div>
            )}
        </div>
    );
}