

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    Polyline,
    useMapEvents,
    Rectangle,
    Circle,
    useMap
} from 'react-leaflet';
import { useSocket } from '../context/SocketContext.jsx';
import L from 'leaflet';
// 2. ІМПОРТУЄМО ПЛАГІН
import 'leaflet-polylinedecorator';
import { MousePointer2, Truck, Pencil, Check, X } from 'lucide-react'; // Додали Pencil, Check, X
import { renderToStaticMarkup } from 'react-dom/server';
import { useDrop } from 'react-dnd';
import { ItemTypes } from '../constants.js';
import { useTool } from '../context/ToolContext.jsx';
import { ImageOverlay } from 'react-leaflet';
import ms from 'milsymbol';
import { generateSidc, SID_OPTIONS } from '../utils/sidcGenerator';
import ContextMenu from './ContextMenu'; // Import ContextMenu
import { Copy, Trash2, Edit, Map as MapIcon, RotateCw, Crosshair } from 'lucide-react'; // Icons


// --- Іконки (код не змінився) ---
const cursorIconMarkup = renderToStaticMarkup(
    <MousePointer2
        size={24}
        className="text-blue-500 opacity-75"
        stroke="white"
        strokeWidth={2}
    />
);
const cursorIcon = L.divIcon({
    html: cursorIconMarkup,
    className: 'leaflet-cursor-icon',
    iconAnchor: [0, 0],
});
const objectIconMarkup = renderToStaticMarkup(
    <Truck size={32} className="text-red-600" stroke="black" strokeWidth={1} />
);
const objectIcon = L.divIcon({
    html: objectIconMarkup,
    className: 'leaflet-cursor-icon',
    iconAnchor: [16, 16],
});
// ---------------------------------

