import html2canvas from 'html2canvas';

// --- JSON EXPORT ---
export const exportToJson = (data, filename = 'scenario.json') => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const href = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = href;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// --- JSON IMPORT ---
export const importFromJson = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target.result);
                resolve(json);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsText(file);
    });
};

// --- SCREENSHOT (PNG) ---
export const takeScreenshot = async (elementId, filename = 'tactic-map.png') => {
    const element = document.getElementById(elementId);
    if (!element) {
        console.error(`Element with id '${elementId}' not found`);
        return;
    }

    try {
        // html2canvas options for Map
        const canvas = await html2canvas(element, {
            useCORS: true, // Critical for cross-origin images (OSM tiles)
            allowTaint: true,
            backgroundColor: null, // Transparent background if possible
            logging: false,
        });

        const link = document.createElement('a');
        link.download = filename;
        link.href = canvas.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error('Screenshot failed:', error);
        alert('Не вдалося зробити скріншот. Перевірте консоль.');
    }
};
