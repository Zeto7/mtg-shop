'use client';

import React, { useState, useTransition } from 'react';
import { DateRange } from "react-day-picker";
import { addDays, format } from "date-fns";
import { ru } from "date-fns/locale";
import { Calendar as CalendarIcon, Download, Terminal } from "lucide-react";
import { cn } from '@/shared/lib/utils';
import { Button } from "@/shared/components/ui/button";
import { Calendar } from "@/shared/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert";
import { getSalesReport, SalesReportItem } from '@/app/actions/report-actions';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';


const defaultStartDate = addDays(new Date(), -30);
const defaultEndDate = new Date();

export function SalesReportClient() {
    const [dateRange, setDateRange] = useState<DateRange | undefined>({ from: addDays(new Date(), -30), to: new Date() });
    const [reportData, setReportData] = useState<SalesReportItem[]>([]);
    const [totalRevenue, setTotalRevenue] = useState<number | null>(null);
    const [isLoading, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [reportGenerated, setReportGenerated] = useState(false);


    const handleGenerateReport = () => {
        if (!dateRange?.from || !dateRange?.to) {
            toast.error("Выберите диапазон дат.");
            return;
        }
        setError(null);
        setReportGenerated(false);
        setReportData([]);
        setTotalRevenue(null);

        startTransition(async () => {
            try {
                const result = await getSalesReport({
                    startDate: dateRange.from!,
                    endDate: dateRange.to!,
                });
                if (result.success && result.report) {
                    setReportData(result.report);
                    setTotalRevenue(result.totalOverallRevenue ?? 0);
                    setReportGenerated(true);
                    if (result.report.length === 0) {
                        toast.success("Отчет сформирован, но за выбранный период продаж не найдено.");
                    } else {
                        toast.success("Отчет успешно сформирован!");
                    }
                } else {
                    setError(result.message || "Не удалось сформировать отчет.");
                    toast.error(result.message || "Не удалось сформировать отчет.");
                }
            } catch (e) {
                console.error("Error generating report:", e);
                setError("Ошибка при формировании отчета.");
                toast.error("Ошибка при формировании отчета.");
            }
        });
    };

    const handleExportToExcel = () => {
        if (!reportData || reportData.length === 0) {
            toast.error("Нет данных для экспорта.");
            return;
        }

        // Подготовка данных для листа Excel
        const headers = ["ID Товара", "Название товара", "Кол-во продано (шт.)", "Средняя цена (коп.)", "Общая выручка (коп.)"];
        const dataForSheet = reportData.map(item => [
            item.productId,
            item.productName,
            item.quantitySold,
            item.averagePrice,
            item.totalRevenue
        ]);

        // Создание листа (worksheet) из массива данных (сначала заголовки, потом данные)
        const ws = XLSX.utils.aoa_to_sheet([headers, ...dataForSheet]);

        // Создание книги (workbook)
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Отчет о продажах"); // "Отчет о продажах" - название листа

        // Генерация файла и инициирование загрузки
        const fileName = `sales_report_${format(dateRange?.from || new Date(), 'yyyy-MM-dd')}_to_${format(dateRange?.to || new Date(), 'yyyy-MM-dd')}.xlsx`;
        XLSX.writeFile(wb, fileName);

        toast.success("Отчет успешно экспортирован в Excel");
    };


    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Выбор периода для отчета</h3>
                <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                    <div className={cn("grid gap-2")}>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    id="date"
                                    variant={"outline"}
                                    className={cn(
                                        "w-[280px] justify-start text-left font-normal h-10",
                                        !dateRange && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dateRange?.from ? (
                                        dateRange.to ? (
                                            <>
                                                {format(dateRange.from, "dd LLL y", { locale: ru })} - {" "}
                                                {format(dateRange.to, "dd LLL y", { locale: ru })}
                                            </>
                                        ) : (
                                            format(dateRange.from, "dd LLL y", { locale: ru })
                                        )
                                    ) : (
                                        <span>Выберите диапазон</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={dateRange?.from}
                                    selected={dateRange}
                                    onSelect={setDateRange}
                                    numberOfMonths={2}
                                    locale={ru}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <Button onClick={handleGenerateReport} disabled={isLoading || !dateRange?.from || !dateRange?.to} className="h-10">
                        {isLoading ? 'Формирование...' : 'Сформировать отчет'}
                    </Button>
                    {reportGenerated && reportData.length > 0 && (
                        <Button onClick={handleExportToExcel} variant="outline" disabled={isLoading} className="h-10 flex items-center gap-2">
                            <Download className="h-4 w-4"/> Экспорт в Excel
                        </Button>
                    )}
                </div>
            </div>

            {error && (
                <Alert variant="destructive" className="mt-4">
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>Ошибка</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {reportGenerated && (
                 <div className="mt-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                     {reportData.length > 0 ? (
                         <>
                             <div className="flex justify-between items-center mb-4">
                                 <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                     Отчет о продажах за период: {" "}
                                     {dateRange?.from && format(dateRange.from, "dd.MM.yyyy", { locale: ru })} - {" "}
                                     {dateRange?.to && format(dateRange.to, "dd.MM.yyyy", { locale: ru })}
                                 </h3>
                                  {totalRevenue !== null && (
                                     <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                         Общая выручка: {(totalRevenue).toFixed(2)} Br
                                     </p>
                                 )}
                             </div>
                             <div className="overflow-x-auto rounded-md border dark:border-gray-700">
                                 <Table>
                                     <TableHeader>
                                         <TableRow className="dark:border-gray-600">
                                             <TableHead className="text-gray-700 dark:text-gray-300">ID</TableHead>
                                             <TableHead className="text-gray-700 dark:text-gray-300">Название товара</TableHead>
                                             <TableHead className="text-center text-gray-700 dark:text-gray-300">Кол-во продано</TableHead>
                                             <TableHead className="text-right text-gray-700 dark:text-gray-300">Средняя цена</TableHead>
                                             <TableHead className="text-right text-gray-700 dark:text-gray-300">Общая выручка</TableHead>
                                         </TableRow>
                                     </TableHeader>
                                     <TableBody>
                                         {reportData.map((item) => (
                                             <TableRow key={item.productId} className="dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                 <TableCell className="font-medium text-gray-900 dark:text-gray-100">{item.productId}</TableCell>
                                                 <TableCell className="text-gray-900 dark:text-gray-100">{item.productName}</TableCell>
                                                 <TableCell className="text-center text-gray-700 dark:text-gray-300">{item.quantitySold}</TableCell>
                                                 <TableCell className="text-right text-gray-700 dark:text-gray-300">{(item.averagePrice)}</TableCell>
                                                 <TableCell className="text-right font-semibold text-gray-900 dark:text-gray-100">{(item.totalRevenue).toFixed(2)} Br</TableCell>
                                             </TableRow>
                                         ))}
                                     </TableBody>
                                 </Table>
                             </div>
                         </>
                     ) : (
                         <p className="text-center text-gray-500 dark:text-gray-400 py-4">За выбранный период продаж не найдено.</p>
                     )}
                 </div>
            )}
        </div>
    );
}