'use client';

import { useState, useEffect } from 'react';

interface Item {
    id: number;
    name: string;
    pricePerUnit: number;
    quantity: number;
    unit: string;
    totalPrice: number;
}

interface List {
    id: number;
    name: string;
    items: Item[];
    createdAt: string;
}

export default function Page() {
    const [lists, setLists] = useState<List[]>([]);
    const [currentListId, setCurrentListId] = useState<number | null>(null);
    const [showNewListModal, setShowNewListModal] = useState<boolean>(false);
    const [newListName, setNewListName] = useState<string>('');
    const [peopleCount, setPeopleCount] = useState<number>(1);
    const [editingListId, setEditingListId] = useState<number | null>(null);
    const [editingListName, setEditingListName] = useState<string>('');

    // Получаем текущий список по ID
    const currentList = lists.find((list) => list.id === currentListId);

    // Загрузка данных из localStorage при монтировании
    useEffect(() => {
        const savedLists = localStorage.getItem('cookingLists');
        if (savedLists) {
            const parsedLists: List[] = JSON.parse(savedLists);
            setLists(parsedLists);
            if (parsedLists.length > 0) {
                setCurrentListId(parsedLists[0].id);
            }
        }
    }, []);

    // Сохранение списков в localStorage при их изменении
    useEffect(() => {
        localStorage.setItem('cookingLists', JSON.stringify(lists));
    }, [lists]);

    // Создание нового списка
    const createNewList = () => {
        if (!newListName.trim()) return;
        const newList: List = {
            id: Date.now(),
            name: newListName.trim(),
            items: [],
            createdAt: new Date().toISOString(),
        };
        setLists([...lists, newList]);
        setCurrentListId(newList.id);
        setNewListName('');
        setShowNewListModal(false);
    };

    // Удаление списка
    const deleteList = (listId: number) => {
        const updatedLists = lists.filter((list) => list.id !== listId);
        setLists(updatedLists);
        if (currentListId === listId) {
            setCurrentListId(updatedLists.length > 0 ? updatedLists[0].id : null);
        }
    };

    // Начать редактирование названия списка
    const startEditingList = (listId: number, currentName: string) => {
        setEditingListId(listId);
        setEditingListName(currentName);
    };

    // Сохранить новое название списка
    const saveListName = () => {
        if (!editingListName.trim() || editingListId === null) return;
        const updatedLists = lists.map((list) =>
            list.id === editingListId ? { ...list, name: editingListName.trim() } : list,
        );
        setLists(updatedLists);
        setEditingListId(null);
        setEditingListName('');
    };

    // Отменить редактирование названия
    const cancelEditingList = () => {
        setEditingListId(null);
        setEditingListName('');
    };

    // Добавить новый товар в текущий список
    const addItem = () => {
        if (!currentList) return;
        const newItem: Item = {
            id: Date.now(),
            name: '',
            pricePerUnit: 0,
            quantity: 1,
            unit: 'шт',
            totalPrice: 0,
        };
        const updatedLists = lists.map((list) =>
            list.id === currentListId ? { ...list, items: [...list.items, newItem] } : list,
        );
        setLists(updatedLists);
    };

    // Обновить свойство товара и пересчитать totalPrice/pricePerUnit
    const updateItem = (itemId: number, field: keyof Item, value: string | number) => {
        const updatedLists = lists.map((list) => {
            if (list.id !== currentListId) return list;
            return {
                ...list,
                items: list.items.map((item) => {
                    if (item.id !== itemId) return item;
                    const updatedItem = { ...item, [field]: value };
                    if (field === 'pricePerUnit' || field === 'quantity') {
                        updatedItem.totalPrice = updatedItem.pricePerUnit * updatedItem.quantity;
                    } else if (field === 'totalPrice') {
                        if (updatedItem.quantity > 0) {
                            updatedItem.pricePerUnit =
                                updatedItem.totalPrice / updatedItem.quantity;
                        }
                    }
                    return updatedItem;
                }),
            };
        });
        setLists(updatedLists);
    };

    // Удалить товар из списка
    const deleteItem = (itemId: number) => {
        const updatedLists = lists.map((list) =>
            list.id === currentListId
                ? {
                      ...list,
                      items: list.items.filter((item) => item.id !== itemId),
                  }
                : list,
        );
        setLists(updatedLists);
    };

    // Скролл и подсветка на элемент при клике в кратком списке
    const scrollToItem = (itemId: number) => {
        const element = document.getElementById(`item-${itemId}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('ring-4', 'ring-blue-300', 'ring-opacity-50');
            setTimeout(() => {
                element.classList.remove('ring-4', 'ring-blue-300', 'ring-opacity-50');
            }, 2000);
        }
    };

    // Общая стоимость текущего списка
    const getTotalCost = () => {
        if (!currentList) return 0;
        return currentList.items.reduce((sum, item) => sum + item.totalPrice, 0);
    };

    // Стоимость на человека
    const getCostPerPerson = () => {
        return peopleCount > 0 ? getTotalCost() / peopleCount : 0;
    };

    // Экспорт списка: если forImport=true — JSON, иначе Markdown
    const exportToMarkdown = (forImport: boolean = false) => {
        if (!currentList) return;

        if (forImport) {
            // JSON для импорта
            const exportData = {
                name: currentList.name,
                items: currentList.items,
                exportedAt: new Date().toISOString(),
            };
            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${currentList.name}.json`;
            link.click();
        } else {
            // Markdown для копирования
            let markdown = `# 🛒 ${currentList.name}\n\n`;
            markdown += `**Общая стоимость:** ${getTotalCost().toFixed(2)} ₽\n`;
            markdown += `**На ${peopleCount} чел:** ${getCostPerPerson().toFixed(2)} ₽/чел\n\n`;
            markdown += `## Список продуктов:\n\n`;
            currentList.items.forEach((item, index) => {
                markdown += `${index + 1}. **${item.name}**\n`;
                markdown += ` • ${item.quantity} ${item.unit} × ${item.pricePerUnit.toFixed(2)} ₽ = ${item.totalPrice.toFixed(2)} ₽\n\n`;
            });
            markdown += `---\n*Создано ${new Date().toLocaleDateString('ru-RU')}*`;

            navigator.clipboard.writeText(markdown).then(() => {
                alert('Список скопирован в буфер обмена!');
            });
        }
    };

    // Импорт списка из JSON-файла
    const importFromFile = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importData = JSON.parse(e.target?.result as string);
                const newList: List = {
                    id: Date.now(),
                    name: `${importData.name} (импорт)`,
                    items: importData.items,
                    createdAt: new Date().toISOString(),
                };
                setLists([...lists, newList]);
                setCurrentListId(newList.id);
                alert('Список успешно импортирован!');
            } catch {
                alert('Ошибка при импорте файла');
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    };

    return (
        <div className="min-h-screen bg-gray-900">
            {/* Header */}
            <header className="bg-gray-900/80 backdrop-blur-xl border-b border-gray-700/50">
                <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <span className="text-2xl">🛒</span> Списки продуктов
                    </h1>
                    <div className="flex items-center gap-3">
                        <input
                            type="file"
                            accept=".json"
                            onChange={importFromFile}
                            className="hidden"
                            id="import-file"
                        />
                        <label
                            htmlFor="import-file"
                            className="px-4 py-2.5 bg-gray-800 text-gray-300 rounded-xl hover:bg-gray-700 cursor-pointer transition-all text-sm border border-gray-700 hover:border-gray-600"
                        >
                            📥 Импорт
                        </label>
                        <button
                            onClick={() => setShowNewListModal(true)}
                            className="px-5 py-2.5 bg-white text-gray-900 rounded-xl hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl font-medium"
                        >
                            + Новый список
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Sidebar с списками */}
                    <div className="lg:col-span-1">
                        <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-6">
                            <h3 className="font-semibold text-white mb-4 text-lg">Мои списки</h3>
                            <div className="space-y-3">
                                {lists.map((list) => (
                                    <div
                                        key={list.id}
                                        className={`p-4 rounded-xl cursor-pointer transition-all ${
                                            currentListId === list.id
                                                ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/50 shadow-lg'
                                                : 'bg-gray-700/30 hover:bg-gray-700/50 border border-gray-600/30'
                                        }`}
                                        onClick={() => setCurrentListId(list.id)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium text-white">
                                                {list.name}
                                            </span>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteList(list.id);
                                                }}
                                                className="text-red-400 hover:text-red-300 transition-colors"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                        <div className="text-sm text-gray-400 mt-2">
                                            {list.items.length} товаров
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Основной контент */}
                    <div className="lg:col-span-3">
                        {currentList ? (
                            <div className="space-y-8">
                                {/* Заголовок списка и статистика */}
                                <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-8">
                                    <div className="flex items-center justify-between mb-4">
                                        {editingListId === currentList.id ? (
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="text"
                                                    value={editingListName}
                                                    onChange={(e) =>
                                                        setEditingListName(e.target.value)
                                                    }
                                                    onKeyPress={(e) =>
                                                        e.key === 'Enter' && saveListName()
                                                    }
                                                    className="text-2xl font-bold text-white bg-transparent border-b-2 border-blue-500 outline-none"
                                                    autoFocus
                                                />
                                                <button
                                                    onClick={saveListName}
                                                    className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
                                                >
                                                    ✓
                                                </button>
                                                <button
                                                    onClick={cancelEditingList}
                                                    className="px-3 py-1.5 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700 transition-colors"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ) : (
                                            <h2
                                                className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent cursor-pointer hover:from-blue-400 hover:to-purple-400 transition-all"
                                                onClick={() =>
                                                    startEditingList(
                                                        currentList.id,
                                                        currentList.name,
                                                    )
                                                }
                                                title="Нажмите для редактирования"
                                            >
                                                {currentList.name} ✏️
                                            </h2>
                                        )}
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => exportToMarkdown(false)}
                                                className="px-4 py-2.5 bg-green-600/20 text-green-400 rounded-xl hover:bg-green-600/30 transition-all text-sm border border-green-600/30"
                                            >
                                                📋 Копировать
                                            </button>
                                            <button
                                                onClick={() => exportToMarkdown(true)}
                                                className="px-4 py-2.5 bg-blue-600/20 text-blue-400 rounded-xl hover:bg-blue-600/30 transition-all text-sm border border-blue-600/30"
                                            >
                                                📤 Экспорт
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="bg-blue-600/20 p-6 rounded-2xl border border-blue-600/30">
                                            <div className="text-sm text-blue-400 font-medium mb-2">
                                                Общая стоимость
                                            </div>
                                            <div className="text-3xl font-bold text-white">
                                                {getTotalCost().toFixed(2)} ₽
                                            </div>
                                        </div>

                                        <div className="bg-green-600/20 p-6 rounded-2xl border border-green-600/30">
                                            <div className="text-sm text-green-400 font-medium mb-2">
                                                Количество человек
                                            </div>
                                            <input
                                                type="number"
                                                min="1"
                                                value={peopleCount}
                                                onChange={(e) =>
                                                    setPeopleCount(
                                                        Math.max(1, parseInt(e.target.value) || 1),
                                                    )
                                                }
                                                className="text-3xl font-bold text-white bg-transparent border-none outline-none w-full"
                                            />
                                        </div>

                                        <div className="bg-orange-600/20 p-6 rounded-2xl border border-orange-600/30">
                                            <div className="text-sm text-orange-400 font-medium mb-2">
                                                На человека
                                            </div>
                                            <div className="text-3xl font-bold text-white">
                                                {getCostPerPerson().toFixed(2)} ₽
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Краткий предпросмотр списка */}
                                {currentList.items.length > 0 && (
                                    <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-8">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-xl font-semibold text-white">
                                                📋 Краткий список
                                            </h3>
                                            <div className="text-sm text-gray-400">
                                                {currentList.items.length} товаров
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {currentList.items.map((item, index) => (
                                                <div
                                                    key={item.id}
                                                    className="flex items-center justify-between p-4 bg-gray-700/30 rounded-xl hover:bg-gray-700/50 transition-all cursor-pointer group border border-gray-600/30"
                                                    onClick={() => scrollToItem(item.id)}
                                                >
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs text-gray-500 font-medium">
                                                                {index + 1}.
                                                            </span>
                                                            <span className="font-medium text-white truncate">
                                                                {item.name || 'Без названия'}
                                                            </span>
                                                        </div>
                                                        <div className="text-sm text-gray-400 mt-1">
                                                            {item.quantity > 0 &&
                                                            item.pricePerUnit > 0 ? (
                                                                <span>
                                                                    {item.quantity} {item.unit} ×{' '}
                                                                    {item.pricePerUnit.toFixed(2)} ₽
                                                                </span>
                                                            ) : (
                                                                <span className="text-gray-500 italic">
                                                                    Не заполнено
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="text-right">
                                                            <div className="font-semibold text-white">
                                                                {item.totalPrice.toFixed(2)} ₽
                                                            </div>
                                                        </div>
                                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <svg
                                                                className="w-4 h-4 text-blue-400"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={2}
                                                                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                                                />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="mt-6 pt-6 border-t border-gray-700/50">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-gray-400">
                                                    Нажмите на товар для редактирования
                                                </span>
                                                <div className="flex items-center gap-4">
                                                    <span className="text-gray-400">
                                                        Заполнено:{' '}
                                                        {
                                                            currentList.items.filter(
                                                                (item) =>
                                                                    item.name &&
                                                                    item.quantity > 0 &&
                                                                    item.pricePerUnit > 0,
                                                            ).length
                                                        }{' '}
                                                        из {currentList.items.length}
                                                    </span>
                                                    <span className="font-semibold text-white">
                                                        Итого: {getTotalCost().toFixed(2)} ₽
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Список товаров */}
                                <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-8">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-xl font-semibold text-white">Товары</h3>
                                        <button
                                            onClick={addItem}
                                            className="px-5 py-3 bg-white text-gray-900 rounded-xl hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl font-medium"
                                        >
                                            + Добавить товар
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        {currentList.items.map((item) => (
                                            <div
                                                key={item.id}
                                                id={`item-${item.id}`}
                                                className="border border-gray-600/30 rounded-2xl p-6 hover:shadow-xl transition-all bg-gray-700/30 scroll-mt-4 hover:border-gray-500/50"
                                            >
                                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
                                                    {/* Название товара */}
                                                    <div className="lg:col-span-4">
                                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                                            Название товара
                                                        </label>
                                                        <input
                                                            type="text"
                                                            placeholder="Введите название"
                                                            value={item.name}
                                                            onChange={(e) =>
                                                                updateItem(
                                                                    item.id,
                                                                    'name',
                                                                    e.target.value,
                                                                )
                                                            }
                                                            className="w-full px-4 py-3 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-gray-800/50 text-white placeholder-gray-400"
                                                        />
                                                    </div>

                                                    {/* Цена за единицу */}
                                                    <div className="lg:col-span-2">
                                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                                            Цена за ед.
                                                        </label>
                                                        <div className="relative">
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                placeholder="0.00"
                                                                value={item.pricePerUnit || ''}
                                                                onChange={(e) =>
                                                                    updateItem(
                                                                        item.id,
                                                                        'pricePerUnit',
                                                                        parseFloat(
                                                                            e.target.value,
                                                                        ) || 0,
                                                                    )
                                                                }
                                                                className="w-full px-4 py-3 pr-10 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-gray-800/50 text-white placeholder-gray-400"
                                                            />
                                                            <span className="absolute right-3 top-3 text-gray-400 text-sm">
                                                                ₽
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Количество и единица измерения */}
                                                    <div className="lg:col-span-3">
                                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                                            Количество
                                                        </label>
                                                        <div className="flex gap-2">
                                                            <input
                                                                type="number"
                                                                step={
                                                                    item.unit === 'шт' ||
                                                                    item.unit === 'упак'
                                                                        ? '1'
                                                                        : '0.5'
                                                                }
                                                                min="0"
                                                                placeholder="0"
                                                                value={item.quantity || ''}
                                                                onChange={(e) =>
                                                                    updateItem(
                                                                        item.id,
                                                                        'quantity',
                                                                        parseFloat(
                                                                            e.target.value,
                                                                        ) || 0,
                                                                    )
                                                                }
                                                                className="flex-1 px-4 py-3 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-gray-800/50 text-white placeholder-gray-400"
                                                            />
                                                            <select
                                                                value={item.unit}
                                                                onChange={(e) =>
                                                                    updateItem(
                                                                        item.id,
                                                                        'unit',
                                                                        e.target.value,
                                                                    )
                                                                }
                                                                className="px-4 py-3 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-gray-800/50 text-white min-w-[80px]"
                                                            >
                                                                <option value="шт">шт</option>
                                                                <option value="кг">кг</option>
                                                                <option value="л">л</option>
                                                                <option value="упак">упак</option>
                                                            </select>
                                                        </div>
                                                    </div>

                                                    {/* Общая стоимость */}
                                                    <div className="lg:col-span-2">
                                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                                            Общая стоимость
                                                        </label>
                                                        <div className="relative">
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                placeholder="0.00"
                                                                value={item.totalPrice || ''}
                                                                onChange={(e) =>
                                                                    updateItem(
                                                                        item.id,
                                                                        'totalPrice',
                                                                        parseFloat(
                                                                            e.target.value,
                                                                        ) || 0,
                                                                    )
                                                                }
                                                                className="w-full px-4 py-3 pr-10 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-gray-800/50 text-white placeholder-gray-400 font-medium"
                                                            />
                                                            <span className="absolute right-3 top-3 text-gray-400 text-sm">
                                                                ₽
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Кнопка удаления */}
                                                    <div className="lg:col-span-1">
                                                        <button
                                                            onClick={() => deleteItem(item.id)}
                                                            className="w-full px-3 py-3 bg-red-600/20 text-red-400 rounded-xl hover:bg-red-600/30 transition-all flex items-center justify-center border border-red-600/30"
                                                            title="Удалить товар"
                                                        >
                                                            🗑️
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Мобильная версия - показываем расчет */}
                                                <div className="lg:hidden mt-4 pt-4 border-t border-gray-600/50">
                                                    <div className="text-sm text-gray-400">
                                                        {item.quantity > 0 &&
                                                            item.pricePerUnit > 0 && (
                                                                <span>
                                                                    {item.quantity} {item.unit} ×{' '}
                                                                    {item.pricePerUnit.toFixed(2)} ₽
                                                                    = {item.totalPrice.toFixed(2)} ₽
                                                                </span>
                                                            )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {currentList.items.length === 0 && (
                                            <div className="text-center py-12 text-gray-400">
                                                <div className="text-4xl mb-4">📦</div>
                                                <div className="text-lg">
                                                    Список пуст. Добавьте первый товар!
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-16 text-center">
                                <div className="text-gray-400 mb-8">
                                    <div className="text-6xl mb-4">📝</div>
                                    <div className="text-xl text-white mb-2">
                                        Создайте свой первый список продуктов
                                    </div>
                                    <div className="text-gray-400">
                                        Начните планировать покупки с умом
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowNewListModal(true)}
                                    className="px-8 py-4 bg-white text-gray-900 rounded-xl hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl text-lg font-medium"
                                >
                                    Создать список
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Модальное окно создания списка */}
            {showNewListModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-gray-800 rounded-2xl p-8 w-full max-w-md mx-4 border border-gray-700/50">
                        <h3 className="text-xl font-semibold mb-6 text-white">
                            Создать новый список
                        </h3>
                        <input
                            type="text"
                            placeholder="Название списка"
                            value={newListName}
                            onChange={(e) => setNewListName(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && createNewList()}
                            className="w-full px-4 py-3 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-6 bg-gray-700/50 text-white placeholder-gray-400 transition-all"
                            autoFocus
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={createNewList}
                                className="flex-1 px-5 py-3 bg-white text-gray-900 rounded-xl hover:bg-gray-100 transition-all font-medium"
                            >
                                Создать
                            </button>
                            <button
                                onClick={() => {
                                    setShowNewListModal(false);
                                    setNewListName('');
                                }}
                                className="flex-1 px-5 py-3 bg-gray-700 text-gray-300 rounded-xl hover:bg-gray-600 transition-all"
                            >
                                Отмена
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
