'use client';

import React, { useState, useEffect, useMemo, useTransition } from 'react';
import { ProductWithRelations } from '@/@types/prisma';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { toast } from 'react-hot-toast';
import { updateProductStock } from '@/app/actions/product-actions';
import { Check, X, Edit2, Search } from 'lucide-react';
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


interface EditableStockCellProps {
    productId: number;
    initialAmount: number | null;
    onStockUpdate: (productId: number, newAmount: number | null) => void;
}

function EditableStockCell({ productId, initialAmount, onStockUpdate }: EditableStockCellProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [currentAmount, setCurrentAmount] = useState<string>((initialAmount ?? '').toString());
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        setCurrentAmount((initialAmount ?? '').toString());
    }, [initialAmount]);

    const handleSave = () => {
        const newAmountNum = parseInt(currentAmount, 10);
        if (isNaN(newAmountNum) || newAmountNum < 0) {
            toast.error("Пожалуйста, введите корректное неотрицательное число.");
            return;
        }
        if (newAmountNum === initialAmount) {
            setIsEditing(false);
            return;
        }
        startTransition(async () => {
            const result = await updateProductStock({ productId, newAmount: newAmountNum });
            if (result.success && result.product) {
                toast.success(result.message || `Остаток товара #${productId} обновлен.`);
                onStockUpdate(productId, result.product.amount);
                setIsEditing(false);
            } else {
                toast.error(result.message || 'Не удалось обновить остаток.');
                setCurrentAmount((initialAmount ?? '').toString());
            }
        });
    };
    const handleCancel = () => {
        setCurrentAmount((initialAmount ?? '').toString());
        setIsEditing(false);
    };
    if (isEditing) {
        return (
            <div className="flex items-center space-x-1">
                <Input type="number" value={currentAmount} onChange={(e) => setCurrentAmount(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') handleCancel(); }} className="h-8 text-right w-20" min="0" disabled={isPending} />
                <Button size="icon" variant="ghost" onClick={handleSave} disabled={isPending} className="h-8 w-8"><Check className="h-4 w-4 text-green-600" /></Button>
                <Button size="icon" variant="ghost" onClick={handleCancel} disabled={isPending} className="h-8 w-8"><X className="h-4 w-4 text-red-600" /></Button>
            </div>
        );
    }
    return (
        <div className="flex items-center justify-end space-x-2 group">
            <span className="font-semibold text-gray-800 dark:text-gray-200">{initialAmount ?? 'N/A'}</span>
            <Button size="icon" variant="ghost" onClick={() => setIsEditing(true)} className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"><Edit2 className="h-4 w-4 text-blue-600" /></Button>
        </div>
    );
}


interface ProductStockListClientProps {
    products: ProductWithRelations[];
}

const PRODUCTS_PER_PAGE = 10;

export function ProductStockListClient({ products: initialProductsProp }: ProductStockListClientProps) {
    const [products, setProducts] = useState<ProductWithRelations[]>(initialProductsProp);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        setProducts(initialProductsProp);
    }, [initialProductsProp]);

    const filteredProducts = useMemo(() => {
        if (!searchTerm.trim()) {
            return products;
        }
        const lowerSearchTerm = searchTerm.toLowerCase().trim();
        return products.filter(product =>
            product.name.toLowerCase().includes(lowerSearchTerm) ||
            product.id.toString().includes(lowerSearchTerm)
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

    const handleStockUpdateInList = (productId: number, newAmount: number | null) => {
        setProducts(prevProducts =>
            prevProducts.map((p): ProductWithRelations => {
                if (p.id === productId) {
                    return { ...p, amount: newAmount };
                }
                return p;
            })
        );
    };

    if (initialProductsProp.length === 0 && !searchTerm) {
        return <p className="text-center text-gray-500 mt-6">Товары не найдены.</p>;
    }

    return (
        <div className="max-w-4xl mx-auto p-4 space-y-6">
            <div className="mb-4">
                <Label htmlFor="product-stock-search" className="sr-only">Поиск товаров</Label>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                        id="product-stock-search"
                        type="text"
                        placeholder="Поиск..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="pl-10 w-full md:w-2/3 lg:w-1/2"
                    />
                </div>
            </div>

            {filteredProducts.length === 0 ? (
                <p className="text-center text-gray-500 mt-6">
                    {searchTerm ? "Товары по вашему запросу не найдены." : "Нет товаров, соответствующих фильтру."}
                </p>
            ) : (
                <>
                    <div className="overflow-x-auto rounded-lg border dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800">
                        <Table>
                            <TableHeader>
                                <TableRow className="dark:border-gray-600">
                                    <TableHead className="w-[80px] text-gray-700 dark:text-gray-300">ID</TableHead>
                                    <TableHead className="text-gray-700 dark:text-gray-300">Название Товара</TableHead>
                                    <TableHead className="text-right w-[200px] text-gray-700 dark:text-gray-300">Остаток</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedProducts.map((product) => (
                                    <TableRow key={product.id} className="dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <TableCell className="font-medium text-gray-900 dark:text-gray-100">#{product.id}</TableCell>
                                        <TableCell className="text-gray-700 dark:text-gray-300">{product.name}</TableCell>
                                        <TableCell className="text-right">
                                            <EditableStockCell
                                                productId={product.id}
                                                initialAmount={product.amount ?? null}
                                                onStockUpdate={handleStockUpdateInList}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

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
                                        const showPage = totalPages <= 7 ||
                                            pageNumber === 1 ||
                                            pageNumber === totalPages ||
                                            (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1);
                                        const showEllipsisBefore = pageNumber === currentPage - 2 && currentPage - 2 > 1 && totalPages > 7;
                                        const showEllipsisAfter = pageNumber === currentPage + 2 && currentPage + 2 < totalPages && totalPages > 7;

                                        if (showEllipsisBefore || showEllipsisAfter) {
                                            return <PaginationItem key={`ellipsis-${pageNumber}`}><PaginationEllipsis /></PaginationItem>;
                                        }
                                        if (showPage) {
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
                </>
            )}
        </div>
    );
}