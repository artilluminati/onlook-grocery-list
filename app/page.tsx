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
        <div className="min-h-screen bg-gray-900" data-oid="-ljnnuj">
            {/* Header */}
            <header
                className="bg-gray-900/80 backdrop-blur-xl border-b border-gray-700/50"
                data-oid="5sqlmxl"
            >
                <div
                    className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between"
                    data-oid="p0udlvj"
                >
                    <h1
                        className="text-3xl font-bold text-white flex items-center gap-3"
                        data-oid="yzonzlk"
                    >
                        <span className="text-2xl" data-oid="n9srsof">
                            🛒
                        </span>{' '}
                        Списки продуктов
                    </h1>
                    <div className="flex items-center gap-3" data-oid="eb2x_.5">
                        <input
                            type="file"
                            accept=".json"
                            onChange={importFromFile}
                            className="hidden"
                            id="import-file"
                            data-oid="wvk5ias"
                        />

                        <label
                            htmlFor="import-file"
                            className="px-4 py-2.5 bg-gray-800 text-gray-300 rounded-xl hover:bg-gray-700 cursor-pointer transition-all text-sm border border-gray-700 hover:border-gray-600"
                            data-oid="q:vgl4-"
                        >
                            📥 Импорт
                        </label>
                        <button
                            onClick={() => setShowNewListModal(true)}
                            className="px-5 py-2.5 bg-white text-gray-900 rounded-xl hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl font-medium"
                            data-oid="xmrb:qc"
                        >
                            + Новый список
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-6 py-8" data-oid="e1af8i.">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8" data-oid="e4dleab">
                    {/* Sidebar с списками */}
                    <div className="lg:col-span-1" data-oid="3hzb4r_">
                        <div
                            className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-6"
                            data-oid="l-bl5.2"
                        >
                            <h3
                                className="font-semibold text-white mb-4 text-lg"
                                data-oid="udxr_cf"
                            >
                                Мои списки
                            </h3>
                            <div className="space-y-3" data-oid="415:6zp">
                                {lists.map((list) => (
                                    <div
                                        key={list.id}
                                        className={`p-4 rounded-xl cursor-pointer transition-all ${
                                            currentListId === list.id
                                                ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/50 shadow-lg'
                                                : 'bg-gray-700/30 hover:bg-gray-700/50 border border-gray-600/30'
                                        }`}
                                        onClick={() => setCurrentListId(list.id)}
                                        data-oid="nt:n35o"
                                    >
                                        <div
                                            className="flex items-center justify-between"
                                            data-oid="va::m4n"
                                        >
                                            <span
                                                className="font-medium text-white"
                                                data-oid="nbojz5:"
                                            >
                                                {list.name}
                                            </span>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteList(list.id);
                                                }}
                                                className="text-red-400 hover:text-red-300 transition-colors"
                                                data-oid="h5fkzb2"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                        <div
                                            className="text-sm text-gray-400 mt-2"
                                            data-oid="fsn4z3g"
                                        >
                                            {list.items.length} товаров
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Основной контент */}
                    <div className="lg:col-span-3" data-oid="burjbmt">
                        {currentList ? (
                            <div className="space-y-8" data-oid="wt::hs5">
                                {/* Заголовок списка и статистика */}
                                <div
                                    className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-8"
                                    data-oid="bsc807s"
                                >
                                    <div
                                        className="flex items-center justify-between mb-4"
                                        data-oid="85wakr1"
                                    >
                                        {editingListId === currentList.id ? (
                                            <div
                                                className="flex items-center gap-3"
                                                data-oid="jjam7pf"
                                            >
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
                                                    data-oid="kcn:t76"
                                                />

                                                <button
                                                    onClick={saveListName}
                                                    className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
                                                    data-oid="-d6eomg"
                                                >
                                                    ✓
                                                </button>
                                                <button
                                                    onClick={cancelEditingList}
                                                    className="px-3 py-1.5 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700 transition-colors"
                                                    data-oid="d.nbvaa"
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
                                                data-oid="wpu3r0p"
                                            >
                                                {currentList.name} ✏️
                                            </h2>
                                        )}
                                        <div className="flex items-center gap-3" data-oid="qt:ju-w">
                                            <button
                                                onClick={() => exportToMarkdown(false)}
                                                className="px-4 py-2.5 bg-green-600/20 text-green-400 rounded-xl hover:bg-green-600/30 transition-all text-sm border border-green-600/30"
                                                data-oid="8u.fbd3"
                                            >
                                                📋 Копировать
                                            </button>
                                            <button
                                                onClick={() => exportToMarkdown(true)}
                                                className="px-4 py-2.5 bg-blue-600/20 text-blue-400 rounded-xl hover:bg-blue-600/30 transition-all text-sm border border-blue-600/30"
                                                data-oid="k.g-:rq"
                                            >
                                                📤 Экспорт
                                            </button>
                                        </div>
                                    </div>

                                    <div
                                        className="grid grid-cols-1 md:grid-cols-3 gap-6"
                                        data-oid="8-l:k-v"
                                    >
                                        <div
                                            className="bg-blue-600/20 p-6 rounded-2xl border border-blue-600/30"
                                            data-oid="ahm4iq3"
                                        >
                                            <div
                                                className="text-sm text-blue-400 font-medium mb-2"
                                                data-oid="hs:tw2z"
                                            >
                                                Общая стоимость
                                            </div>
                                            <div
                                                className="text-3xl font-bold text-white"
                                                data-oid="zu1vqje"
                                            >
                                                {getTotalCost().toFixed(2)} ₽
                                            </div>
                                        </div>

                                        <div
                                            className="bg-green-600/20 p-6 rounded-2xl border border-green-600/30"
                                            data-oid="dg7j3td"
                                        >
                                            <div
                                                className="text-sm text-green-400 font-medium mb-2"
                                                data-oid="xslohq5"
                                            >
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
                                                data-oid="wq-:85m"
                                            />
                                        </div>

                                        <div
                                            className="bg-orange-600/20 p-6 rounded-2xl border border-orange-600/30"
                                            data-oid="nkrtkty"
                                        >
                                            <div
                                                className="text-sm text-orange-400 font-medium mb-2"
                                                data-oid="rv0.gpo"
                                            >
                                                На человека
                                            </div>
                                            <div
                                                className="text-3xl font-bold text-white"
                                                data-oid="100dqsv"
                                            >
                                                {getCostPerPerson().toFixed(2)} ₽
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Краткий предпросмотр списка */}
                                {currentList.items.length > 0 && (
                                    <div
                                        className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-8"
                                        data-oid="mpe7a5f"
                                    >
                                        <div
                                            className="flex items-center justify-between mb-6"
                                            data-oid="34:.8dm"
                                        >
                                            <h3
                                                className="text-xl font-semibold text-white"
                                                data-oid="k:o-52u"
                                            >
                                                📋 Краткий список
                                            </h3>
                                            <div
                                                className="text-sm text-gray-400"
                                                data-oid="t-03d1d"
                                            >
                                                {currentList.items.length} товаров
                                            </div>
                                        </div>

                                        <div
                                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                                            data-oid=":mrx_za"
                                        >
                                            {currentList.items.map((item, index) => (
                                                <div
                                                    key={item.id}
                                                    className="flex items-center justify-between p-4 bg-gray-700/30 rounded-xl hover:bg-gray-700/50 transition-all cursor-pointer group border border-gray-600/30"
                                                    onClick={() => scrollToItem(item.id)}
                                                    data-oid="t3bqr2p"
                                                >
                                                    <div
                                                        className="flex-1 min-w-0"
                                                        data-oid="z43di8c"
                                                    >
                                                        <div
                                                            className="flex items-center gap-2"
                                                            data-oid="aa7qokb"
                                                        >
                                                            <span
                                                                className="text-xs text-gray-500 font-medium"
                                                                data-oid="3zjzbma"
                                                            >
                                                                {index + 1}.
                                                            </span>
                                                            <span
                                                                className="font-medium text-white truncate"
                                                                data-oid="2l0gdi."
                                                            >
                                                                {item.name || 'Без названия'}
                                                            </span>
                                                        </div>
                                                        <div
                                                            className="text-sm text-gray-400 mt-1"
                                                            data-oid="g8o268j"
                                                        >
                                                            {item.quantity > 0 &&
                                                            item.pricePerUnit > 0 ? (
                                                                <span data-oid="eo46qj9">
                                                                    {item.quantity} {item.unit} ×{' '}
                                                                    {item.pricePerUnit.toFixed(2)} ₽
                                                                </span>
                                                            ) : (
                                                                <span
                                                                    className="text-gray-500 italic"
                                                                    data-oid="5ofwxoy"
                                                                >
                                                                    Не заполнено
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div
                                                        className="flex items-center gap-2"
                                                        data-oid="66fzb54"
                                                    >
                                                        <div
                                                            className="text-right"
                                                            data-oid="mvz7jq_"
                                                        >
                                                            <div
                                                                className="font-semibold text-white"
                                                                data-oid="lhvsnuv"
                                                            >
                                                                {item.totalPrice.toFixed(2)} ₽
                                                            </div>
                                                        </div>
                                                        <div
                                                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                                                            data-oid="5znexr3"
                                                        >
                                                            <svg
                                                                className="w-4 h-4 text-blue-400"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                viewBox="0 0 24 24"
                                                                data-oid=".-8yzc3"
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={2}
                                                                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                                                    data-oid="o_g8lvd"
                                                                />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div
                                            className="mt-6 pt-6 border-t border-gray-700/50"
                                            data-oid="bujzpyn"
                                        >
                                            <div
                                                className="flex justify-between items-center text-sm"
                                                data-oid="ul0hvyw"
                                            >
                                                <span className="text-gray-400" data-oid=":2sez5_">
                                                    Нажмите на товар для редактирования
                                                </span>
                                                <div
                                                    className="flex items-center gap-4"
                                                    data-oid="zf-dh:8"
                                                >
                                                    <span
                                                        className="text-gray-400"
                                                        data-oid="_n80tj4"
                                                    >
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
                                                    <span
                                                        className="font-semibold text-white"
                                                        data-oid="4285kk1"
                                                    >
                                                        Итого: {getTotalCost().toFixed(2)} ₽
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Список товаров */}
                                <div
                                    className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-8"
                                    data-oid="ycbr0pv"
                                >
                                    <div
                                        className="flex items-center justify-between mb-6"
                                        data-oid="78262sp"
                                    >
                                        <h3
                                            className="text-xl font-semibold text-white"
                                            data-oid="wca01_n"
                                        >
                                            Товары
                                        </h3>
                                        <button
                                            onClick={addItem}
                                            className="px-5 py-3 bg-white text-gray-900 rounded-xl hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl font-medium"
                                            data-oid="1gy-t6m"
                                        >
                                            + Добавить товар
                                        </button>
                                    </div>

                                    <div className="space-y-4" data-oid="g0x0r6v">
                                        {currentList.items.map((item) => (
                                            <div
                                                key={item.id}
                                                id={`item-${item.id}`}
                                                className="border border-gray-600/30 rounded-2xl p-6 hover:shadow-xl transition-all bg-gray-700/30 scroll-mt-4 hover:border-gray-500/50"
                                                data-oid="x3sn7b7"
                                            >
                                                <div
                                                    className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end"
                                                    data-oid="de:68ft"
                                                >
                                                    {/* Название товара */}
                                                    <div
                                                        className="lg:col-span-4"
                                                        data-oid="bme0vbt"
                                                    >
                                                        <label
                                                            className="block text-sm font-medium text-gray-300 mb-2"
                                                            data-oid="sbrfg6a"
                                                        >
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
                                                            data-oid="xsaejcy"
                                                        />
                                                    </div>

                                                    {/* Цена за единицу */}
                                                    <div
                                                        className="lg:col-span-2"
                                                        data-oid="usswhc5"
                                                    >
                                                        <label
                                                            className="block text-sm font-medium text-gray-300 mb-2"
                                                            data-oid="x43b9mu"
                                                        >
                                                            Цена за ед.
                                                        </label>
                                                        <div
                                                            className="relative"
                                                            data-oid="fv-08gu"
                                                        >
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
                                                                data-oid="l1srt9u"
                                                            />

                                                            <span
                                                                className="absolute right-3 top-3 text-gray-400 text-sm"
                                                                data-oid="py-j0rb"
                                                            >
                                                                ₽
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Количество и единица измерения */}
                                                    <div
                                                        className="lg:col-span-3"
                                                        data-oid="8he.12p"
                                                    >
                                                        <label
                                                            className="block text-sm font-medium text-gray-300 mb-2"
                                                            data-oid="cqo04hf"
                                                        >
                                                            Количество
                                                        </label>
                                                        <div
                                                            className="flex gap-2"
                                                            data-oid="l7u0_ck"
                                                        >
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
                                                                data-oid="v2yq0cu"
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
                                                                data-oid="v:tew2a"
                                                            >
                                                                <option
                                                                    value="шт"
                                                                    data-oid="0noa:9b"
                                                                >
                                                                    шт
                                                                </option>
                                                                <option
                                                                    value="кг"
                                                                    data-oid="0unwowl"
                                                                >
                                                                    кг
                                                                </option>
                                                                <option
                                                                    value="л"
                                                                    data-oid=".ftm477"
                                                                >
                                                                    л
                                                                </option>
                                                                <option
                                                                    value="упак"
                                                                    data-oid="wq3ikbd"
                                                                >
                                                                    упак
                                                                </option>
                                                            </select>
                                                        </div>
                                                    </div>

                                                    {/* Общая стоимость */}
                                                    <div
                                                        className="lg:col-span-2"
                                                        data-oid="-evcobq"
                                                    >
                                                        <label
                                                            className="block text-sm font-medium text-gray-300 mb-2"
                                                            data-oid="4njr9aq"
                                                        >
                                                            Общая стоимость
                                                        </label>
                                                        <div
                                                            className="relative"
                                                            data-oid="8ykx_dm"
                                                        >
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
                                                                data-oid="29tf2l9"
                                                            />

                                                            <span
                                                                className="absolute right-3 top-3 text-gray-400 text-sm"
                                                                data-oid="mhckyud"
                                                            >
                                                                ₽
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Кнопка удаления */}
                                                    <div
                                                        className="lg:col-span-1"
                                                        data-oid="3xzhsq4"
                                                    >
                                                        <button
                                                            onClick={() => deleteItem(item.id)}
                                                            className="w-full px-3 py-3 bg-red-600/20 text-red-400 rounded-xl hover:bg-red-600/30 transition-all flex items-center justify-center border border-red-600/30"
                                                            title="Удалить товар"
                                                            data-oid="lm_jt.q"
                                                        >
                                                            🗑️
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Мобильная версия - показываем расчет */}
                                                <div
                                                    className="lg:hidden mt-4 pt-4 border-t border-gray-600/50"
                                                    data-oid="rzyfxre"
                                                >
                                                    <div
                                                        className="text-sm text-gray-400"
                                                        data-oid="ur5n.mh"
                                                    >
                                                        {item.quantity > 0 &&
                                                            item.pricePerUnit > 0 && (
                                                                <span data-oid="9xpdn-2">
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
                                            <div
                                                className="text-center py-12 text-gray-400"
                                                data-oid="2mbpiu8"
                                            >
                                                <div className="text-4xl mb-4" data-oid="36s5nug">
                                                    📦
                                                </div>
                                                <div className="text-lg" data-oid="d:7xao0">
                                                    Список пуст. Добавьте первый товар!
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div
                                className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-16 text-center"
                                data-oid="saaftbi"
                            >
                                <div className="text-gray-400 mb-8" data-oid=":tap2zz">
                                    <div className="text-6xl mb-4" data-oid="wi0t_ef">
                                        📝
                                    </div>
                                    <div className="text-xl text-white mb-2" data-oid="728.cz.">
                                        Создайте свой первый список продуктов
                                    </div>
                                    <div className="text-gray-400" data-oid="q-4dt42">
                                        Начните планировать покупки с умом
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowNewListModal(true)}
                                    className="px-8 py-4 bg-white text-gray-900 rounded-xl hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl text-lg font-medium"
                                    data-oid="yk7oplt"
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
                <div
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
                    data-oid=".y2we93"
                >
                    <div
                        className="bg-gray-800 rounded-2xl p-8 w-full max-w-md mx-4 border border-gray-700/50"
                        data-oid=":..q6cw"
                    >
                        <h3 className="text-xl font-semibold mb-6 text-white" data-oid="wu2_af9">
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
                            data-oid="596fkig"
                        />

                        <div className="flex gap-3" data-oid="8wbt0:9">
                            <button
                                onClick={createNewList}
                                className="flex-1 px-5 py-3 bg-white text-gray-900 rounded-xl hover:bg-gray-100 transition-all font-medium"
                                data-oid="uij7tjx"
                            >
                                Создать
                            </button>
                            <button
                                onClick={() => {
                                    setShowNewListModal(false);
                                    setNewListName('');
                                }}
                                className="flex-1 px-5 py-3 bg-gray-700 text-gray-300 rounded-xl hover:bg-gray-600 transition-all"
                                data-oid="9xw:lpq"
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
