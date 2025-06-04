'use client';

import { useState, useEffect } from 'react';

export default function Page() {
    const [lists, setLists] = useState([]);
    const [currentListId, setCurrentListId] = useState(null);
    const [showNewListModal, setShowNewListModal] = useState(false);
    const [newListName, setNewListName] = useState('');
    const [peopleCount, setPeopleCount] = useState(1);

    // Загрузка данных из localStorage
    useEffect(() => {
        const savedLists = localStorage.getItem('cookingLists');
        if (savedLists) {
            const parsedLists = JSON.parse(savedLists);
            setLists(parsedLists);
            if (parsedLists.length > 0) {
                setCurrentListId(parsedLists[0].id);
            }
        }
    }, []);

    // Сохранение в localStorage
    useEffect(() => {
        if (lists.length > 0) {
            localStorage.setItem('cookingLists', JSON.stringify(lists));
        }
    }, [lists]);

    const currentList = lists.find((list) => list.id === currentListId);

    const createNewList = () => {
        if (!newListName.trim()) return;

        const newList = {
            id: Date.now(),
            name: newListName,
            items: [],
            createdAt: new Date().toISOString(),
        };

        setLists([...lists, newList]);
        setCurrentListId(newList.id);
        setNewListName('');
        setShowNewListModal(false);
    };

    const deleteList = (listId) => {
        const updatedLists = lists.filter((list) => list.id !== listId);
        setLists(updatedLists);
        if (currentListId === listId) {
            setCurrentListId(updatedLists.length > 0 ? updatedLists[0].id : null);
        }
    };

    const addItem = () => {
        if (!currentList) return;

        const newItem = {
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

    const updateItem = (itemId, field, value) => {
        const updatedLists = lists.map((list) => {
            if (list.id !== currentListId) return list;

            return {
                ...list,
                items: list.items.map((item) => {
                    if (item.id !== itemId) return item;

                    const updatedItem = { ...item, [field]: value };

                    // Автоматический пересчет
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

    const deleteItem = (itemId) => {
        const updatedLists = lists.map((list) =>
            list.id === currentListId
                ? { ...list, items: list.items.filter((item) => item.id !== itemId) }
                : list,
        );
        setLists(updatedLists);
    };

    const getTotalCost = () => {
        if (!currentList) return 0;
        return currentList.items.reduce((sum, item) => sum + item.totalPrice, 0);
    };

    const getCostPerPerson = () => {
        return getTotalCost() / peopleCount;
    };

    const exportToMarkdown = (forImport = false) => {
        if (!currentList) return;

        if (forImport) {
            // JSON формат для импорта
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
            // Markdown для шаринга
            let markdown = `# 🛒 ${currentList.name}\n\n`;
            markdown += `**Общая стоимость:** ${getTotalCost().toFixed(2)} ₽\n`;
            markdown += `**На ${peopleCount} чел:** ${getCostPerPerson().toFixed(2)} ₽/чел\n\n`;
            markdown += `## Список продуктов:\n\n`;

            currentList.items.forEach((item, index) => {
                markdown += `${index + 1}. **${item.name}**\n`;
                markdown += `   • ${item.quantity} ${item.unit} × ${item.pricePerUnit.toFixed(2)} ₽ = ${item.totalPrice.toFixed(2)} ₽\n\n`;
            });

            markdown += `---\n*Создано ${new Date().toLocaleDateString('ru-RU')}*`;

            navigator.clipboard.writeText(markdown).then(() => {
                alert('Список скопирован в буфер обмена!');
            });
        }
    };

    const importFromFile = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importData = JSON.parse(e.target.result);
                const newList = {
                    id: Date.now(),
                    name: `${importData.name} (импорт)`,
                    items: importData.items,
                    createdAt: new Date().toISOString(),
                };

                setLists([...lists, newList]);
                setCurrentListId(newList.id);
                alert('Список успешно импортирован!');
            } catch (error) {
                alert('Ошибка при импорте файла');
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    };

    return (
        <div
            className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100"
            data-oid="ao85ld_"
        >
            {/* Header */}
            <header className="bg-white shadow-sm border-b" data-oid="o_telh3">
                <div className="max-w-6xl mx-auto px-4 py-4" data-oid="t2gy1mc">
                    <div className="flex items-center justify-between" data-oid="-hv9k4f">
                        <h1
                            className="text-2xl font-bold text-gray-800 flex items-center gap-2"
                            data-oid="7nq9vys"
                        >
                            🛒 Списки продуктов
                        </h1>
                        <div className="flex items-center gap-3" data-oid="bba0zr:">
                            <input
                                type="file"
                                accept=".json"
                                onChange={importFromFile}
                                className="hidden"
                                id="import-file"
                                data-oid="57-:lhd"
                            />

                            <label
                                htmlFor="import-file"
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer transition-colors text-sm"
                                data-oid="z1t.r5-"
                            >
                                📥 Импорт
                            </label>
                            <button
                                onClick={() => setShowNewListModal(true)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                data-oid="8knq:bz"
                            >
                                + Новый список
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-6xl mx-auto px-4 py-6" data-oid="cui6pwf">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6" data-oid=":bk5tf-">
                    {/* Sidebar с списками */}
                    <div className="lg:col-span-1" data-oid="l6yi387">
                        <div className="bg-white rounded-xl shadow-sm p-4" data-oid="occh4o_">
                            <h3 className="font-semibold text-gray-800 mb-3" data-oid="x7u477y">
                                Мои списки
                            </h3>
                            <div className="space-y-2" data-oid="32ooj5g">
                                {lists.map((list) => (
                                    <div
                                        key={list.id}
                                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                                            currentListId === list.id
                                                ? 'bg-blue-100 border-2 border-blue-300'
                                                : 'bg-gray-50 hover:bg-gray-100'
                                        }`}
                                        onClick={() => setCurrentListId(list.id)}
                                        data-oid="2-:.apo"
                                    >
                                        <div
                                            className="flex items-center justify-between"
                                            data-oid="0iefq69"
                                        >
                                            <span
                                                className="font-medium text-sm"
                                                data-oid="m_i2mjv"
                                            >
                                                {list.name}
                                            </span>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteList(list.id);
                                                }}
                                                className="text-red-500 hover:text-red-700 text-xs"
                                                data-oid="jxbktjr"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                        <div
                                            className="text-xs text-gray-500 mt-1"
                                            data-oid="wjrvtd2"
                                        >
                                            {list.items.length} товаров
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Основной контент */}
                    <div className="lg:col-span-3" data-oid="l_p76zd">
                        {currentList ? (
                            <div className="space-y-6" data-oid="tnihgt6">
                                {/* Заголовок списка и статистика */}
                                <div
                                    className="bg-white rounded-xl shadow-sm p-6"
                                    data-oid="6yi8qk8"
                                >
                                    <div
                                        className="flex items-center justify-between mb-4"
                                        data-oid="svrlkm9"
                                    >
                                        <h2
                                            className="text-xl font-bold text-gray-800"
                                            data-oid="lt8muev"
                                        >
                                            {currentList.name}
                                        </h2>
                                        <div className="flex items-center gap-3" data-oid="7z:lxpe">
                                            <button
                                                onClick={() => exportToMarkdown(false)}
                                                className="px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm"
                                                data-oid="_5:1qe1"
                                            >
                                                📋 Копировать
                                            </button>
                                            <button
                                                onClick={() => exportToMarkdown(true)}
                                                className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                                                data-oid="xdlw1ao"
                                            >
                                                📤 Экспорт
                                            </button>
                                        </div>
                                    </div>

                                    <div
                                        className="grid grid-cols-1 md:grid-cols-3 gap-4"
                                        data-oid="qt7jz70"
                                    >
                                        <div
                                            className="bg-blue-50 p-4 rounded-lg"
                                            data-oid="w53fokd"
                                        >
                                            <div
                                                className="text-sm text-blue-600 font-medium"
                                                data-oid="u:x.x0y"
                                            >
                                                Общая стоимость
                                            </div>
                                            <div
                                                className="text-2xl font-bold text-blue-800"
                                                data-oid="mtgnh.v"
                                            >
                                                {getTotalCost().toFixed(2)} ₽
                                            </div>
                                        </div>
                                        <div
                                            className="bg-green-50 p-4 rounded-lg"
                                            data-oid="j469fhw"
                                        >
                                            <div
                                                className="text-sm text-green-600 font-medium"
                                                data-oid="da2o59l"
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
                                                className="text-2xl font-bold text-green-800 bg-transparent border-none outline-none w-full"
                                                data-oid="q3qsbvb"
                                            />
                                        </div>
                                        <div
                                            className="bg-purple-50 p-4 rounded-lg"
                                            data-oid="imo:n3c"
                                        >
                                            <div
                                                className="text-sm text-purple-600 font-medium"
                                                data-oid="ma:piyh"
                                            >
                                                На человека
                                            </div>
                                            <div
                                                className="text-2xl font-bold text-purple-800"
                                                data-oid="l7fgm95"
                                            >
                                                {getCostPerPerson().toFixed(2)} ₽
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Список товаров */}
                                <div
                                    className="bg-white rounded-xl shadow-sm p-6"
                                    data-oid=":w-lf1j"
                                >
                                    <div
                                        className="flex items-center justify-between mb-4"
                                        data-oid="s3vhu8h"
                                    >
                                        <h3
                                            className="text-lg font-semibold text-gray-800"
                                            data-oid="0r844:0"
                                        >
                                            Товары
                                        </h3>
                                        <button
                                            onClick={addItem}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                            data-oid="9g7cp54"
                                        >
                                            + Добавить товар
                                        </button>
                                    </div>

                                    <div className="space-y-3" data-oid="c4gf9b5">
                                        {currentList.items.map((item) => (
                                            <div
                                                key={item.id}
                                                className="border border-gray-200 rounded-lg p-4"
                                                data-oid="9jgv0d5"
                                            >
                                                <div
                                                    className="grid grid-cols-1 md:grid-cols-6 gap-3 items-center"
                                                    data-oid="8txpx3n"
                                                >
                                                    <div
                                                        className="md:col-span-2"
                                                        data-oid="vvm3c.k"
                                                    >
                                                        <input
                                                            type="text"
                                                            placeholder="Название товара"
                                                            value={item.name}
                                                            onChange={(e) =>
                                                                updateItem(
                                                                    item.id,
                                                                    'name',
                                                                    e.target.value,
                                                                )
                                                            }
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                            data-oid="r0in19x"
                                                        />
                                                    </div>
                                                    <div data-oid="4ga8lnk">
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            placeholder="Цена за ед."
                                                            value={item.pricePerUnit}
                                                            onChange={(e) =>
                                                                updateItem(
                                                                    item.id,
                                                                    'pricePerUnit',
                                                                    parseFloat(e.target.value) || 0,
                                                                )
                                                            }
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                            data-oid="qnustvd"
                                                        />
                                                    </div>
                                                    <div className="flex gap-2" data-oid="gj:_17a">
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            placeholder="Кол-во"
                                                            value={item.quantity}
                                                            onChange={(e) =>
                                                                updateItem(
                                                                    item.id,
                                                                    'quantity',
                                                                    parseFloat(e.target.value) || 0,
                                                                )
                                                            }
                                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                            data-oid=":ow.-9t"
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
                                                            className="px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                            data-oid="mclz28t"
                                                        >
                                                            <option value="шт" data-oid="-1vgoxw">
                                                                шт
                                                            </option>
                                                            <option value="кг" data-oid="vgo634c">
                                                                кг
                                                            </option>
                                                            <option value="л" data-oid="mcwjc5r">
                                                                л
                                                            </option>
                                                            <option value="упак" data-oid="_yjsx84">
                                                                упак
                                                            </option>
                                                        </select>
                                                    </div>
                                                    <div data-oid="tcjbbzl">
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            placeholder="Общая стоимость"
                                                            value={item.totalPrice}
                                                            onChange={(e) =>
                                                                updateItem(
                                                                    item.id,
                                                                    'totalPrice',
                                                                    parseFloat(e.target.value) || 0,
                                                                )
                                                            }
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                            data-oid="iz9qeq9"
                                                        />
                                                    </div>
                                                    <div data-oid="12u8bi5">
                                                        <button
                                                            onClick={() => deleteItem(item.id)}
                                                            className="w-full px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                                                            data-oid="mhq8hmp"
                                                        >
                                                            🗑️
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        {currentList.items.length === 0 && (
                                            <div
                                                className="text-center py-8 text-gray-500"
                                                data-oid="4gktaz-"
                                            >
                                                Список пуст. Добавьте первый товар!
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div
                                className="bg-white rounded-xl shadow-sm p-12 text-center"
                                data-oid="izmwqbc"
                            >
                                <div className="text-gray-500 mb-4" data-oid=":1y-y56">
                                    <div className="text-4xl mb-2" data-oid="czpbbur">
                                        📝
                                    </div>
                                    <div className="text-lg" data-oid=".e626yo">
                                        Создайте свой первый список продуктов
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowNewListModal(true)}
                                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    data-oid="4lya6jk"
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
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                    data-oid="yavx3aq"
                >
                    <div
                        className="bg-white rounded-xl p-6 w-full max-w-md mx-4"
                        data-oid="u24qaxk"
                    >
                        <h3 className="text-lg font-semibold mb-4" data-oid="gayllxa">
                            Создать новый список
                        </h3>
                        <input
                            type="text"
                            placeholder="Название списка"
                            value={newListName}
                            onChange={(e) => setNewListName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
                            onKeyPress={(e) => e.key === 'Enter' && createNewList()}
                            data-oid=":6ahz:c"
                        />

                        <div className="flex gap-3" data-oid="1jws8uh">
                            <button
                                onClick={createNewList}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                data-oid="nob.r__"
                            >
                                Создать
                            </button>
                            <button
                                onClick={() => {
                                    setShowNewListModal(false);
                                    setNewListName('');
                                }}
                                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                                data-oid="5x1aqxj"
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
