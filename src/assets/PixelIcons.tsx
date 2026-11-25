// Ikon pixel-art 12x12 bergaya item game RPG
const PAL: Record<string, string> = {
  k: '#171310', // garis
  p: '#f3dfb5', // perkamen
  w: '#fff9f0', // putih
  d: '#c9a36a', // kayu terang
  b: '#8a5a2b', // kayu
  r: '#e0457b', // merah
  y: '#ffc93c', // emas
  g: '#3ecf8e', // hijau ramuan
  c: '#7fd4ff', // kaca / jendela
  s: '#9aa0b4', // besi
  v: '#7c5cd6', // ungu
  o: '#f26522', // oranye
  f: '#f2c79a', // kulit
  l: '#3d8bd4', // jubah biru
  e: '#25507e', // jubah gelap
  m: '#5bbf4a', // goblin hijau
  n: '#2f7a2a', // hijau gelap
  x: '#d63b3b', // merah naga
  h: '#5a5f73', // abu gelap
}

const ICONS = {
  tugas: ['.kkkkkkkkkk.', 'kddddddddddk', '.kppppppppk.', '.kpkkkkkkpk.', '.kppppppppk.', '.kpkkkkkppk.', '.kppppppppk.', '.kpkkkkkkpk.', '.kppppppppk.', '.kpkkkppppk.', 'kddddddddddk', '.kkkkkkkkkk.'],
  jadwal: ['..k......k..', '.kkkkkkkkkk.', '.krrrrrrrrk.', '.kkkkkkkkkk.', '.kwwwwwwwwk.', '.kwkwkwkwwk.', '.kwwwwwwwwk.', '.kwkwkwrwwk.', '.kwwwwwwwwk.', '.kwkwkwkwwk.', '.kwwwwwwwwk.', '.kkkkkkkkkk.'],
  fokus: ['.kkkkkkkkkk.', '.kbbbbbbbbk.', '..kyyyyyyk..', '..kcyyyyck..', '...kcyyck...', '....kyyk....', '....kcyk....', '...kcyyck...', '..kcyyyyck..', '..kyyyyyyk..', '.kbbbbbbbbk.', '.kkkkkkkkkk.'],
  tambah: ['....kkkk....', '....kbbk....', '.....kk.....', '....kggk....', '...kggggk...', '..kggggggk..', '.kgggwwgggk.', '.kggwwwwggk.', '.kgggwwgggk.', '.kggggggggk.', '..kggggggk..', '...kkkkkk...'],
  store: ['............', '..kkkkkkkk..', '.kbbbbbbbbk.', 'kbbbbbbbbbbk', 'kkkkkkkkkkkk', 'kbbbyyyybbbk', 'kbbbykkybbbk', 'kbbbyyyybbbk', 'kbbbbbbbbbbk', 'kyyyyyyyyyyk', 'kbbbbbbbbbbk', 'kkkkkkkkkkkk'],
  analytics: ['............', '.........kkk', '.........kyk', '.....kkk.kyk', '.....kvk.kyk', '.kkk.kvk.kyk', '.kgk.kvk.kyk', '.kgk.kvk.kyk', '.kgk.kvk.kyk', '.kgk.kvk.kyk', 'kkkkkkkkkkkk', '............'],
  home: ['.....kk.....', '....kook....', '...kooook...', '..kooooook..', '.kooooooook.', 'kkkkkkkkkkkk', '.kwwwwwwwwk.', '.kwcckwbbwk.', '.kwcckwbbwk.', '.kwwwwwbbwk.', '.kwwwwwbbwk.', '.kkkkkkkkkk.'],
  settings: ['....kkkk....', '.kk.kssk.kk.', '.kssssssssk.', '..kssssssk..', 'kksskkkksskk', 'kssk....kssk', 'kssk....kssk', 'kksskkkksskk', '..kssssssk..', '.kssssssssk.', '.kk.kssk.kk.', '....kkkk....'],
  cuaca: ['..y..y......', '...kkkk.....', 'y.kyyyyk....', '.kyyyyyyk...', '.kyyyykkkk..', 'ykyyykwwwwk.', '.kyykwwwwwwk', '..kkkwwwwwwk', '...kwwwwwwwk', '..kwwwwwwwwk', '..kkkkkkkkk.', '............'],
  campfire: ['.....kk.....', '....kook....', '...kooyk....', '...koyyok...', '..koyyyyok..', '..koywwyok..', '..koyyyyok..', '...kooook...', '.kbbkkkkbbk.', 'kbbbbbbbbbbk', '.kkbbkkbbkk.', '..kk....kk..'],
  wizard: ['............cc..', '.......kk..kcck.', '......kvvk..kk..', '.....kvyvvk..b..', '....kvvvvvvk.b..', '...kkkkkkkkkkb..', '.....kffffk..b..', '.....kfkkfk..b..', '.....kwwwwk..b..', '....kwwwwwwk.b..', '...klwwwwwwlkf..', '...kllwwwwllkb..', '...kllllllllkb..', '..kllllllllllk..', '..keeeeeeeeeeek.', '...kkk....kkk...'],
  goblin: ['................', '..k..........k..', '..kmk......kmk..', '...kmkkkkkkmk...', '...kmmmmmmmmk...', '..kmmmmmmmmmmk..', '..kmmyymmyymmk..', '..kmmkymmkymmk..', '..kmmmmmmmmmmk..', '..kmmkwkkwkmmk..', '...kmmkkkkmmk...', '....kbbbbbbk....', '...kmbbbbbbmk...', '....kbbbbbbk....', '....knk..knk....', '....kkk..kkk....'],
  dragon: ['................', '.kk..........kk.', '.kxk..kkkk..kxk.', '.kxxkkxxxxkkxxk.', '.kxxxkxyyxkxxxk.', '.kxxkxxxxxxkxxk.', '..kkkxkxxkxkkk..', '....kxwwwwxk....', '....kxxxxxxk....', '...kxooooooxk...', '..kxxooooooxxk..', '..kxxooooooxxk..', '...kxxxxxxxxk...', '...kxk....kxk...', '...kkk....kkk...', '................'],
  wolf: ['................', '...kk......kk...', '...ksk....ksk...', '...kssk..kssk...', '...kssskksssk...', '..kssssssssssk..', '..ksskyssykssk..', '..kssssssssssk..', '...kssswwsssk...', '....ksswwssk....', '....kswkkwsk....', '.....kwwwwk.....', '....kssssssk....', '...kssssssssk...', '...ksk....ksk...', '...kkk....kkk...'],
  skull: ['............', '..kkkkkkkk..', '.kwwwwwwwwk.', 'kwwwwwwwwwwk', 'kwwkkwwkkwwk', 'kwwkkwwkkwwk', 'kwwwwkkwwwwk', '.kwwwwwwwwk.', '..kwkwwkwk..', '..kkkkkkkk..', '............', '............'],
  shield: ['.kkkkkkkkkk.', '.kllllyylllk', '.klllyyyyllk', '.kllllyylllk', '.kllllyylllk', '.kllllyylllk', '..kllllllk..', '..kllllllk..', '...kllllk...', '....kllk....', '.....kk.....', '............'],
  target: ['....kkkk....', '..kkrrrrkk..', '.krrwwwwrrk.', '.krwwrrwwrk.', 'krwwrrrrwwrk', 'krwrrkkrrwrk', 'krwrrkkrrwrk', 'krwwrrrrwwrk', '.krwwrrwwrk.', '.krrwwwwrrk.', '..kkrrrrkk..', '....kkkk....'],
  potion: ['....kkkk....', '....kbbk....', '.....kk.....', '....kcck....', '...kcccck...', '..kccccwck..', '.kccccccwck.', '.kcccccccck.', '.kllllllllk.', '.kllllllllk.', '..kllllllk..', '...kkkkkk...'],
  backpack: ['....kkkk....', '...kbkkbk...', '..kkkkkkkk..', '.kddddddddk.', '.kdbbbbbbdk.', '.kdbkyykbdk.', '.kdbbbbbbdk.', '.kddddddddk.', '.kdkkkkkkdk.', '.kddddddddk.', '.kddddddddk.', '.kkkkkkkkkk.'],
  logo: ['oooooooooooo', 'oooooooooyoo', 'oooookkoyyyo', 'ooookwwkoyoo', 'ooookwwkoooo', 'oookwwwwkooo', 'oookwkkwkooo', 'ookwwwwwwkoo', 'ookwkkkkwkoo', 'okwwkookwwko', 'okkkkookkkko', 'oooooooooooo'],
  alarm: ['.kk......kk.', 'kyyk....kyyk', '.kkkkkkkkkk.', '.krrrrrrrrk.', 'krwwwwwwwwrk', 'krwwwkwwwwrk', 'krwwwkwwwwrk', 'krwwwkkkwwrk', 'krwwwwwwwwrk', '.krrrrrrrrk.', '.kkkkkkkkkk.', '.kk......kk.'],
  swordsman: ['.............k..', '.....kkkkk..kwk.', '....kssssk..kwk.', '...kssssssk.kwk.', '...kkffffkk.kwk.', '...kfkffkfk.kwk.', '...kffffffk.kwk.', '....kkkkkk.kyyyk', '...kxxssxxk.kbk.', '..kxxxssxxxkfbk.', '..kxxxyyxxxk.bk.', '..ksxxxxxxsk....', '...kssssssk.....', '...kssk.kssk....', '...khhk.khhk....', '...kkkk.kkkk....'],
  fighter: ['................', '.....kkkkk......', '....kkkkkkk.....', '....kxxxxxxkx...', '....kffffffk.x..', '....kfkffkfk....', '....kffffffk....', '.....kkffkk.....', '..kkkwwwwwwkkk..', '.kffkwwkwwwkffk.', '.kffkwwwkwwkffk.', '..kkkkkkkkkkkk..', '....kwwwwwwk....', '...kwwwkkwwwk...', '...kffk..kffk...', '...kkkk..kkkk...'],
  archer: ['................', '.....kkkkk...k..', '....knnnnnk..kb.', '...knnnnnnnk..kb', '...knffffnk...kb', '...knkffknk...kb', '...knffffnk...kb', '....kkffkk....kb', '..kknnnnnnkk..kb', '.kfknnmmnnkwwwwk', '.kfknnnnnnk...kb', '..kknbbbbnk...kb', '....knnnnk...kb.', '....knkknk..kb..', '....kbkkbk......', '....kkkkkk......'],
  kelas: ['............', '.....kk.....', '...kkhhkk...', '.kkhhhhhhkk.', 'khhhhhhhhhhk', '.kkhhhhhhkky', '..khkkkkhk.y', '..khhhhhhk.y', '..khhhhhhk.y', '...kkkkkk.yy', '..........yy', '............'],
  belajar: ['............', '.kkk........', '.kgk.kkk....', '.kgk.kxk.kkk', '.kgk.kxk.klk', '.kwk.kwk.klk', '.kgk.kxk.klk', '.kgk.kxk.kwk', '.kgk.kxk.klk', '.kgk.kxk.klk', 'kkkkkkkkkkkk', '............'],
  kerja: ['............', '....kkkk....', '....k..k....', 'kkkkkkkkkkkk', 'kbbbbbbbbbbk', 'kbbbbbbbbbbk', 'kkkkkyykkkkk', 'kbbbbyybbbbk', 'kbbbbbbbbbbk', 'kbbbbbbbbbbk', 'kkkkkkkkkkkk', '............'],
  organisasi: ['.k..........', '.kkkkkkkkk..', '.kyyyyyyyyk.', '.kyyrryyyk..', '.kyrrrryyyk.', '.kyyrryyyk..', '.kyyyyyyyyk.', '.kkkkkkkkk..', '.k..........', '.k..........', '.k..........', 'kkk.........'],
  olahraga: ['............', '............', '.kk......kk.', 'kssk....kssk', 'kssk....kssk', 'ksskkkkkkssk', 'ksshhhhhhssk', 'ksskkkkkkssk', 'kssk....kssk', 'kssk....kssk', '.kk......kk.', '............'],
  lainnya: ['...kkkkkk...', '..kxxxxxxk..', '.kxxwxxxxxk.', '.kxwxxxxxxk.', '.kxxxxxxxxk.', '..kxxxxxxk..', '...kkkkkk...', '.....kk.....', '.....kk.....', '.....kk.....', '.....kk.....', '......k.....'],
  star: ['.....kk.....', '....kyyk....', '....kyyk....', 'kkkkkyykkkkk', 'kyyyyyyyyyyk', '.kyyyyyyyyk.', '..kyyyyyyk..', '..kyyyyyyk..', '.kyyykkyyyk.', '.kyyk..kyyk.', 'kyyk....kyyk', 'kkk......kkk'],
  door: ['..kkkkkkkk..', '..kbbbbbbk..', '..kbddddbk..', '..kbdbbdbk..', '..kbddddbk..', '..kbbbbbbk..', '..kbbbbybk..', '..kbddddbk..', '..kbdbbdbk..', '..kbddddbk..', '..kbbbbbbk..', 'kkkkkkkkkkkk'],
  profil: ['....kkkk....', '...kffffk...', '..kffffffk..', '..kfkffkfk..', '..kffffffk..', '...kffffk...', '....kkkk....', '..kkllllkk..', '.kllllllllk.', 'kllllllllllk', 'kllllllllllk', 'kkkkkkkkkkkk'],
  bell: ['.....kk.....', '....kyyk....', '...kyyyyk...', '..kyyyyyyk..', '..kyywyyyk..', '..kywyyyyk..', '..kyyyyyyk..', '.kyyyyyyyyk.', 'kyyyyyyyyyyk', 'kkkkkkkkkkkk', '....kook....', '.....kk.....'],
  lock: ['....kkkk....', '...kssssk...', '..ksk..ksk..', '..ksk..ksk..', '..ksk..ksk..', '.kkkkkkkkkk.', '.kyyyyyyyyk.', '.kyyykkyyyk.', '.kyyykkyyyk.', '.kyyyykyyyk.', '.kyyyyyyyyk.', '.kkkkkkkkkk.'],
  info: ['.kkkkkkkkkk.', 'kllllllllllk', 'kllllwwllllk', 'kllllwwllllk', 'kllllllllllk', 'klllwwwllllk', 'kllllwwllllk', 'kllllwwllllk', 'kllllwwllllk', 'klllwwwwlllk', 'kllllllllllk', '.kkkkkkkkkk.'],
} as const

export type PixelIconName = keyof typeof ICONS

export function PixelIcon({ name, size = 24 }: { name: PixelIconName; size?: number }) {
  const rows = ICONS[name]
  return (
    <svg width={size} height={size} viewBox={`0 0 ${rows[0].length} ${rows.length}`} shapeRendering="crispEdges" aria-hidden>
      {rows.flatMap((row, y) =>
        [...row].map((ch, x) => (PAL[ch] ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={PAL[ch]} /> : null)),
      )}
    </svg>
  )
}

export const navIcon = (name: PixelIconName) =>
  function NavPixelIcon({ size = 24 }: { size?: number }) {
    return <PixelIcon name={name} size={size} />
  }
