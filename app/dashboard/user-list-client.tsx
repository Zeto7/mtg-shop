'use client';

import React, { useState } from 'react';
import { SafeUser } from '@/app/actions/user-actions';
import { Badge } from "@/shared/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { Button } from '@/shared/components/ui/button';
import { Trash2, Edit, UserPlus } from 'lucide-react';
import { UserForm } from '@/shared/components/shared/admin-user-form';
import { deleteUserAction } from '@/app/actions/user-actions';
import toast from 'react-hot-toast';

interface UserListClientProps {
    users: SafeUser[];
}

const formatDate = (date: Date | null | undefined) => {};

export function UserListClient({ users: initialUsers }: UserListClientProps) {
    const [showUserForm, setShowUserForm] = useState(false);
    const [editingUser, setEditingUser] = useState<SafeUser | null>(null);

     const users = initialUsers;

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
            const result = await deleteUserAction(userId);
            if (result.success) {
                toast.success('Пользователь удален.');
            } else {
                toast.error(result.message || 'Не удалось удалить пользователя.');
            }
        }
    };

    const handleFormSuccess = () => {
        setShowUserForm(false);
        setEditingUser(null);
        // RevalidatePath в Server Action обновит список
    };

    const handleFormCancel = () => {
        setShowUserForm(false);
        setEditingUser(null);
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-end mb-4">
                <Button onClick={handleAddNewUser} size="sm">
                     <UserPlus className="mr-2 h-4 w-4" /> Добавить пользователя
                </Button>
            </div>

            {showUserForm && (
                <div className="border p-4 rounded-lg mb-6 bg-gray-50">
                    <h3 className="text-lg font-semibold mb-3">
                        {editingUser ? 'Редактировать пользователя' : 'Добавить нового пользователя'}
                    </h3>
                    <UserForm
                        key={editingUser?.id ?? 'new'}
                        user={editingUser}
                        onSuccess={handleFormSuccess}
                        onCancel={handleFormCancel}
                    />
                </div>
            )}

            {/* --- Таблица пользователей --- */}
            {users.length === 0 && !showUserForm ? (
                <p className="text-gray-500">Пользователи не найдены.</p>
            ) : (
                 <div className="overflow-x-auto rounded-lg border">
                     <Table>
                         <TableHeader>
                             <TableRow>
                                 <TableHead className="w-[50px]">ID</TableHead>
                                 <TableHead>Полное имя</TableHead>
                                 <TableHead>Email</TableHead>
                                 <TableHead>Роль</TableHead>
                                 <TableHead>Верифицирован</TableHead>
                                 <TableHead>Источник</TableHead>
                                 <TableHead>Дата рег.</TableHead>
                                 <TableHead className="text-right">Действия</TableHead> {/* Новая колонка */}
                             </TableRow>
                         </TableHeader>
                         <TableBody>
                             {users.map((user) => (
                                 <TableRow key={user.id}>
                                     <TableCell className="font-medium">{user.id}</TableCell>
                                     <TableCell>{user.fullName || '-'}</TableCell>
                                     <TableCell>{user.email}</TableCell>
                                     <TableCell>
                                         <Badge variant={user.role === 'ADMIN' ? 'destructive' : 'secondary'}>
                                             {user.role}
                                         </Badge>
                                     </TableCell>
                                     <TableCell>
                                         {user.verified ? <Badge variant="default">Да</Badge> : <Badge variant="outline">Нет</Badge>}
                                     </TableCell>
                                     <TableCell>{user.provider || 'Cred.'}</TableCell>
                                     <TableCell>{formatDate(user.createdAt)}</TableCell>
                                     <TableCell className="text-right">
                                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditUser(user)}>
                                               <Edit className="h-4 w-4" />
                                               <span className="sr-only">Edit</span>
                                          </Button>
                                           <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700" onClick={() => handleDeleteUser(user.id, user.fullName)}>
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
        </div>
    );
}