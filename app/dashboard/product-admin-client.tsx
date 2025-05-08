'use client';

import { useState, useMemo, useEffect } from 'react';
import { ProductWithRelations, CategoryData, AdditionalData } from '@/@types/prisma';
import { AdminProductForm } from '@/shared/components/shared/admin-product-form';
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { toast } from 'react-hot-toast';
import { deleteProductAction } from '@/app/actions/product-actions';
import { Badge } from '@/shared/components/ui/badge';
import { Search } from 'lucide-react';
import { Label } from '@/shared/components/ui/label';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
    PaginationEllipsis
} from "@/shared/components/ui/pagination";

function ProductListItem({ product, onEdit, onDelete }: {
    product: ProductWithRelations;
    onEdit: (product: ProductWithRelations) => void;
    onDelete: (id: number) => Promise<void>;
}) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteClick = async () => {
        if (!confirm(`Вы точно хотите удалить этот товар? "${product.name}"?`)) {
            return;
        }
        setIsDeleting(true);
        try {
            await onDelete(product.id);
        } catch (error) {
            console.error("Error in handleDeleteClick:", error);
            toast.error("Ошибка при попытке удаления товара.");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="border p-4 rounded shadow flex flex-col space-y-3 bg-white dark:bg-gray-800 dark:border-gray-700">
            <div className="flex justify-between items-start">
                <div className="flex-grow mr-2">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">{product.name}</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Категория: {product.category?.name || 'N/A'}</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                        Цена: Br {(product.price).toFixed(2)}
                    </p>
                </div>
                <div className="flex space-x-2 flex-shrink-0">
                    <Button variant="outline" size="sm" onClick={() => onEdit(product)}>
                        Редактировать
                    </Button>
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleDeleteClick}
                        disabled={isDeleting}
                    >
                        {isDeleting ? 'Удаление...' : 'Удалить'}
                    </Button>
                </div>
            </div>
            {product.additionals && product.additionals.length > 0 && (
                <div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Доп. товары: </span>
                    {product.additionals.map(add => (
                        <Badge key={add.id} variant="outline" className="mr-1 mb-1">
                            {add.name}
                        </Badge>
                    ))}
                </div>
            )}
        </div>
    );
}

const PRODUCTS_PER_PAGE = 10;

interface ProductAdminClientProps {
    initialProducts: ProductWithRelations[];
    categories: CategoryData[];
    allAdditionals: AdditionalData[];
}

