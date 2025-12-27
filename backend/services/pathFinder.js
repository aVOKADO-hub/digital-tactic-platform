import PF from 'pathfinding';

class PathFinderService {
    constructor() {
        this.grids = new Map(); // sessionId -> { grid: PF.Grid, bounds: { minLat, maxLat, minLng, maxLng }, width, height }
        this.resolution = 100; // 100x100 grid for MVP
    }

    /**
     * Converts Lat/Lng to Grid X/Y
     */
    toGrid(lat, lng, bounds) {
        if (!bounds) return null;
        // Normalize to 0..1
        const latRatio = (lat - bounds.minLat) / (bounds.maxLat - bounds.minLat);
        const lngRatio = (lng - bounds.minLng) / (bounds.maxLng - bounds.minLng);
        
        // Map to grid. Note: Grid Y usually goes down, Lat goes up. 
        // Let's assume bounds.minLat is bottom, maxLat is top.
        // x = lngRatio * width
        // y = (1 - latRatio) * height (invert Y because grid 0 is top)
        
        let x = Math.floor(lngRatio * this.resolution);
        let y = Math.floor((1 - latRatio) * this.resolution);
        
        // Clamp
        x = Math.max(0, Math.min(x, this.resolution - 1));
        y = Math.max(0, Math.min(y, this.resolution - 1));
        
        return { x, y };
    }

    /**
     * Converts Grid X/Y back to Lat/Lng
     */
    toLatLng(x, y, bounds) {
        if (!bounds) return null;
        const xRatio = x / this.resolution;
        const yRatio = y / this.resolution; // This is (1 - latRatio)
        
        const lat = bounds.maxLat - (yRatio * (bounds.maxLat - bounds.minLat));
        const lng = bounds.minLng + (xRatio * (bounds.maxLng - bounds.minLng));
        
        return { lat, lng };
    }

    /**
     * Builds/Updates the navigation grid for a session
     * @param {string} sessionId 
     * @param {Object} mapCalibrationBounds - [[lat1, lng1], [lat2, lng2]] (TopLeft, BottomRight)
     * @param {Array} obstacles - List of drawing objects
     */
    updateGrid(sessionId, calibrationBounds, obstacles) {
        // 1. Calculate Bounds
        // Leaflet bounds: [[lat, long], [lat, long]]
        // Need min/max
        if (!calibrationBounds) return; // Can't build grid without bounds
        
        const lats = [calibrationBounds[0][0], calibrationBounds[1][0]];
        const lngs = [calibrationBounds[0][1], calibrationBounds[1][1]];
        
        const bounds = {
            minLat: Math.min(...lats),
            maxLat: Math.max(...lats),
            minLng: Math.min(...lngs),
            maxLng: Math.max(...lngs)
        };

        // 2. Create Empty Grid
        const grid = new PF.Grid(this.resolution, this.resolution);

        // 3. Rasterize Obstacles
        // Simplified: Treat objects as points or bounding boxes for now
        obstacles.forEach(obs => {
            if (obs.type === 'rectangle' || obs.type === 'circle') { // Only block simple shapes for now
                // Get bounds of the shape (approximate for circle)
                // For MVP, if it's a rectangle: bounds=[[lat1,lng1], [lat2,lng2]] mechanism? 
                // Our drawings might store 'bounds' or 'center'/'radius'.
                
                // Let's implement Rectangle blocking (e.g. bounding box of shape)
                // We need to fetch the shape's bounds from 'obs.bounds' (if rect) or 'obs.center'+radius (if circle)
                
                // TODO: Logic to get shape bounds. Assuming obs.bounds exists for rectangle.
                if (obs.type === 'rectangle' && obs.bounds) {
                    const blockStart = this.toGrid(obs.bounds[0].lat, obs.bounds[0].lng, bounds);
                    const blockEnd = this.toGrid(obs.bounds[1].lat, obs.bounds[1].lng, bounds);
                    
                    if (blockStart && blockEnd) {
                        const startX = Math.min(blockStart.x, blockEnd.x);
                        const endX = Math.max(blockStart.x, blockEnd.x);
                        const startY = Math.min(blockStart.y, blockEnd.y);
                        const endY = Math.max(blockStart.y, blockEnd.y);
                        
                        for (let ix = startX; ix <= endX; ix++) {
                            for (let iy = startY; iy <= endY; iy++) {
                                grid.setWalkableAt(ix, iy, false);
                            }
                        }
                    }
                }
            }
        });

        this.grids.set(sessionId, { grid, bounds });
        // console.log(`[PathFinder] Updated grid for session ${sessionId}`);
    }

    findPath(sessionId, startLatLng, endLatLng) {
        const sessionData = this.grids.get(sessionId);
        if (!sessionData) {
            console.warn(`[PathFinder] No grid for session ${sessionId}`);
            return [];
        }

        const { grid, bounds } = sessionData;
        
        // Clone grid so we don't dirty the cached one
        const workGrid = grid.clone();
        
        const startNode = this.toGrid(startLatLng.lat, startLatLng.lng, bounds);
        const endNode = this.toGrid(endLatLng.lat, endLatLng.lng, bounds);

        if (!startNode || !endNode) return [];

        const finder = new PF.AStarFinder({
            allowDiagonal: true,
            dontCrossCorners: true
        });

        const path = finder.findPath(startNode.x, startNode.y, endNode.x, endNode.y, workGrid);

        // Convert path back to LatLngs
        // Simplification: compress path? PF has smoothing?
        // Let's just return all points for now
        return path.map(([x, y]) => this.toLatLng(x, y, bounds));
    }
}

const pathFinder = new PathFinderService();
export default pathFinder;
