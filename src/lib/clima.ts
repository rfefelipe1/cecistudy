// Consulta de clima interna — só para escolher a arte do cecinho na Home.
// Nunca exibe temperatura nem qualquer indicativo de clima ao usuário.
// Open-Meteo é gratuito e não requer chave de API (open-meteo.com/en/docs).
//
// Coordenadas fixas de Salvador, BA (o mascote deve refletir o tempo de
// Salvador, não de qualquer outra cidade): não pedimos permissão de
// localização ao usuário, que seria um indicativo visível e desnecessário
// para esta finalidade interna.

const SALVADOR_BA = { latitude: -12.9714, longitude: -38.5013 };

// Códigos WMO que indicam chuva (garoa, chuva, aguaceiros, tempestade).
const CODIGOS_CHUVA = new Set([
  51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99,
]);

interface ClimaAtual {
  weathercode: number;
}

let cache: { chuva: boolean; expiraEm: number } | null = null;

/** Somente para testes: limpa o cache de clima entre casos. */
export function __resetClimaCache(): void {
  cache = null;
}

/**
 * Diz se está chovendo agora nas coordenadas informadas (padrão: São Paulo).
 * Falha silenciosa: sem rede ou API fora do ar retorna `false` e a Home
 * segue com o comportamento normal (arte por turno/dia).
 */
export async function estaChovendo(
  latitude = SALVADOR_BA.latitude,
  longitude = SALVADOR_BA.longitude,
): Promise<boolean> {
  const agora = Date.now();
  if (cache && agora < cache.expiraEm) return cache.chuva;

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('open-meteo indisponível');
    const data = (await res.json()) as { current_weather?: ClimaAtual };
    const codigo = data.current_weather?.weathercode;
    const chuva = codigo !== undefined && CODIGOS_CHUVA.has(codigo);
    cache = { chuva, expiraEm: agora + 60 * 60 * 1000 }; // 1 hora
    return chuva;
  } catch {
    return false;
  }
}