// --- TacticalMarker 
function TacticalMarker({ obj, onMove, onDelete, onUpdate, activeTool, TOOLS, isSelected, onToggleSelect, onContextMenu }) {
    const [isEditing, setIsEditing] = useState(false);

    // Локальний стан для редагування
    const [tempName, setTempName] = useState(obj.name);
    // Нові поля для APP-6
    const [tempIdentity, setTempIdentity] = useState(obj.identity || 'friend');
    const [tempType, setTempType] = useState(obj.type || 'infantry');
    const [tempEchelon, setTempEchelon] = useState(obj.echelon || 'platoon');
    const [tempStatus, setTempStatus] = useState(obj.status || 'present'); // NEW
    const [tempModifier, setTempModifier] = useState(obj.modifier || 'none'); // NEW
    const [tempDirection, setTempDirection] = useState(obj.direction || 0);

    const eventHandlers = useMemo(
        () => ({
            click(e) {
                if (activeTool === TOOLS.CURSOR) {
                    L.DomEvent.stopPropagation(e); // Stop propagation to map

                    // Toggle selection logic
                    if (e.originalEvent.ctrlKey || e.originalEvent.shiftKey) {
                        onToggleSelect(obj.id, true);
                    } else {
                        // Якщо це просто клік без Ctrl - виділяємо ТІЛЬКИ цей об'єкт (deselect others)
                        // Але тільки якщо ми не в режимі редагування
                        if (!isEditing) onToggleSelect(obj.id, false);
                    }
                }
            },
            dragend(e) {
                onMove(obj.id, e.target.getLatLng());
            },
            contextmenu(e) {
                // Right click on marker
                L.DomEvent.stopPropagation(e);
                onContextMenu(e, obj);
            }
        }),
        [obj.id, onMove, activeTool, TOOLS, onToggleSelect, isEditing, onContextMenu, obj] // Updated deps
    );

    // Збереження
    const handleSave = () => {
        onUpdate(obj.id, {
            name: tempName,
            identity: tempIdentity,
            type: tempType,
            echelon: tempEchelon,
            status: tempStatus, // NEW
            modifier: tempModifier, // NEW
            direction: Number(tempDirection)
        });
        setIsEditing(false);
    };

    // Генеруємо іконку за допомогою milsymbol
    const milIcon = useMemo(() => {
        // 1. Генеруємо код SIDC
        const sidc = generateSidc(
            obj.identity || 'friend',
            obj.type || 'infantry',
            obj.echelon || 'platoon',
            obj.status || 'present', // NEW
            obj.modifier || 'none'   // NEW
        );

        // 2. Створюємо об'єкт символу
        const symbol = new ms.Symbol(sidc, {
            size: 30,
            uniqueDesignation: obj.name,
            simpleStatusModifier: true,
            direction: obj.direction || 0,
        });

        // 3. Перетворюємо в URL для Leaflet
        return L.divIcon({
            html: symbol.asSVG(),
            className: `leaflet-milsymbol-icon ${isSelected ? 'selected-symbol' : ''}`, // Add selection class
            iconAnchor: [symbol.getAnchor().x, symbol.getAnchor().y],
            popupAnchor: [0, -symbol.getSize().height],
        });
    }, [obj.identity, obj.type, obj.echelon, obj.name, obj.direction, obj.status, obj.modifier, isSelected]); // Added isSelected dep

    return (
        <Marker
            position={obj.latLng}
            icon={milIcon}
            draggable={activeTool === TOOLS.CURSOR}
            eventHandlers={eventHandlers}
        >
            <Popup minWidth={250}>
                <div className="flex flex-col gap-2 p-1">
                    {isEditing ? (
                        // --- РЕЖИМ РЕДАГУВАННЯ (APP-6D) ---
                        <div className="flex flex-col gap-2">
                            {/* Назва */}
                            <input
                                type="text"
                                value={tempName}
                                onChange={(e) => setTempName(e.target.value)}
                                className="w-full rounded border border-gray-600 bg-gray-800 p-1 text-white"
                                placeholder="Назва (напр. 1-й взвод)"
                            />

                            {/* Належність */}
                            <select
                                value={tempIdentity}
                                onChange={(e) => setTempIdentity(e.target.value)}
                                className="rounded border border-gray-600 bg-gray-800 p-1 text-white"
                            >
                                <option value="friend">Свої (Friend)</option>
                                <option value="hostile">Противник (Hostile)</option>
                                <option value="neutral">Нейтральні (Neutral)</option>
                                <option value="unknown">Невідомі (Unknown)</option>
                            </select>

                            {/* Статус (New) */}
                            <select
                                value={tempStatus}
                                onChange={(e) => setTempStatus(e.target.value)}
                                className="rounded border border-gray-600 bg-gray-800 p-1 text-white"
                            >
                                <option value="present">В наявності (Solid)</option>
                                <option value="planned">Запланований (Dashed)</option>
                            </select>

                            {/* Тип */}
                            <select
                                value={tempType}
                                onChange={(e) => setTempType(e.target.value)}
                                className="rounded border border-gray-600 bg-gray-800 p-1 text-white"
                            >
                                <option value="infantry">Піхота</option>
                                <option value="tank">Танки</option>
                                <option value="apc">БТР/БМП</option>
                                <option value="artillery">Артилерія</option>
                                <option value="medical">Медики</option>
                                <option value="supply">Постачання</option>
                            </select>

                            {/* Ешелон */}
                            <select
                                value={tempEchelon}
                                onChange={(e) => setTempEchelon(e.target.value)}
                                className="rounded border border-gray-600 bg-gray-800 p-1 text-white"
                            >
                                <option value="team">Група/Екіпаж</option>
                                <option value="squad">Відділення</option>
                                <option value="platoon">Взвод</option>
                                <option value="company">Рота</option>
                                <option value="battalion">Батальйон</option>
                            </select>

                            {/* Модифікатор (New) */}
                            <select
                                value={tempModifier}
                                onChange={(e) => setTempModifier(e.target.value)}
                                className="rounded border border-gray-600 bg-gray-800 p-1 text-white"
                            >
                                <option value="none">Немає</option>
                                <option value="hq">Штаб (Flag)</option>
                                <option value="task_force">Зведена гр.</option>
                            </select>

                            {/* Direction */}
                            <div>
                                <label className="text-xs text-gray-400">Напрямок: {Math.round(tempDirection)}°</label>
                                <input
                                    type="range"
                                    min="0" max="360" step="15"
                                    value={tempDirection}
                                    onChange={(e) => setTempDirection(Number(e.target.value))}
                                    className="w-full"
                                />
                            </div>

                            <div className="flex gap-2 mt-2">
                                <button onClick={handleSave} className="flex-1 rounded bg-green-600 py-1 text-white hover:bg-green-700">OK</button>
                                <button onClick={() => setIsEditing(false)} className="flex-1 rounded bg-gray-600 py-1 text-white hover:bg-gray-700">Cancel</button>
                            </div>
                        </div>
                    ) : (
                        // --- РЕЖИМ ПЕРЕГЛЯДУ ---
                        <div className="text-center">
                            <div className="font-bold text-lg">{obj.name}</div>
                            <div className="text-xs text-gray-500 uppercase">
                                {obj.identity} | {obj.type} | {obj.echelon}
                            </div>

                            {/* HP Bar (Combat System) */}
                            {obj.hp !== undefined && obj.maxHp !== undefined && (
                                <div className="mt-2">
                                    <div className="text-xs text-gray-400">HP: {obj.hp}/{obj.maxHp}</div>
                                    <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden mt-1">
                                        <div
                                            className={`h-full transition-all duration-300 ${obj.hp / obj.maxHp > 0.5 ? 'bg-green-500' :
                                                    obj.hp / obj.maxHp > 0.25 ? 'bg-yellow-500' : 'bg-red-500'
                                                }`}
                                            style={{ width: `${Math.max(0, (obj.hp / obj.maxHp) * 100)}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-2 mt-2 justify-center">
                                <button
                                    onClick={() => {
                                        setTempName(obj.name);
                                        setTempIdentity(obj.identity || 'friend');
                                        setTempType(obj.type || 'infantry');
                                        setTempEchelon(obj.echelon || 'platoon');
                                        setTempStatus(obj.status || 'present'); // NEW
                                        setTempModifier(obj.modifier || 'none'); // NEW
                                        setTempDirection(obj.direction || 0);
                                        setIsEditing(true);
                                    }}
                                    className="rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700"
                                >
                                    Ред.
                                </button>
                                <button
                                    onClick={() => onDelete(obj.id)}
                                    className="rounded bg-red-600 px-3 py-1 text-xs text-white hover:bg-red-700"
                                >
                                    Вид.
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </Popup>
        </Marker>
    );
}
// -------------------------------------------------

// --- 2. ОНОВЛЮЄМО TacticalPolyline ---
// Тепер він приймає колір та товщину з об'єкта 'drawing'
function TacticalPolyline({ drawing, onDelete }) {
    const eventHandlers = useMemo(
        () => ({
            click(e) {
                L.DomEvent.stopPropagation(e);
            },
        }),
        []
    );
    return (
        <Polyline
            positions={drawing.points}
            // 3. Використовуємо нові пропси!
            color={drawing.color || 'red'} // За замовчуванням 'red', якщо дані старі
            weight={drawing.weight || 3} // За замовчуванням 3, якщо дані старі
            eventHandlers={eventHandlers}
        >
            <Popup>
                <div className="flex flex-col gap-2">
                    {/* 4. Динамічна назва */}
                    <span className="font-bold">
                        {drawing.type === 'arrow' ? 'Стрілка' : 'Лінія'}
                    </span>
                    <button
                        onClick={() => onDelete(drawing.id)}
                        className="rounded bg-red-500 px-2 py-1 text-white hover:bg-red-700"
                    >
                        Видалити
                    </button>
                </div>
            </Popup>
        </Polyline>
    );
}
// ---------------------------------------------

// --- TacticalRectangle (НОВИЙ КОМПОНЕНТ) ---
function TacticalRectangle({ drawing, onDelete }) {
    const eventHandlers = useMemo(
        () => ({
            click(e) {
                L.DomEvent.stopPropagation(e);
            },
        }),
        []
    );
    return (
        <Rectangle
            bounds={drawing.bounds} // [ [lat, lng], [lat, lng] ]
            pathOptions={{
                color: drawing.color || 'red',
                weight: drawing.weight || 3,
            }}
            eventHandlers={eventHandlers}
        >
            <Popup>
                <div className="flex flex-col gap-2">
                    <span className="font-bold">Зона (Прямокутник)</span>
                    <button
                        onClick={() => onDelete(drawing.id)}
                        className="rounded bg-red-500 px-2 py-1 text-white hover:bg-red-700"
                    >
                        Видалити
                    </button>
                </div>
            </Popup>
        </Rectangle>
    );
}
// ---------------------------------------------

// --- TacticalCircle (НОВИЙ КОМПОНЕНТ) ---
function TacticalCircle({ drawing, onDelete }) {
    const eventHandlers = useMemo(
        () => ({
            click(e) {
                L.DomEvent.stopPropagation(e);
            },
        }),
        []
    );
    return (
        <Circle
            center={drawing.center} // [lat, lng]
            radius={drawing.radius} // метри
            pathOptions={{
                color: drawing.color || 'red',
                weight: drawing.weight || 3,
            }}
            eventHandlers={eventHandlers}
        >
            <Popup>
                <div className="flex flex-col gap-2">
                    <span className="font-bold">Зона (Коло)</span>
                    <button
                        onClick={() => onDelete(drawing.id)}
                        className="rounded bg-red-500 px-2 py-1 text-white hover:bg-red-700"
                    >
                        Видалити
                    </button>
                </div>
            </Popup>
        </Circle>
    );
}
// ---------------------------------------------

// --- 3. ОНОВЛЕНИЙ MapEventsHandler ---
// Тепер він обробляє mousedown, mousemove, mouseup ТА click
function MapEventsHandler({ onMapClick, onMouseDown, onMouseMove, onMouseUp, onContextMenu }) {
    useMapEvents({
        click(e) {
            onMapClick(e.latlng, e.originalEvent);
        },
        contextmenu(e) {
            onContextMenu(e);
        },
        mousedown(e) {
            onMouseDown(e.latlng);
        },
        mousemove(e) {
            onMouseMove(e.latlng);
        },
        mouseup(e) {
            onMouseUp(e.latlng);
        },
    });
    return null;
}
// ---------------------------------------------

// --- 3. НОВИЙ КОМПОНЕНТ TacticalArrow ---
function TacticalArrow({ drawing, onDelete }) {
    const map = useMap(); // Отримуємо екземпляр мапи

    // Ми використовуємо useEffect, тому що плагін-декоратор
    // працює імперативно (напряму з 'map'), а не декларативно (як React)
    useEffect(() => {
        // 1. Створюємо саму лінію
        const polyline = L.polyline(drawing.points, {
            color: drawing.color || 'red',
            weight: drawing.weight || 3,
        });

        // 2. Створюємо декоратор (наконечник стрілки)
        const decorator = L.polylineDecorator(polyline, {
            patterns: [
                {
                    offset: '100%', // На самому кінці лінії
                    repeat: 0,      // Тільки один раз
                    symbol: L.Symbol.arrowHead({ // Використовуємо символ "наконечник"
                        pixelSize: 10 + (drawing.weight || 3) * 2, // Розмір залежить від товщини
                        polygon: true,
                        pathOptions: {
                            fillOpacity: 1,
                            fill: true,
                            color: drawing.color || 'red', // Колір наконечника = колір лінії
                        },
                    }),
                },
            ],
        }).addTo(map); // Додаємо декоратор на мапу

        // 3. Додаємо Popup (ми не можемо використати <Popup> всередині useEffect)
        polyline.bindPopup(() => {
            const container = L.DomUtil.create('div', 'flex flex-col gap-2');
            container.innerHTML = `<span class="font-bold">Стрілка</span>`;
            const button = L.DomUtil.create(
                'button',
                'rounded bg-red-500 px-2 py-1 text-white hover:bg-red-700',
                container
            );
            button.innerText = 'Видалити';
            L.DomEvent.on(button, 'click', (e) => {
                L.DomEvent.stopPropagation(e); // Зупиняємо клік, щоб не закрилась мапа
                onDelete(drawing.id);
            });
            return container;
        });

        // 4. Обробник кліку (щоб мапа не реагувала)
        const lineClickHandler = (e) => L.DomEvent.stopPropagation(e);
        polyline.on('click', lineClickHandler);

        // 5. Додаємо саму лінію на мапу
        polyline.addTo(map);

        // 6. Функція очищення (коли компонент видаляється)
        return () => {
            map.removeLayer(decorator);
            map.removeLayer(polyline);
        };
    }, [map, drawing, onDelete]); // Перемалювати, якщо змінилась мапа або дані

    return null; // Рендеринг відбувається імперативно, тому повертаємо null
}
// ---------------------------------------------


function MapComponent({ objects, drawings, activeMap, onObjectUpdate, ...props }) {
    const position = [50.45, 30.52]; // Київ
    const socket = useSocket();
    const {
        activeTool,
        TOOLS,
        activeColor,
        lineWeight
    } = useTool();
    const { sessionId } = props;
    const [map, setMap] = useState(null);
    const [otherCursors, setOtherCursors] = useState({});

    // --- 4. НОВИЙ СТАН ДЛЯ МАЛЮВАННЯ "ПЕРЕТЯГУВАННЯМ" ---
    const [isDrawing, setIsDrawing] = useState(false); // Чи ми зараз малюємо?
    const [startLatLng, setStartLatLng] = useState(null); // Початкова точка (де натиснули)
    const [tempDrawing, setTempDrawing] = useState(null); // Тимчасова фігура для прев'ю

    // --- 5. MULTISELECT STATE ---
    const [selectedIds, setSelectedIds] = useState(new Set());

    // --- 6. CONTEXT MENU STATE ---
    const [contextMenu, setContextMenu] = useState(null); // { x, y, items }

    const handleCloseContextMenu = () => setContextMenu(null);

    const toggleSelection = useCallback((id, multi) => {
        setSelectedIds(prev => {
            const newSet = new Set(multi ? prev : []);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    }, []);

    const clearSelection = useCallback(() => {
        setSelectedIds(new Set());
    }, []);
    // ----------------------------------------------------

    // ... (isDrawingMode, dropRef, handleObject... функції без змін) ...
    const isDrawingMode = [
        TOOLS.DRAW_LINE,
        TOOLS.DRAW_ARROW,
        TOOLS.DRAW_RECTANGLE,
        TOOLS.DRAW_CIRCLE,
    ].includes(activeTool);

    const [{ isOver }, dropRef] = useDrop(
        () => ({
            accept: ItemTypes.TACTICAL_OBJECT,
            canDrop: () => activeTool === TOOLS.CURSOR,
            drop: (item, monitor) => {
                if (!map) return;
                const offset = monitor.getClientOffset();
                const latLng = map.containerPointToLatLng([offset.x, offset.y]);

                socket.emit('addNewObject', {
                    name: item.name,
                    identity: item.identity,

                    // --- ВИПРАВЛЕННЯ ТУТ ---
                    // Ми беремо 'entity' з сайдбару, але записуємо як 'type' для маркера
                    type: item.entity,
                    // -----------------------

                    echelon: item.echelon,
                    status: item.status || 'present', // NEW
                    modifier: item.modifier || 'none', // NEW
                    latLng: latLng,
                });
            },
            collect: (monitor) => ({
                isOver: monitor.canDrop() && monitor.isOver(),
            }),
        }),
        [map, socket, activeTool]
    );

    // --- handle... функції (код не змінився) ---
    // --- handle... функції (GROUP MOVE LOGIC) ---
    const handleObjectMove = useCallback(
        (id, newLatLng) => {
            // Знаходимо об'єкт, який рухаємо
            const movedObj = objects.find(o => o.id === id);
            if (!movedObj) return;

            // Якщо об'єкт не вибраний, то це звичайне переміщення одного об'єкта
            // (або якщо ми не затиснули Ctrl/Shift - але тут ми перевіряємо чи він у списку вибраних)
            // Логіка: Якщо рухаємо вибраний об'єкт -> рухаємо всю групу.
            // Якщо рухаємо невибраний -> він стає єдиним активним (дефолтна поведінка Leaflet drag, але вибір не змінюємо тут)

            if (selectedIds.has(id) && selectedIds.size > 1) {
                // GROUP MOVE
                const oldLatLng = movedObj.latLng;
                const latDiff = newLatLng.lat - oldLatLng.lat;
                const lngDiff = newLatLng.lng - oldLatLng.lng;

                // Рухаємо всі вибрані об'єкти
                selectedIds.forEach(selectedId => {
                    const objToMove = objects.find(o => o.id === selectedId);
                    if (objToMove) {
                        const newPos = {
                            lat: objToMove.latLng.lat + latDiff,
                            lng: objToMove.latLng.lng + lngDiff
                        };
                        socket.emit('objectMove', { id: selectedId, latLng: newPos });
                    }
                });
            } else {
                // SINGLE MOVE
                socket.emit('objectMove', { id: id, latLng: newLatLng });
            }
        },
        [socket, objects, selectedIds]
    );
    const handleObjectDelete = useCallback(
        (id) => {
            socket.emit('deleteObject', id);
        },
        [socket]
    );
    const handleDrawingDelete = useCallback(
        (id) => {
            socket.emit('deleteDrawing', id);
        },
        [socket]
    );

    // --- 5. ОНОВЛЮЄМО handleMapClick (для Ліній/Стрілок) ---
    // (Раніше він називався handleMapClick, ми просто перейменували)
    const handleLineDrawClick = useCallback((latlng) => {
        // Працює, тільки якщо обрано лінію або стрілку
        if (activeTool !== TOOLS.DRAW_LINE && activeTool !== TOOLS.DRAW_ARROW) return;
        // І якщо ми не в процесі малювання зони
        if (isDrawing) return;

        if (startLatLng === null) {
            setStartLatLng(latlng);
        } else {
            const points = [startLatLng, latlng];
            socket.emit('addNewDrawing', {
                type: activeTool === TOOLS.DRAW_LINE ? 'line' : 'arrow',
                points,
                color: activeColor,
                weight: lineWeight,
            });
            setStartLatLng(null);
        }
    }, [activeTool, startLatLng, socket, TOOLS, activeColor, lineWeight, isDrawing]);

    // --- 6. НОВІ ОБРОБНИКИ ДЛЯ МАЛЮВАННЯ ЗОН ---
    const handleMouseDown = useCallback((latlng) => {
        if (activeTool !== TOOLS.DRAW_RECTANGLE && activeTool !== TOOLS.DRAW_CIRCLE) return;
        if (!map) return; // Перевірка, чи мапа готова

        // 1. НАКАЗУЄМО МАПІ ЗАВМЕРТИ
        map.dragging.disable();

        setStartLatLng(latlng);
        setIsDrawing(true);
        setTempDrawing({
            type: activeTool,
            color: activeColor,
            weight: lineWeight,
            bounds: [latlng, latlng],
            center: latlng,
            radius: 1,
        });
    }, [activeTool, TOOLS, activeColor, lineWeight, map]);

    const handleMouseMove = useCallback((latlng) => {
        if (!isDrawing || !startLatLng) return;

        if (activeTool === TOOLS.DRAW_RECTANGLE) {
            setTempDrawing((prev) => ({
                ...prev,
                bounds: [startLatLng, latlng],
            }));
        } else if (activeTool === TOOLS.DRAW_CIRCLE) {
            const radius = map.distance(startLatLng, latlng);
            setTempDrawing((prev) => ({
                ...prev,
                radius: radius,
            }));
        }
    }, [isDrawing, startLatLng, activeTool, TOOLS, map]);

    const handleMouseUp = useCallback((latlng) => {
        if (!isDrawing || !startLatLng) return;
        if (!map) return; // Перевірка

        // Вимикаємо режим малювання
        setIsDrawing(false);
        setTempDrawing(null);

        // Відправляємо фінальні дані на сервер
        if (activeTool === TOOLS.DRAW_RECTANGLE) {
            socket.emit('addNewDrawing', {
                type: 'rectangle',
                bounds: [startLatLng, latlng],
                color: activeColor,
                weight: lineWeight,
            });
        } else if (activeTool === TOOLS.DRAW_CIRCLE) {
            const radius = map.distance(startLatLng, latlng);
            socket.emit('addNewDrawing', {
                type: 'circle',
                center: startLatLng,
                radius: radius,
                color: activeColor,
                weight: lineWeight,
            });
        }
        // 2. НАКАЗУЄМО МАПІ ЗНОВУ РУХАТИСЬ
        map.dragging.enable();

        // Скидаємо стан
        setIsDrawing(false);
        setTempDrawing(null);
        setStartLatLng(null);
    }, [isDrawing, startLatLng, activeTool, TOOLS, socket, activeColor, lineWeight, map]);

    // 7. HANDLE MAP CLICK (Selection clear + Line draw)
    const handleMapClick = useCallback((latlng, originalEvent) => {
        if (contextMenu) setContextMenu(null); // Close menu if open

        if (activeTool === TOOLS.CURSOR) {
            // Якщо просто клік по карті - знімаємо виділення (якщо не затиснутий Ctrl)
            if (!originalEvent.ctrlKey && !originalEvent.shiftKey) {
                clearSelection();
            }
        }

        // Line Drawing Logic
        if (activeTool === TOOLS.DRAW_LINE || activeTool === TOOLS.DRAW_ARROW) {
            handleLineDrawClick(latlng);
        }
    }, [activeTool, TOOLS, clearSelection, handleLineDrawClick, contextMenu]);

    // 8. HANDLE CONTEXT MENU (Map)
    const handleMapContextMenu = useCallback((e) => {
        console.log("Map Context Menu Triggered", e);

        const originalEvent = e.originalEvent;
        originalEvent.preventDefault();

        const items = [
            {
                label: 'Центрувати тут',
                icon: Crosshair,
                action: () => map.flyTo(e.latlng)
            },
            {
                label: 'Скинути виділення',
                icon: MapIcon,
                action: () => clearSelection()
            },
        ];

        // ADD AI MOVE COMMAND
        if (selectedIds.size > 0) {
            items.push({
                label: `🤖 AI Move (${selectedIds.size})`,
                icon: Truck,
                action: () => {
                    const currentPositions = {};
                    selectedIds.forEach(id => {
                        const obj = objects.find(o => o.id === id);
                        if (obj) currentPositions[id] = obj.latLng;
                    });

                    if (socket && sessionId) {
                        socket.emit('issueOrder', {
                            sessionId: sessionId,
                            order: {
                                type: 'move',
                                target: e.latlng,
                                unitIds: Array.from(selectedIds),
                                currentUnitPositions: currentPositions
                            }
                        });
                        console.log("AI Order Issued to", e.latlng);
                    } else {
                        console.error("Missing socket or sessionId");
                    }
                }
            });
        }

        setContextMenu({
            x: originalEvent.clientX,
            y: originalEvent.clientY,
            items: items
        });
    }, [map, clearSelection, selectedIds, objects, socket, sessionId]);

    // 9. HANDLE OBJECT CONTEXT MENU
    const handleObjectContextMenu = useCallback((e, obj) => {
        console.log("Object Context Menu Triggered", obj.id);
        const originalEvent = e.originalEvent;
        originalEvent.preventDefault();

        setContextMenu({
            x: originalEvent.clientX,
            y: originalEvent.clientY,
            items: [
                {
                    label: 'Редагувати',
                    icon: Edit,
                    action: () => {
                        // We need a way to trigger edit mode on the marker.
                        // Currently 'isEditing' is local state in TacticalMarker.
                        // We can't easily reach it from here without Ref or uplifting state.
                        // Quick fix: We can't do "Edit" via context menu easily unless we change architecture.
                        // OR: We pass a signal via props? No.
                        // ALTERNATIVE: Just show info or Delete/Clone.
                        // Let's implement Delete and Rotate.
                        alert("Редагування доступне через кнопку в попапі (WIP for Context Menu)");
                    }
                },
                {
                    label: 'Повернути +45°',
                    icon: RotateCw,
                    action: () => {
                        socket.emit('updateObject', { id: obj.id, direction: (obj.direction || 0) + 45 });
                    }
                },
                {
                    label: 'Видалити',
                    icon: Trash2,
                    danger: true,
                    action: () => {
                        if (confirm('Видалити об\'єкт?')) {
                            socket.emit('deleteObject', obj.id);
                        }
                    }
                },
            ]
        });
    }, [socket]); // Added isDrawing dep

    // 3. ДОДАЄМО НОВИЙ useEffect (для безпеки)
    // Цей ефект спрацює, якщо ми змінимо інструмент
    useEffect(() => {
        if (map && !isDrawingMode) {
            // Якщо ми перемкнулись на "Курсор" (або інший не-малюючий інструмент)
            // гарантовано вмикаємо drag мапи
            map.dragging.enable();

            // І скасовуємо будь-яке незавершене малювання
            setIsDrawing(false);
            setStartLatLng(null);
            setTempDrawing(null);
        }
    }, [map, activeTool, isDrawingMode]);

    // --- 7. useEffect-и (без змін) ---
    // Ми залишили тут ТІЛЬКИ логіку курсорів,
    // бо вона не пов'язана з головним станом (вона тимчасова)
    useEffect(() => {
        if (!socket) return;

        const handleUpdateCursor = (data) => setOtherCursors((prev) => ({ ...prev, [data.id]: data }));
        const handleUserDisconnect = (id) => setOtherCursors((prev) => {
            const newState = { ...prev };
            delete newState[id];
            return newState;
        });

        socket.on('updateCursor', handleUpdateCursor);
        socket.on('userDisconnect', handleUserDisconnect);

        // Всі слухачі 'object...' та 'drawing...' ПЕРЕЇХАЛИ В App.jsx

        return () => {
            socket.off('updateCursor', handleUpdateCursor);
            socket.off('userDisconnect', handleUserDisconnect);
        };
    }, [socket]);

    // --- Ефект 'mousemove' (код не змінився) ---
    useEffect(() => {
        if (!map || !socket) return;
        const handleMouseMove = (e) => {
            socket.emit('cursorMove', { lat: e.latlng.lat, lng: e.latlng.lng });
        };
        map.on('mousemove', handleMouseMove);
        return () => {
            map.off('mousemove', handleMouseMove);
        };
    }, [map, socket]);

    // --- Ефект 'invalidateSize' (код не змінився) ---
    useEffect(() => {
        if (map) {
            const timer = setTimeout(() => {
                map.invalidateSize();
            }, 100);
            return () => {
                clearTimeout(timer);
            };
        }
    }, [map]);

    // ============================================
    // КАЛІБРУВАННЯ (CALIBRATION LOGIC)
    // ============================================
    // ============================================
    // КАЛІБРУВАННЯ (CALIBRATION LOGIC)
    // ============================================
    // ============================================
    // КАЛІБРУВАННЯ (CALIBRATION LOGIC)
    // ============================================
    const { isCalibrating, onSaveCalibration, onCancelCalibration, connectedUsers = [] } = props; // Props from GameLayout

    // Default bounds (Kyiv area) if nothing saved
    const DEFAULT_BOUNDS = [[50.40, 30.40], [50.50, 30.60]];

    // Local state for bounds during calibration
    const [calBounds, setCalBounds] = useState(DEFAULT_BOUNDS);
    const [opacity, setOpacity] = useState(1);

    // Sync bounds with activeMap when not calibrating (or when map changes)
    useEffect(() => {
        if (activeMap && activeMap.calibrationData && activeMap.calibrationData.bounds) {
            setCalBounds(activeMap.calibrationData.bounds);
        } else {
            setCalBounds(DEFAULT_BOUNDS);
        }

        // Reset opacity
        setOpacity(isCalibrating ? 0.7 : 1);

    }, [activeMap, isCalibrating]);

    // Handlers for dragging markers
    const handleDragTopLeft = useCallback((e) => {
        const newLatLng = e.target.getLatLng();
        setCalBounds(prev => [[newLatLng.lat, newLatLng.lng], prev[1]]);
    }, []);

    const handleDragBottomRight = useCallback((e) => {
        const newLatLng = e.target.getLatLng();
        setCalBounds(prev => [prev[0], [newLatLng.lat, newLatLng.lng]]);
    }, []);

    // Custom icons for calibration handles
    const handleIcon = useMemo(() => L.divIcon({
        className: 'bg-transparent',
        html: '<div class="w-4 h-4 rounded-full border-2 border-white shadow-md bg-blue-500 hover:scale-125 transition-transform"></div>',
        iconSize: [16, 16],
        iconAnchor: [8, 8],
    }), []);

    // ============================================

    return (
        <div ref={dropRef} className="h-full w-full">
            <MapContainer
                center={position}
                zoom={13}
                scrollWheelZoom={true}
                className={`h-full w-full transition-all ${isOver ? 'opacity-70 ring-4 ring-blue-500' : ''}`}
                ref={setMap}
                style={{ cursor: isDrawingMode ? 'crosshair' : 'default' }}

            >
                {/* --- Відображення карти (OSM або Власна) --- */}
                {/* 1. LAYER LIST (OSM always behind if needed, or if no active map) */}
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* 2. OVERLAY (If active map exists) */}
                {activeMap && (
                    <ImageOverlay
                        url={`http://localhost:5001${activeMap.url}`}
                        bounds={calBounds} // Use dynamic bounds
                        opacity={opacity}
                        zIndex={10}
                    />
                )}

                {/* 3. CALIBRATION HANDLES (Visible only when calibrating) */}
                {isCalibrating && (
                    <>
                        <Marker
                            position={calBounds[0]}
                            draggable={true}
                            eventHandlers={{ drag: handleDragTopLeft }}
                            icon={handleIcon}
                        >
                            <Popup>Верхній Лівий Кут</Popup>
                        </Marker>
                        <Marker
                            position={calBounds[1]}
                            draggable={true}
                            eventHandlers={{ drag: handleDragBottomRight }}
                            icon={handleIcon}
                        >
                            <Popup>Нижній Правий Кут</Popup>
                        </Marker>

                        {/* CALIBRATION UI CONTROL (Portal or absolute div) */}
                        <div className="leaflet-bottom leaflet-right" style={{ pointerEvents: 'auto', marginBottom: '20px', marginRight: '20px', zIndex: 9999 }}>
                            <div className="bg-zinc-800 p-4 rounded-lg shadow-xl border border-zinc-600 text-white w-64">
                                <h4 className="font-bold mb-2">Режим Калібрування</h4>
                                <p className="text-xs text-gray-400 mb-4">Перетягуйте маркери кутів, щоб накласти карту на місцевість.</p>

                                <div className="mb-4">
                                    <label className="text-xs mb-1 block">Прозорість: {Math.round(opacity * 100)}%</label>
                                    <input
                                        type="range"
                                        min="0" max="1" step="0.1"
                                        value={opacity}
                                        onChange={(e) => setOpacity(parseFloat(e.target.value))}
                                        className="w-full"
                                    />
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => onCancelCalibration()}
                                        className="flex-1 py-1 px-3 bg-zinc-600 rounded hover:bg-zinc-500 text-sm"
                                    >
                                        Скасувати
                                    </button>
                                    <button
                                        onClick={() => onSaveCalibration(calBounds)}
                                        className="flex-1 py-1 px-3 bg-green-600 rounded hover:bg-green-700 font-bold text-sm"
                                    >
                                        Зберегти
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                <MapEventsHandler
                    onMapClick={handleMapClick} // Changed from handleLineDrawClick to generic handler
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onContextMenu={handleMapContextMenu}
                />

                {/* ... (Render code) ... */}

                {/* CONTEXT MENU REMOVED FROM HERE */}

                {/* 4. ОНОВЛЕНИЙ РЕНДЕР-БЛОК */}
                {drawings.map((drawing) => {
                    switch (drawing.type) {
                        case 'line':
                            return (
                                <TacticalPolyline
                                    key={drawing.id}
                                    drawing={drawing}
                                    onDelete={handleDrawingDelete}
                                />
                            );
                        case 'arrow': // <-- ТЕПЕР ВИКОРИСТОВУЄ TacticalArrow
                            return (
                                <TacticalArrow
                                    key={drawing.id}
                                    drawing={drawing}
                                    onDelete={handleDrawingDelete}
                                />
                            );
                        case 'rectangle':
                            return (
                                <TacticalRectangle
                                    key={drawing.id}
                                    drawing={drawing}
                                    onDelete={handleDrawingDelete}
                                />
                            );
                        case 'circle':
                            return (
                                <TacticalCircle
                                    key={drawing.id}
                                    drawing={drawing}
                                    onDelete={handleDrawingDelete}
                                />
                            );
                        default:
                            return null;
                    }
                })}

                {/* 11. РЕНДЕР ТИМЧАСОВОЇ ФІГУРИ (ПРЕВ'Ю) */}
                {tempDrawing && tempDrawing.type === TOOLS.DRAW_RECTANGLE && (
                    <Rectangle
                        bounds={tempDrawing.bounds}
                        pathOptions={{
                            color: tempDrawing.color,
                            weight: tempDrawing.weight,
                            dashArray: '5, 5', // Робимо її пунктирною
                        }}
                    />
                )}
                {tempDrawing && tempDrawing.type === TOOLS.DRAW_CIRCLE && (
                    <Circle
                        center={tempDrawing.center}
                        radius={tempDrawing.radius}
                        pathOptions={{
                            color: tempDrawing.color,
                            weight: tempDrawing.weight,
                            dashArray: '5, 5', // Робимо її пунктирною
                        }}
                    />
                )}

                {/* ... (Рендер об'єктів (TacticalMarker) та курсорів без змін) ... */}
                {objects.map((obj) => (
                    <TacticalMarker
                        key={obj.id}
                        obj={obj}
                        onMove={handleObjectMove}
                        onDelete={handleObjectDelete}
                        onUpdate={onObjectUpdate}
                        activeTool={activeTool}
                        TOOLS={TOOLS}
                        isSelected={selectedIds.has(obj.id)}
                        onToggleSelect={toggleSelection}
                        onContextMenu={handleObjectContextMenu}
                    />
                ))}
                {/* 5. ІНШІ КОРИСТУВАЧІ (КУРСОРИ З ІМЕНАМИ) */}
                {Object.entries(otherCursors).map(([id, { lat, lng }]) => {
                    // Find user info
                    const userInfo = connectedUsers.find(u => u.id === id);
                    const color = userInfo?.color || '#3b82f6'; // Default blue
                    const name = userInfo?.name || 'Guest';

                    const userCursorIcon = L.divIcon({
                        className: 'custom-cursor-container', // We'll add this class to CSS if needed, or inline styles
                        html: `
                            <div style="position: relative;">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" fill="${color}" fill-opacity="0.3"></path>
                                </svg>
                                <div style="
                                    position: absolute; 
                                    left: 12px; 
                                    top: 12px; 
                                    background: ${color}; 
                                    color: white; 
                                    padding: 2px 6px; 
                                    border-radius: 4px; 
                                    font-size: 10px; 
                                    font-weight: bold; 
                                    white-space: nowrap;
                                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                                ">
                                    ${name}
                                </div>
                            </div>
                        `,
                        iconSize: [24, 24],
                        iconAnchor: [0, 0],
                    });

                    return (
                        <Marker
                            key={id}
                            position={[lat, lng]}
                            icon={userCursorIcon}
                            zIndexOffset={1000}
                        />
                    );
                })}
            </MapContainer>

            {/* CONTEXT MENU - Moved OUTSIDE MapContainer */}
            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    items={contextMenu.items}
                    onClose={handleCloseContextMenu}
                />
            )}
        </div>
    );
}

export default MapComponent;