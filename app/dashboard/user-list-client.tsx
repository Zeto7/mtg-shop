'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { SafeUser } from '@/app/actions/user-actions';
import { UserRole } from '@prisma/client';
import { Badge } from "@/shared/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { Button } from '@/shared/components/ui/button';
import { Trash2, Edit, UserPlus, Search } from 'lucide-react';
import { UserForm } from '@/shared/components/shared/admin-user-form';
import { deleteUserAction } from '@/app/actions/user-actions';
import toast from 'react-hot-toast';
import { Input } from '@/shared/components/ui/input';
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

interface UserListClientProps {
    users: SafeUser[];
}

const formatDate = (dateValue: Date | string | null | undefined): string => {
    if (!dateValue) return '-';
    try {
        return new Date(dateValue).toLocaleDateString('ru-RU', {
            year: 'numeric', month: '2-digit', day: '2-digit',
        });
    } catch (e) { return '-'; }
};

const USERS_PER_PAGE = 15;

export function UserListClient({ users: initialUsersProp }: UserListClientProps) {
    const [showUserForm, setShowUserForm] = useState(false);
    const [editingUser, setEditingUser] = useState<SafeUser | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [users, setUsers] = useState<SafeUser[]>(initialUsersProp);
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        setUsers(initialUsersProp);
        setCurrentPage(1);
    }, [initialUsersProp]);


    const filteredUsers = useMemo(() => {
        if (!searchTerm.trim()) {
            return users;
        }
        const lowerSearchTerm = searchTerm.toLowerCase().trim();
        return users.filter(user =>
            (user.fullName || '').toLowerCase().includes(lowerSearchTerm) ||
            (user.email || '').toLowerCase().includes(lowerSearchTerm) ||
            user.id.toString().includes(lowerSearchTerm)
        );
    }, [users, searchTerm]);

    const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);

    const paginatedUsers = useMemo(() => {
        const startIndex = (currentPage - 1) * USERS_PER_PAGE;
        return filteredUsers.slice(startIndex, startIndex + USERS_PER_PAGE);
    }, [filteredUsers, currentPage]);


    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const handleAddNewUser = () => {
        setEditingUser(null);
        setShowUserForm(true);
    };

    const handleEditUser = (user: SafeUser) => {
        setEditingUser(user);
        setShowUserForm(true);
    };

    const handleDeleteUser = async (userId: number, userName: string | null) => {
        if (confirm(`Вы уверены, что хотите удалить пользователя "${userName || `ID: ${userId}`}"?`)) {
            setIsLoading(true);
            const result = await deleteUserAction(userId);
            setIsLoading(false);
            if (result.success) {
                toast.success('Пользователь удален.');
                setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
                const newFilteredCount = filteredUsers.filter(u => u.id !== userId).length;
                const newTotalPages = Math.ceil(newFilteredCount / USERS_PER_PAGE);
                if (currentPage > newTotalPages && newTotalPages > 0) {
                    setCurrentPage(newTotalPages);
                } else if (newTotalPages === 0) {
                    setCurrentPage(1);
                }
            } else {
                toast.error(result.message || 'Не удалось удалить пользователя.');
            }
        }
    };

    const handleFormSuccess = (updatedOrNewUser?: SafeUser) => {
        setShowUserForm(false);
        setEditingUser(null);
        if (updatedOrNewUser) {
            setUsers(prevUsers => {
                const userExists = prevUsers.find(u => u.id === updatedOrNewUser.id);
                if (userExists) {
                    return prevUsers.map(u => u.id === updatedOrNewUser.id ? updatedOrNewUser : u);
                } else {
                    return [updatedOrNewUser, ...prevUsers].sort((a,b) => (a.fullName || "").localeCompare(b.fullName || ""));
                }
            });
        }
    };

    const handleFormCancel = () => {
        setShowUserForm(false);
        setEditingUser(null);
    };

    return (
        <div className="space-y-6 p-4 md:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="w-full sm:w-auto flex-grow sm:flex-grow-0">
                    <Label htmlFor="user-search" className="sr-only">Поиск пользователей</Label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                            id="user-search"
                            type="text"
                            placeholder="Поиск..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="pl-10 w-full"
                        />
                    </div>
                </div>
                <Button onClick={handleAddNewUser} size="sm" className="w-full sm:w-auto">
                     <UserPlus className="mr-2 h-4 w-4" /> Добавить пользователя
                </Button>
            </div>

            {showUserForm && (
                <div className="border p-4 md:p-6 rounded-lg mb-6 bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                    <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">
                        {editingUser ? 'Редактировать пользователя' : 'Добавить нового пользователя'}
                    </h3>
                    <UserForm
                        key={editingUser?.id ?? 'new-user-form'}
                        user={editingUser}
                        onSuccess={handleFormSuccess}
                        onCancel={handleFormCancel}
                    />
                </div>
            )}

            {isLoading && <div className="text-center p-4">Обработка...</div>}

            {!showUserForm && (
                <>
                    {filteredUsers.length === 0 ? (
                        <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                            {searchTerm ? "Пользователи по вашему запросу не найдены." : "Пользователи не найдены."}
                        </p>
                    ) : (
                        <div className="overflow-x-auto rounded-lg border dark:border-gray-700">
                            <Table>
                                <TableHeader>
                                    <TableRow className="dark:border-gray-700">
                                        {/* <TableHead className="w-[50px] text-gray-700 dark:text-gray-300">ID</TableHead> */}
                                        <TableHead className="text-gray-700 dark:text-gray-300">Полное имя</TableHead>
                                        <TableHead className="text-gray-700 dark:text-gray-300">Email</TableHead>
                                        <TableHead className="text-gray-700 dark:text-gray-300">Роль</TableHead>
                                        <TableHead className="text-gray-700 dark:text-gray-300">Верифицирован</TableHead>
                                        <TableHead className="text-gray-700 dark:text-gray-300">Источник</TableHead>
                                        <TableHead className="text-gray-700 dark:text-gray-300">Дата рег.</TableHead>
                                        <TableHead className="text-right text-gray-700 dark:text-gray-300">Действия</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedUsers.map((user) => (
                                        <TableRow key={user.id} className="dark:border-gray-700">
                                            {/* <TableCell className="font-medium text-gray-800 dark:text-gray-200">{user.id}</TableCell> */}
                                            <TableCell className="text-gray-800 dark:text-gray-200">{user.fullName || '-'}</TableCell>
                                            <TableCell className="text-gray-800 dark:text-gray-200">{user.email}</TableCell>
                                            <TableCell>
                                                <Badge variant={user.role === UserRole.ADMIN ? 'destructive' : 'secondary'}>
                                                    {user.role}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {user.verified ? <Badge variant="default">Да</Badge> : <Badge variant="outline">Нет</Badge>}
                                            </TableCell>
                                            <TableCell className="text-gray-800 dark:text-gray-200">{user.provider || 'Cred.'}</TableCell>
                                            <TableCell className="text-gray-800 dark:text-gray-200">{formatDate(user.createdAt)}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditUser(user)}>
                                                    <Edit className="h-4 w-4" />
                                                    <span className="sr-only">Edit</span>
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700" onClick={() => handleDeleteUser(user.id, user.fullName)} disabled={isLoading}>
                                                    <Trash2 className="h-4 w-4" />
                                                    <span className="sr-only">Delete</span>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
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