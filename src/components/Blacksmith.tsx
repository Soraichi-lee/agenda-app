// Karakter pixel art: penempa senjata yang mengayunkan palu ke landasan
export default function Blacksmith({ className = '' }: { className?: string }) {
  const px = (x: number, y: number, w: number, h: number, fill: string) => <rect x={x} y={y} width={w} height={h} fill={fill} />
  return (
    <div className={`relative ${className}`}>
      <svg viewBox="0 0 32 28" className="h-full w-full" shapeRendering="crispEdges" aria-label="Penempa senjata">
        {/* landasan */}
        {px(17, 18, 13, 3, '#4a4a58')}
        {px(15, 18, 2, 2, '#4a4a58')}
        {px(17, 18, 13, 1, '#7a7a8c')}
        {px(21, 21, 5, 3, '#33333f')}
        {px(19, 24, 9, 2, '#33333f')}
        {/* pedang membara di landasan */}
        {px(19, 17, 9, 1, '#ff8a2a')}
        {px(27, 17, 2, 1, '#ffd34d')}
        {px(17, 16, 2, 3, '#6b4a2b')}
        {/* kaki */}
        {px(4, 22, 3, 4, '#3b2a20')}
        {px(9, 22, 3, 4, '#3b2a20')}
        {px(3, 26, 4, 2, '#171310')}
        {px(9, 26, 4, 2, '#171310')}
        {/* badan + celemek kulit */}
        {px(3, 13, 10, 9, '#c47a4a')}
        {px(4, 14, 8, 9, '#7a4a2a')}
        {px(5, 15, 6, 1, '#9a6238')}
        {px(3, 18, 10, 1, '#3b2a20')}
        {/* lengan kiri */}
        {px(1, 14, 2, 6, '#e0a070')}
        {/* kepala */}
        {px(4, 5, 8, 8, '#e0a070')}
        {px(4, 4, 8, 2, '#3b2a20')}
        {px(3, 5, 1, 3, '#3b2a20')}
        {px(9, 8, 1, 1, '#171310')}
        {px(6, 8, 1, 1, '#171310')}
        {/* janggut */}
        {px(4, 10, 8, 3, '#8a4a22')}
        {px(5, 13, 6, 1, '#8a4a22')}
        {px(7, 10, 3, 1, '#e0a070')}
        {/* ikat kepala */}
        {px(4, 6, 8, 1, '#e0457b')}
        {/* lengan kanan + palu (beranimasi) */}
        <g className="anim-hammer">
          {px(12, 13, 6, 2, '#e0a070')}
          {px(17, 9, 1, 6, '#6b4a2b')}
          {px(15, 6, 5, 4, '#5a5a6a')}
          {px(15, 6, 5, 1, '#9a9aac')}
        </g>
      </svg>
      {/* percikan api */}
      {[-14, 4, 16].map((sx, i) => (
        <span
          key={i}
          className="anim-spark absolute h-1.5 w-1.5 bg-yellow"
          style={{ left: '66%', top: '58%', animationDelay: `${i * 0.08}s`, ['--sx' as string]: `${sx}px` }}
        />
      ))}
    </div>
  )
}
