// Smart Faculty Photo Resolver for /public/assets/faculty/
// Automatically discovers any image files placed in /public/assets/faculty/
// and matches both "FIRST M. LAST.jpg" and "LAST, FIRST MIDDLE.jpg" naming formats.

const STATIC_FACULTY_PHOTO_FILES: string[] = [
  'Acloseba, Jerwin Rey.jpg',
  'Amor Dianne A. Carillo.jpg',
  'April Rose B. Carasca.jpg',
  'BOBBY T. PISCOS.jpg',
  'Balbastro, Darlin Jane T.jpg',
  'Bandala, Sitti Hermina O..jpg',
  'Barcela, Efraim A..jpg',
  'Bascon, Sheila L.jpg',
  'Batucan, Hannah Joy S.jpg',
  'Bianan, Ruther D.jpg',
  'Bilbao, Nanette D.jpg',
  'Bugarin, Odessa S..jpg',
  'CHRIZIA MAE A. MAGLANGIT.jpg',
  'Caba-ong, Mercy O.jpg',
  'Cabigas, Marjorey C.jpg',
  'Catungal, Mark Lester P..jpg',
  'Chrisnilu Sanlao.jpg',
  'Christopher L. Abanales.jpg',
  'Coleen Jean B. Templa.jpg',
  'Corpuz, Dexter Carl J..jpg',
  'DAYAHAN A. BUGAO.jpg',
  'DENNIS B. NAVAS.jpg',
  'DR. COLEEN GAY P. VILLEJO.jpg',
  'Dangasi, Shinie Kie A..jpg',
  'Dean Venus M. Avenido.jpg',
  'Dela Cruz, Elberth Rey O.jpg',
  'Dr. Aron Louie L. Paler.jpg',
  'Dr. Emelyn D. Tormes.jpg',
  'Dr. Id S. Palahang.jpg',
  'Dr. Jayboy M. Tizon.jpg',
  'Dr. Jeremias N. Perez.jpg',
  'Dr. Jerson B. Adlawon.jpg',
  'Dr. Joean Palahang.jpg',
  'Dr. Jonno E. Tan.jpg',
  'Dr. Julito V. Mandac, Jr..jpg',
  'Dr. Lina T. Codilla.jpg',
  'Dr. Maricar P. Rellon.jpg',
  'Dr. Myrna V. Ceño.jpg',
  'Dr. Nelmie P. Ponio.jpg',
  'Dr. Servillana M. Del Mundo.jpg',
  'Dr. Trinidad C. Abapo.jpg',
  'Dr. Zandra A. Quirante.jpg',
  'Dragon, Rojane M.jpg',
  'EDILBERTA G. NAPARAN.jpg',
  'ENGR. DEXCELL RAVE C. BAYOBAY.jpg',
  'ENGR. JOHNREN M. SIABOC.jpg',
  'ENGR. KENAN B. SAMSON.jpg',
  'ENGR. REYNA JOIE Q. REMOTIN.jpg',
  'ENGR. RODRIGO P. MILLARES.jpg',
  'ENGR. RYAN D. TABADA.jpg',
  'EVELYN R. CATHAG.jpg',
  'Edna Sumagang.jpg',
  'Engr. Jecar T. Dadole.jpg',
  'Engr. Perla A. Rivera.jpg',
  'Eunice Dale Dela Cruz.jpg',
  'Fe Manigos.jpg',
  'Fuentes, Mariecel A.jpg',
  'Gejazhylle P. Engaño.jpg',
  'Geraldine Rivera.jpg',
  'Gose, Dyamera L.jpg',
  'Gypsie Claudine F. Cafe.jpg',
  'Ivy M. Molina.jpg',
  'JIMUEL J. CABOG.jpg',
  'JOCELYN S. UNGANG.jpg',
  'Jean Rose C. Vanguardia.jpg',
  'Jelie R. Sudiang.jpg',
  'Jerry A. Redoblado.jpg',
  'Jezreel V. Verallo.jpg',
  'Jo-Ann R. Engaño.jpg',
  'Joe Michael J. Calanda.jpg',
  'Jovey P. Medina.jpg',
  'Juvie B. Sebial.jpg',
  'LHEZA N. ALBOLERAS.jpg',
  'LORITA P. ANDOT.jpg',
  'Lanelyn B. Nillas.jpg',
  'Liezel M. Caranto.jpg',
  'Lubon, Shienalie S..jpg',
  'MARC JORDAN C. SALADAGA.jpg',
  'MARK KENIDE B. BASTASA.jpg',
  'MARYJANE F. MARAÑAG.jpg',
  'Maeshille Omaña.jpg',
  'Magsayo, Janniece L..jpg',
  'Mangila, Benjamin B.jpg',
  'Mariah Leah S. Chiong.jpg',
  'Maribel M. Estioco.jpg',
  'Maricel Domosmog.jpg',
  'Martin, Jerry Philip P..jpg',
  'Marvin C. Mejorada.jpg',
  'Mori, Allen Day S.jpg',
  'Neri, Evelyn Joy D.jpg',
  'Nimshe Pastrano.jpg',
  'Norhan B. Kudarat.jpg',
  'Omar, Jaafar J..jpg',
  'Pabingwit, Fe.jpg',
  'Pepito, Rey S.jpg',
  'Perigo, Myrna P.jpg',
  'Perlaida Puno, RSW, MTSW.jpg',
  'Prof. Bautista, Joesila P..jpg',
  'Prof. Carlo Enrique D. Rule.jpg',
  'Prof. Medina, Ernest.jpg',
  'Prof. Merontos, Charmagne B..jpg',
  'Prof. Paradiang, Althea A..jpg',
  'Prof. Subiza, Lady Berlyn C..jpg',
  'Prof. Ybañez, Elsie S..jpg',
  'Prof. Zamora-Niez, Llanevie Azel V..jpg',
  'Quirante, Glady C..jpg',
  'ROEL R. MARAÑAG.jpg',
  'Ralph R. Magumpara.jpg',
  'Razel Fernandez Cebedo.jpg',
  'Regina Cuizon.jpg',
  'Rosemarie Silmeros.jpg',
  'Rovana Jawani.jpg',
  'Ruby Redoblado.jpg',
  'Salaguste, Khyrthz Marco C.jpg',
  'Sheera Mylen W. Luna, MAEd.jpg',
  'Taoto-an, Jumar B.jpg',
  'Unito, Gloria L.jpg',
  'Valderrama, Jackie J.jpg',
  'Wendel Ragusta, Jr..jpg',
  'ALUMBRO, ROSEHUR L..jpg',
  'BALATERO, MARIZA S..jpg',
  'BARRERA, JANET DE LARA.jpg',
  'BILBAO, RONETTE CHRIS D..jpg',
  'Bacalso, Jezreel G.jpg',
  'Buyco, Armando S.jpg',
  'CABAHUG, ABUNDIO JR G..jpg',
  'CALUNSAG, BUENA D..jpg',
  'CAW-IT, ALLAN Z..jpg',
  'CONOL, RHIVEE MAE H..jpg',
  'Cabilan, Winmarc C.jpg',
  'Chatto, Meliza J.jpg',
  'Chatto, Vincent.jpg',
  'Doño, Mary Juliet A.jpg',
  'Garnada, Vicpher D.jpg',
  'LUMOCAS, RICHARD P..jpg',
  'Lauron, Eric G.jpg',
  'MANDAYA, RHEA T..jpg',
  'Repaso, Janice.jpg',
  'TAGAYLO, PAULINO R..jpg',
  'TANGALIN, HARVEY M..jpg',
  'VILLAVER, JEFFREY P..jpg',
];

