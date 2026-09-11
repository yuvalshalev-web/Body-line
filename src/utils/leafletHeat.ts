import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

let isHeatInitialized = false;

export async function loadLeafletWithHeat(): Promise<typeof L> {
  if (typeof window !== 'undefined') {
    (window as any).L = L;

    if (!isHeatInitialized) {
      try {
        await import('leaflet.heat');
        isHeatInitialized = true;
      } catch (err) {
        console.warn('Could not load leaflet.heat module directly:', err);
      }

      // Safe guard leaflet-heat against 0-dimension canvas calls
      if ((L as any).HeatLayer && !(L as any)._heatRedrawPatched) {
        (L as any)._heatRedrawPatched = true;
        const origRedraw = (L as any).HeatLayer.prototype._redraw;
        (L as any).HeatLayer.prototype._redraw = function (this: any) {
          if (!this._map) return;
          const size = this._map.getSize();
          if (!size || size.x <= 0 || size.y <= 0) return;
          if (this._canvas && (this._canvas.width <= 0 || this._canvas.height <= 0)) return;
          try {
            origRedraw.call(this);
          } catch (e) {
            console.warn('Heatmap redraw safely ignored:', e);
          }
        };
      }
    }
  }

  return L;
}

export { L };