export function ProductAdminClient({
    initialProducts,
    categories,
    allAdditionals,
}: ProductAdminClientProps) {
    const [products, setProducts] = useState<ProductWithRelations[]>(initialProducts);
    const [selectedProduct, setSelectedProduct] = useState<ProductWithRelations | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        setProducts(initialProducts);
        setCurrentPage(1);
    }, [initialProducts]); 

    const filteredProducts = useMemo(() => {
        if (!searchTerm.trim()) return products;
        const lowerSearchTerm = searchTerm.toLowerCase().trim();
        return products.filter(product =>
            product.name.toLowerCase().includes(lowerSearchTerm) ||
            product.price.toFixed(2).includes(lowerSearchTerm) ||
            (product.category?.name || '').toLowerCase().includes(lowerSearchTerm)
        );
    }, [products, searchTerm]);

    const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
    const paginatedProducts = useMemo(() => {
        const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
        return filteredProducts.slice(startIndex, startIndex + PRODUCTS_PER_PAGE);
    }, [filteredProducts, currentPage]);

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const handleEditProduct = (product: ProductWithRelations) => {
        setSelectedProduct(product);
        setShowForm(true);
    };

    const handleAddNewClick = () => {
        setSelectedProduct(null);
        setShowForm(true);
    };

    const handleFormSuccess = async (updatedOrNewProduct?: ProductWithRelations) => {
        setShowForm(false);
        setSelectedProduct(null);
        if (updatedOrNewProduct) {
            if (products.find(p => p.id === updatedOrNewProduct.id)) {
                setProducts(prev => prev.map(p => p.id === updatedOrNewProduct.id ? updatedOrNewProduct : p));
            } else {
                setProducts(prev => [updatedOrNewProduct, ...prev].sort((a, b) => a.name.localeCompare(b.name)));
            }
        }
    };

    const handleCancelForm = () => {
        setShowForm(false);
        setSelectedProduct(null);
    };

    const handleDeleteProduct = async (id: number) => {
        const result = await deleteProductAction(id);
        if (result.success) {
            toast.success(result.message || 'Товар успешно удален!');
            setProducts(prev => prev.filter(p => p.id !== id));
            if (paginatedProducts.length === 1 && currentPage > 1 && filteredProducts.length -1 > 0) {
                setCurrentPage(prev => prev - 1);
            } else if (paginatedProducts.length === 1 && currentPage === 1 && filteredProducts.length -1 === 0) { }
        } else {
            toast.error(result.message || 'Не удалось удалить товар.');
        }
    };

    return (
        <div className="space-y-6 p-4 md:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">Управление товарами</h1>
                {!showForm && <Button onClick={handleAddNewClick}>Добавить новый товар</Button>}
            </div>

            {showForm && (
                <div className="border p-4 md:p-6 rounded-lg shadow-lg bg-white dark:bg-gray-800 dark:border-gray-700">
                    <h2 className="text-xl md:text-2xl font-semibold mb-6 text-gray-800 dark:text-white">
                        {selectedProduct ? 'Изменить продукт' : 'Добавить новый продукт'}
                    </h2>
                    <AdminProductForm
                        key={selectedProduct?.id ?? 'new-product-form'}
                        product={selectedProduct}
                        categories={categories}
                        allAdditionals={allAdditionals}
                        onSuccess={handleFormSuccess}
                        onCancel={handleCancelForm}
                    />
                </div>
            )}

            {!showForm && (
                <div className="space-y-6">
                    <div>
                        <Label htmlFor="search-products" className="sr-only">Поиск товаров</Label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-gray-400" />
                            </div>
                            <Input
                                id="search-products"
                                type="text"
                                placeholder="Поиск товара..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="pl-10 w-full md:w-1/2 lg:w-1/3"
                            />
                        </div>
                    </div>

                    <h2 className="text-xl md:text-2xl font-semibold border-b pb-2 text-gray-800 dark:text-white">Список товаров</h2>
                    {paginatedProducts.length === 0 ? (
                        <p className="text-gray-500 dark:text-gray-400">
                            {searchTerm ? "Товары по вашему запросу не найдены." : (products.length === 0 ? "Товаров не найдено. Добавьте новый товар." : "Нет товаров, соответствующих фильтру.")}
                        </p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {paginatedProducts.map((product) => (
                                <ProductListItem
                                    key={product.id}
                                    product={product}
                                    onEdit={handleEditProduct}
                                    onDelete={handleDeleteProduct}
                                />
                            ))}
                        </div>
                    )}

                    {totalPages > 1 && (
                        <div className="mt-8 flex justify-center">
                            <Pagination>
                                <PaginationContent>
                                    <PaginationItem>
                                        <PaginationPrevious
                                            href="#"
                                            onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }}
                                            className={currentPage === 1 ? "pointer-events-none opacity-50" : undefined}
                                        />
                                    </PaginationItem>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => {
                                        if (
                                            totalPages <= 7 ||
                                            pageNumber === 1 ||
                                            pageNumber === totalPages ||
                                            (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                                        ) {
                                            return (
                                                <PaginationItem key={pageNumber}>
                                                    <PaginationLink
                                                        href="#"
                                                        onClick={(e) => { e.preventDefault(); handlePageChange(pageNumber); }}
                                                        isActive={currentPage === pageNumber}
                                                    >
                                                        {pageNumber}
                                                    </PaginationLink>
                                                </PaginationItem>
                                            );
                                        } else if (
                                            (pageNumber === currentPage - 2 && currentPage - 2 > 1) ||
                                            (pageNumber === currentPage + 2 && currentPage + 2 < totalPages)
                                        ) {
                                            return <PaginationItem key={`ellipsis-${pageNumber}`}><PaginationEllipsis /></PaginationItem>;
                                        }
                                        return null;
                                    })}
                                    <PaginationItem>
                                        <PaginationNext
                                            href="#"
                                            onClick={(e) => { e.preventDefault(); handlePageChange(currentPage + 1); }}
                                            className={currentPage === totalPages ? "pointer-events-none opacity-50" : undefined}
                                        />
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}