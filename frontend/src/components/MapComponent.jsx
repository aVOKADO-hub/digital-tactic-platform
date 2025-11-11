
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    Polyline,
    useMapEvents,
} from 'react-leaflet';
import { useSocket } from '../context/SocketContext.jsx';
import L from 'leaflet';
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

// --- TacticalPolyline (код не змінився) ---
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
            color="red"
            weight={3}
            eventHandlers={eventHandlers}
        >
            <Popup>
                <div className="flex flex-col gap-2">
                    <span className="font-bold">Лінія наступу</span>
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

// --- MapClickHandler (код не змінився) ---
function MapClickHandler({ onMapClick }) {
    useMapEvents({
        click(e) {
            onMapClick(e.latlng);
        },
    });
    return null;
}
// ---------------------------------------------

// --- 1. ОНОВЛЕННЯ ОСНОВНОГО КОМПОНЕНТА ---
// Він тепер отримує 'objects' та 'drawings' як props
function MapComponent({ objects, drawings }) {
    const position = [50.45, 30.52]; // Київ
    const socket = useSocket();
    const { activeTool, TOOLS } = useTool();
    const [map, setMap] = useState(null);
    const [otherCursors, setOtherCursors] = useState({});
    // const [objects, setObjects] = useState([]); // <-- 2. ВИДАЛЕНО
    // const [drawings, setDrawings] = useState([]); // <-- 2. ВИДАЛЕНО
    const [lineStartPoint, setLineStartPoint] = useState(null);

    // --- Drop (код не змінився) ---
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
    // Вони відправляють події, а стан оновить App.jsx
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
    const handleMapClick = useCallback((latlng) => {
        if (activeTool !== TOOLS.DRAW_LINE) return;
        if (lineStartPoint === null) {
            setLineStartPoint(latlng);
        } else {
            const points = [lineStartPoint, latlng];
            socket.emit('addNewDrawing', { type: 'line', points });
            setLineStartPoint(null);
        }
    }, [activeTool, lineStartPoint, socket, TOOLS.DRAW_LINE]);

    // --- 3. СПРОЩЕНИЙ useEffect ДЛЯ SOCKET.IO ---
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
                className={`h-full w-full transition-all ${isOver ? 'opacity-70 ring-4 ring-blue-500' : ''
                    }`}
                ref={setMap}
                style={{ cursor: activeTool === TOOLS.DRAW_LINE ? 'crosshair' : 'default' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapClickHandler onMapClick={handleMapClick} />

                {/* 4. Рендер малюнків (тепер з props.drawings) */}
                {drawings.map((drawing) => (
                    <TacticalPolyline
                        key={drawing.id}
                        drawing={drawing}
                        onDelete={handleDrawingDelete}
                    />
                ))}

                {/* 5. Рендер об'єктів (тепер з props.objects) */}
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

                {/* Рендер курсорів */}
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