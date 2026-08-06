import L from 'leaflet'

function createDivIcon(color: string, isVisited: boolean) {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: ${isVisited ? '20px' : '16px'};
        height: ${isVisited ? '20px' : '16px'};
        background-color: ${color};
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 1px 4px rgba(0,0,0,0.4);
      "></div>
    `,
    iconSize: [isVisited ? 20 : 16, isVisited ? 20 : 16],
    iconAnchor: [isVisited ? 10 : 8, isVisited ? 10 : 8],
  })
}

export const visitedIcon = createDivIcon('#059669', true)
export const unvisitedIcon = createDivIcon('#94a3b8', false)