function getDiscoveredPhotoFiles(): string[] {
  const fileSet = new Set<string>(STATIC_FACULTY_PHOTO_FILES);
  try {
    const globbed = (import.meta as any).glob?.('/public/assets/faculty/*.*') || {};
    for (const fullPath of Object.keys(globbed)) {
      const fileName = fullPath.split('/').pop();
      if (fileName && /\.(jpg|jpeg|png|webp)$/i.test(fileName)) {
        fileSet.add(fileName);
      }
    }
  } catch {
    // Fallback to static list if import.meta.glob is unavailable in non-Vite context
  }
  return Array.from(fileSet);
}

function normalizeStr(s: string): string {
  return s
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\bshiela\b/g, 'sheila')
    .replace(/\breyna\b/g, 'rena')
    .replace(/\bmaeshille\b/g, 'maeshile')
    .replace(/\bmariah\s+leah\b/g, 'marialeah')
    .replace(/\bsheeria\b/g, 'sheera')
    .replace(/\bgejazhyhlle\b/g, 'gejazhylle')
    .replace(/\bacloseba\b/g, 'alcoseba')
    .replace(/\bzamora\s*-\s*niez\b/g, 'niez')
    .replace(/\bwinmarc\b/g, 'win marc')
    .replace(/[^a-z0-9,\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const SUFFIX_WORDS = new Set([
  'jr',
  'sr',
  'ii',
  'iii',
  'iv',
  'dr',
  'engr',
  'atty',
  'prof',
  'for',
  'dean',
  'rsw',
  'mtsw',
  'maed',
  'phd',
  'edd',
  'md',
  'rn',
  'cpa',
  'lpt',
]);

const COMPOUND_SURNAME_PREFIXES = new Set([
  'del',
  'dela',
  'de',
  'las',
  'los',
  'san',
  'sta',
  'tres',
]);

interface ParsedPersonName {
  lastName: string;
  givenTokens: string[];
  allTokens: string[];
}

function parseFacultyDbName(dbName: string): ParsedPersonName | null {
  if (!dbName || !dbName.trim()) return null;
  let raw = dbName
    .trim()
    .replace(/^set(?:\s+[a-z0-9]+)*\s*:\s*/i, '')
    // Strip leading academic/professional titles before surname or given name (e.g., "Prof. Bautista, Joesila P.")
    .replace(/^(?:(?:dr|prof|engr|atty|for|dean)\.?\s+)+/i, '')
    .replace(/\s*-\s*staff$/i, '')
    // Strip post-comma suffixes/credentials like ", Jr.", ", RSW, MTSW", ", MAEd"
    .replace(/\s*,\s*(?:jr\.?|sr\.?|ii|iii|iv|rsw|mtsw|maed|phd|ed\.?d|md|rn|cpa|lpt)(?:\s*,\s*[a-z.]+)*\.?$/i, '')
    // Fix DB entries where a period or space was typed instead of a comma after uppercase surname
    .replace(/^([A-ZÑ]{3,})\.\s+([A-ZÑ]{3,})/, '$1, $2')
    .replace(/^NIEZ\s+LLANEVIE/i, 'NIEZ, LLANEVIE')
    .trim();

  if (raw.includes(',')) {
    const parts = raw
      .split(',')
      .map((p) => normalizeStr(p))
      .filter(Boolean);
    if (parts.length === 0) return null;

    const lastName = parts[0].replace(/\s+/g, '');
    const restTokens = parts
      .slice(1)
      .join(' ')
      .split(' ')
      .map((t) => t.trim())
      .filter((t) => t.length > 1 && !SUFFIX_WORDS.has(t));

    return {
      lastName,
      givenTokens: restTokens,
      allTokens: [lastName, ...restTokens],
    };
  }

  const tokens = normalizeStr(raw)
    .split(' ')
    .filter((t) => t.length > 1 && !SUFFIX_WORDS.has(t));
  if (tokens.length === 0) return null;

  let lastName = tokens[tokens.length - 1];
  let givenTokens = tokens.slice(0, -1);

  if (tokens.length >= 3 && COMPOUND_SURNAME_PREFIXES.has(tokens[tokens.length - 2])) {
    lastName = tokens[tokens.length - 2] + tokens[tokens.length - 1];
    givenTokens = tokens.slice(0, -2);
  }

  return {
    lastName,
    givenTokens,
    allTokens: [lastName, ...givenTokens],
  };
}

function parsePhotoFileName(fileName: string): ParsedPersonName | null {
  const base = fileName
    .replace(/\.(jpg|jpeg|png|webp)$/i, '')
    .replace(/\s+\d+$/, '')
    .replace(/\s+copy$/i, '')
    .trim();

  if (!base) return null;

  // Ignore generic placeholder names like "A1", "B (1)", "55"
  if (/^\d+$/.test(base) || /^[a-z]\s*\(?\d+\)?$/i.test(base)) {
    return null;
  }

  return parseFacultyDbName(base);
}

export function resolveFacultyPhoto(facultyName?: string | null, explicitPhotoUrl?: string | null): string | undefined {
  if (explicitPhotoUrl && explicitPhotoUrl.trim()) {
    const trimmed = explicitPhotoUrl.trim();
    const driveMatch =
      trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]{15,})/) ||
      trimmed.match(/[?&]id=([a-zA-Z0-9_-]{15,})/);
    if (driveMatch) {
      return `https://lh3.googleusercontent.com/d/${driveMatch[1]}=w600`;
    }
    return trimmed;
  }

  if (!facultyName) return undefined;

  // Handle known married/maiden name alias in Form 2
  const normalizedInput = normalizeStr(facultyName);
  if (normalizedInput.includes('gejazhylle')) {
    return `/assets/faculty/${encodeURIComponent('Gejazhylle P. Engaño.jpg')}`;
  }

  const target = parseFacultyDbName(facultyName);
  if (!target || !target.lastName) return undefined;

  const files = getDiscoveredPhotoFiles();

  for (const fileName of files) {
    const parsedPhoto = parsePhotoFileName(fileName);
    if (!parsedPhoto) continue;

    // 1. Last name must match
    if (parsedPhoto.lastName !== target.lastName) continue;

    // 2. All given name tokens in the photo filename (which excludes 1-letter middle initials)
    // must appear in the faculty member's given name tokens
    if (parsedPhoto.givenTokens.length > 0 && target.givenTokens.length > 0) {
      const allGivenMatch = parsedPhoto.givenTokens.every((pt) =>
        target.givenTokens.some((tt) => tt === pt || tt.startsWith(pt) || pt.startsWith(tt))
      );
      if (allGivenMatch) {
        return `/assets/faculty/${encodeURIComponent(fileName)}`;
      }
    }
  }

  return undefined;
}
