'use client';

import React, { useState, useTransition } from 'react';
import { DateRange } from "react-day-picker";
import { addDays, format } from "date-fns";
import { ru } from "date-fns/locale";
import { Calendar as CalendarIcon, Download, Terminal, TrendingUp, BarChartBig, Warehouse } from "lucide-react";
import { cn } from '@/shared/lib/utils';
import { Button } from "@/shared/components/ui/button";
import { Calendar } from "@/shared/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert";
import { Label } from "@/shared/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/shared/components/ui/radio-group";
import { generateReport, SalesReportItem, RatingReportItem, StockReportItem, ReportResult } from '@/app/actions/report-actions';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';


const formatCurrency = (amountInCents: number) => (amountInCents).toFixed(2).replace('.', ',') + ' Br';
const formatDateSimple = (date: Date | null | undefined) => date ? format(date, "dd.MM.yyyy HH:mm") : 'N/A';

type ReportDataType = SalesReportItem[] | RatingReportItem[] | StockReportItem[];

export function SalesReportClient() {
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: addDays(new Date(), -30),
        to: new Date(),
    });
    const [reportType, setReportType] = useState<'sales' | 'rating' | 'stock'>('sales');
    const [reportData, setReportData] = useState<ReportDataType>([]);
    const [totalRevenue, setTotalRevenue] = useState<number | null>(null);
    const [isLoading, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [reportGenerated, setReportGenerated] = useState(false);
    const [generatedReportType, setGeneratedReportType] = useState<'sales' | 'rating' | 'stock' | null>(null);

    const handleGenerateReport = () => {
        if (!dateRange?.from || !dateRange?.to) {
            toast.error("Выберите диапазон дат.");
            return;
        }
        setError(null);
        setReportGenerated(false);
        setReportData([]);
        setTotalRevenue(null);
        setGeneratedReportType(null);

        startTransition(async () => {
            try {
                const result: ReportResult = await generateReport({
                    startDate: dateRange.from!,
                    endDate: dateRange.to!,
                    reportType: reportType,
                });
                if (result.success && result.report) {
                    setReportData(result.report);
                    setTotalRevenue(result.totalOverallRevenue ?? null);
                    setReportGenerated(true);
                    setGeneratedReportType(result.reportType || null);
                    if (result.report.length === 0) {
                        toast.success("Отчет сформирован, но за выбранный период данных не найдено.");
                    } else {
                        toast.success("Отчет успешно сформирован!");
                    }
                } else {
                    setError(result.message || "Не удалось сформировать отчет.");
                    toast.error(result.message || "Не удалось сформировать отчет.");
                }
            } catch (e: any) {
                console.error("Error generating report on client:", e);
                const message = e?.message || "Ошибка при формировании отчета.";
                setError(message);
                toast.error(message);
            }
        });
    };

    const handleExportToExcel = () => {
        if (!reportGenerated || !reportData || reportData.length === 0) {
            toast.error("Нет данных для экспорта. Сначала сформируйте отчет.");
            return;
        }

        let headers: string[];
        let dataForSheet: (string | number | null | undefined)[][];
        let sheetName: string;
        let fileNameSuffix: string;

        if (generatedReportType === 'sales') {
            headers = ["Номер товара", "Название товара", "Кол-во продано (шт.)", "Средняя цена (Br)", "Общая сумма (Br)"];
            dataForSheet = (reportData as SalesReportItem[]).map(item => [
                item.productId, item.productName, item.quantitySold,
                parseFloat((item.averagePrice).toFixed(2)),
                parseFloat((item.totalRevenue).toFixed(2))
            ]);
            sheetName = "Отчет о продажах";
            fileNameSuffix = "sales_report";
        }

        else if (generatedReportType === 'rating') {
            headers = ["Место", "Номер товара", "Название товара", "Кол-во продано (шт.)"];
            dataForSheet = (reportData as RatingReportItem[]).map((item, index) => [
                index + 1, item.productId, item.productName, item.quantitySold
            ]);
            sheetName = "Рейтинг товаров (Топ-20)";
            fileNameSuffix = "rating_report";
        }

        else if (generatedReportType === 'stock') {
            headers = ["Номер товара", "Название товара", "Текущий остаток (шт.)", "Последнее обновление"];
            dataForSheet = (reportData as StockReportItem[]).map(item => [
                item.productId,
                item.productName,
                item.currentStock,
                item.lastUpdatedAt ? formatDateSimple(item.lastUpdatedAt) : 'N/A'
            ]);
            sheetName = "Отчет по остаткам";
            fileNameSuffix = "stock_report";
        }
         
        else {
            toast.error("Неизвестный тип отчета для экспорта.");
            return;
        }

        const ws = XLSX.utils.aoa_to_sheet([headers, ...dataForSheet]);
        ws['!cols'] = headers.map((_, i) => {
            const maxLength = Math.max(
                headers[i].length,
                ...dataForSheet.map(row => (row[i] ? String(row[i]).length : 0))
            );
            return { wch: maxLength + 2 };
        });

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
        const fileName = `${fileNameSuffix}_${format(dateRange?.from || new Date(), 'yyyy-MM-dd')}_to_${format(dateRange?.to || new Date(), 'yyyy-MM-dd')}.xlsx`;
        XLSX.writeFile(wb, fileName);
        toast.success("Отчет успешно экспортирован в Excel");
    };

    return (
        <div className="space-y-6 p-1">
            <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Параметры отчета</h3>
                <div className="mb-6">
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Тип отчета:</Label>
                    <RadioGroup
                        defaultValue="sales"
                        value={reportType}
                        onValueChange={(value) => setReportType(value as 'sales' | 'rating' | 'stock')}
                        className="flex flex-col sm:flex-row gap-3 sm:gap-4"
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="sales" id="report-sales" />
                            <Label htmlFor="report-sales" className="cursor-pointer flex items-center gap-2 text-sm">
                                <BarChartBig className="h-4 w-4 text-gray-500 dark:text-gray-400"/> Отчет о продажах
                            </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="rating" id="report-rating" />
                            <Label htmlFor="report-rating" className="cursor-pointer flex items-center gap-2 text-sm">
                                <TrendingUp className="h-4 w-4 text-gray-500 dark:text-gray-400"/> Рейтинг товаров (Топ-20)
                            </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="stock" id="report-stock" />
                            <Label htmlFor="report-stock" className="cursor-pointer flex items-center gap-2 text-sm">
                                <Warehouse className="h-4 w-4 text-gray-500 dark:text-gray-400"/> Отчет по остаткам
                            </Label>
                        </div>
                    </RadioGroup>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                    <div className={cn("grid gap-1")}>
                        <Label htmlFor="date-range-picker-reports" className="text-sm font-medium text-gray-700 dark:text-gray-300">Период:</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    id="date-range-picker-reports"
                                    variant={"outline"}
                                    className={cn(
                                        "w-full sm:w-[280px] justify-start text-left font-normal h-10",
                                        !dateRange && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dateRange?.from ? (
                                        dateRange.to ? (
                                            <>
                                                {format(dateRange.from, "dd LLL y", { locale: ru })} - {format(dateRange.to, "dd LLL y", { locale: ru })}
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
                                    disabled={(date) => date > new Date() || date < new Date("2000-01-01")}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <Button onClick={handleGenerateReport} disabled={isLoading || !dateRange?.from || !dateRange?.to} className="h-10 w-full sm:w-auto">
                        {isLoading ? 'Формирование...' : 'Сформировать'}
                    </Button>
                    {reportGenerated && reportData.length > 0 && (
                        <Button onClick={handleExportToExcel} variant="outline" disabled={isLoading} className="h-10 w-full sm:w-auto flex items-center gap-2">
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
                 <div className="mt-6 bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow">
                     {reportData.length > 0 ? (
                         <>
                             <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4">
                                 <h3 className="text-md sm:text-lg font-semibold text-gray-900 dark:text-white mb-2 sm:mb-0">
                                     { generatedReportType === 'sales' ? "Отчет о продажах"
                                       : generatedReportType === 'rating' ? "Рейтинг товаров"
                                       : "Отчет по остаткам товаров" }
                                     {/* Период для sales и rating */}
                                     {(generatedReportType === 'sales' || generatedReportType === 'rating') && dateRange?.from && dateRange?.to && (
                                        <> за: <span className="font-normal">{format(dateRange.from, "dd.MM.yy", { locale: ru })} - {format(dateRange.to, "dd.MM.yy", { locale: ru })}</span></>
                                     )}
                                 </h3>
                                  {generatedReportType === 'sales' && totalRevenue !== null && (
                                     <p className="text-md sm:text-lg font-semibold text-gray-900 dark:text-white">
                                         Общая выручка: {formatCurrency(totalRevenue)}
                                     </p>
                                 )}
                             </div>

                             <div className="overflow-x-auto rounded-md border dark:border-gray-700">
                                 <Table>
                                     <TableHeader>
                                         <TableRow className="dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50">
                                             {/* Заголовки STOCK */}
                                             {generatedReportType === 'stock' && <>
                                                 <TableHead className="text-gray-600 dark:text-gray-300">Номер товара</TableHead>
                                                 <TableHead className="min-w-[200px] text-gray-600 dark:text-gray-300">Название товара</TableHead>
                                                 <TableHead className="text-center text-gray-600 dark:text-gray-300">Остаток (шт.)</TableHead>
                                                 <TableHead className="text-right text-gray-600 dark:text-gray-300">Обновлено</TableHead>
                                             </>}
                                             {/* Заголовки RATING */}
                                             {generatedReportType === 'rating' && <TableHead className="text-gray-600 dark:text-gray-300">Место</TableHead>}
                                             {/* Общие заголовки SALES и RATING */}
                                             {(generatedReportType === 'sales' || generatedReportType === 'rating') && <>
                                                 <TableHead className="text-gray-600 dark:text-gray-300">Номер товара</TableHead>
                                                 <TableHead className="min-w-[200px] text-gray-600 dark:text-gray-300">Название товара</TableHead>
                                                 <TableHead className="text-center text-gray-600 dark:text-gray-300">Кол-во продано</TableHead>
                                             </>}
                                             {/* Заголовки SALES */}
                                             {generatedReportType === 'sales' && <>
                                                 <TableHead className="text-right text-gray-600 dark:text-gray-300">Средняя цена</TableHead>
                                                 <TableHead className="text-right text-gray-600 dark:text-gray-300">Общая сумма</TableHead>
                                             </>}
                                         </TableRow>
                                     </TableHeader>
                                     <TableBody>
                                         {reportData.map((item, index) => (
                                             <TableRow key={generatedReportType === 'stock' ? (item as StockReportItem).productId : item.productId} className="dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                                 {/* Данные STOCK */}
                                                 {generatedReportType === 'stock' && <>
                                                     <TableCell className="font-medium text-gray-800 dark:text-gray-100">{(item as StockReportItem).productId}</TableCell>
                                                     <TableCell className="text-gray-800 dark:text-gray-100">{(item as StockReportItem).productName}</TableCell>
                                                     <TableCell className="text-center text-gray-700 dark:text-gray-300">{(item as StockReportItem).currentStock ?? 'N/A'}</TableCell>
                                                     <TableCell className="text-right text-xs text-gray-600 dark:text-gray-400">{formatDateSimple((item as StockReportItem).lastUpdatedAt)}</TableCell>
                                                 </>}
                                                 {generatedReportType === 'rating' && <TableCell className="text-gray-700 dark:text-gray-200">{index + 1}</TableCell>}
                                                 {/* Общие данные SALES и RATING */}
                                                 {(generatedReportType === 'sales' || generatedReportType === 'rating') && <>
                                                    <TableCell className="font-medium text-gray-800 dark:text-gray-100">{item.productId}</TableCell>
                                                    <TableCell className="text-gray-800 dark:text-gray-100">{item.productName}</TableCell>
                                                    <TableCell className="text-center text-gray-700 dark:text-gray-300">{item.quantitySold}</TableCell>
                                                 </>}
                                                 {/* Данные SALES */}
                                                 {generatedReportType === 'sales' && <>
                                                    <TableCell className="text-right text-gray-700 dark:text-gray-300">{formatCurrency((item as SalesReportItem).averagePrice)}</TableCell>
                                                    <TableCell className="text-right font-semibold text-gray-800 dark:text-gray-100">{formatCurrency((item as SalesReportItem).totalRevenue)}</TableCell>
                                                 </>}
                                             </TableRow>
                                         ))}
                                     </TableBody>
                                 </Table>
                             </div>
                         </>
                     ) : (
                         <p className="text-center text-gray-500 dark:text-gray-400 py-6">За выбранный период данных не найдено.</p>
                     )}
                 </div>
            )}
        </div>
    );
}