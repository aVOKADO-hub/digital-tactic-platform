

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
    useMap, // <-- 1. ІМПОРТУЄМО useMap
} from 'react-leaflet';
import { useSocket } from '../context/SocketContext.jsx';
import L from 'leaflet';
// 2. ІМПОРТУЄМО ПЛАГІН
import 'leaflet-polylinedecorator';

import { MousePointer2, Truck } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';
import { useDrop } from 'react-dnd';
import { ItemTypes } from '../constants.js';
import { useTool } from '../context/ToolContext.jsx';


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

// --- TacticalMarker (код не змінився) ---
function TacticalMarker({ obj, onMove, onDelete, activeTool, TOOLS }) {
    const eventHandlers = useMemo(
        () => ({
            dragend(e) {
                onMove(obj.id, e.target.getLatLng());
            },
        }),
        [obj.id, onMove]
    );
    return (
        <Marker
            position={obj.latLng}
            icon={objectIcon}
            draggable={activeTool === TOOLS.CURSOR}
            eventHandlers={eventHandlers}
        >
            <Popup>
                <div className="flex flex-col gap-2">
                    <span className="font-bold">{obj.name}</span>
                    <button
                        onClick={() => onDelete(obj.id)}
                        className="rounded bg-red-500 px-2 py-1 text-white hover:bg-red-700"
                    >
                        Видалити
                    </button>
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
function MapEventsHandler({ onMapClick, onMouseDown, onMouseMove, onMouseUp }) {
    useMapEvents({
        click(e) {
            onMapClick(e.latlng);
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


function MapComponent({ objects, drawings }) {
    const position = [50.45, 30.52]; // Київ
    const socket = useSocket();
    const {
        activeTool,
        TOOLS,
        activeColor,
        lineWeight
    } = useTool();

    const [map, setMap] = useState(null);
    const [otherCursors, setOtherCursors] = useState({});

    // --- 4. НОВИЙ СТАН ДЛЯ МАЛЮВАННЯ "ПЕРЕТЯГУВАННЯМ" ---
    const [isDrawing, setIsDrawing] = useState(false); // Чи ми зараз малюємо?
    const [startLatLng, setStartLatLng] = useState(null); // Початкова точка (де натиснули)
    const [tempDrawing, setTempDrawing] = useState(null); // Тимчасова фігура для прев'ю
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
                    type: item.type,
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
    const handleObjectMove = useCallback(
        (id, latLng) => {
            socket.emit('objectMove', { id: id, latLng: latLng });
        },
        [socket]
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
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapEventsHandler
                    onMapClick={handleLineDrawClick}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                />

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
                        activeTool={activeTool}
                        TOOLS={TOOLS}
                    />
                ))}
                {Object.entries(otherCursors).map(([id, { lat, lng }]) => (
                    <Marker
                        key={id}
                        position={[lat, lng]}
                        icon={cursorIcon}
                        zIndexOffset={1000}
                    />
                ))}

            </MapContainer>
        </div>
    );
}

export default MapComponent;