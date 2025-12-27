import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';

function ContextMenu({ x, y, items, onClose }) {
    const menuRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        const handleClick = (e) => {
            console.log("ContextMenu Global Click Handler:", e.type, e.target);
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                console.log("Closing ContextMenu (Click Outside)");
                onClose();
            }
        };
        // Delay adding listener to avoid immediate close from the opening event
        const timer = setTimeout(() => {
            document.addEventListener('click', handleClick);
            document.addEventListener('contextmenu', handleClick);
        }, 100);

        // Prevent scroll when menu is open? Maybe not needed.

        return () => {
            clearTimeout(timer);
            document.removeEventListener('click', handleClick);
            document.removeEventListener('contextmenu', handleClick);
        };
    }, [onClose]);

    // Position check
    console.log("Rendering ContextMenu via Portal at:", x, y);

    const style = {
        top: y,
        left: x,
    };

    return ReactDOM.createPortal(
        <div
            ref={menuRef}
            className="fixed z-[9999] min-w-[160px] overflow-hidden rounded-md border border-zinc-700 bg-zinc-800 shadow-xl"
            style={style}
            onContextMenu={(e) => e.preventDefault()} // Prevent default context menu on the menu itself
        >
            <div className="flex flex-col py-1">
                {items.map((item, index) => (
                    <button
                        key={index}
                        onClick={(e) => {
                            e.stopPropagation();
                            item.action();
                            onClose();
                        }}
                        className={`flex items-center gap-2 px-4 py-2 text-sm text-left transition-colors w-full
                            ${item.danger
                                ? 'text-red-400 hover:bg-zinc-700 hover:text-red-300'
                                : 'text-zinc-200 hover:bg-zinc-700 hover:text-white'
                            }
                        `}
                    >
                        {item.icon && <item.icon size={16} />}
                        {item.label}
                    </button>
                ))}
            </div>
        </div>,
        document.body
    );
}

export default ContextMenu;
