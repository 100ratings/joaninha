"""Build the Brazilian Portuguese corpus from licensed frequency data and VERO.
Usage: python3 scripts/build-palavras.py PT_BR_50K.TXT PT_BR.AFF PT_BR.DIC [blocklist]
The output is a filtered derivative of FrequencyWords (CC BY-SA 4.0).
"""
import ctypes
import re
import sys
import unicodedata
from pathlib import Path

freq, aff, dic, *extra = sys.argv[1:]
lib = ctypes.CDLL('libhunspell-1.7.so.0')
lib.Hunspell_create.argtypes = [ctypes.c_char_p, ctypes.c_char_p]
lib.Hunspell_create.restype = ctypes.c_void_p
lib.Hunspell_spell.argtypes = [ctypes.c_void_p, ctypes.c_char_p]
lib.Hunspell_spell.restype = ctypes.c_int
lib.Hunspell_destroy.argtypes = [ctypes.c_void_p]
h = lib.Hunspell_create(aff.encode(), dic.encode())
if not h:
    raise RuntimeError('Dicionário indisponível')

def fold(word):
    return ''.join(c for c in unicodedata.normalize('NFD', word.lower()) if not unicodedata.combining(c))

blocked = set('''porra merda caralho puta putas puto putos bosta foda foder fodido fodida fodeu fodase
 buceta boceta bucetas bocetas cu cus pau pica pinto pintos cacete cacetes caceta filho puta
 vagabunda vagabundas vagabundo vagabundos fdp pqp pênis penis vagina vaginas ânus anus
 estupro estupros estuprar estuprador estupradores pedofilia pedófilo pedofilo pedofilos
 incesto pornografia pornográfico pornografico pornô porno prostituta prostitutas prostituição
 prostituicao camisinha camisinhas nude nudes masturbação masturbacao masturbar orgasmo orgasmos
 tesão tesao gozar gozada gozado ejaculação ejaculacao ejacular ereção erecao
 viado viados veado veados sapatão sapatao sapatona traveco travesti desgraçado desgracado
 desgraçada desgracada idiota idiotas otário otario otaria otária imbecil imbecis babaca babacas
 nazista nazistas nazismo hitler suicídio suicidio suicida suicidas homicidio homicídio
 assassino assassinos assassina assassinas assassinato assassinatos matar matança matanca
 violência violencia violento violentos violentas tortura torturas torturar sangue sangrento
 morte mortes morto morta mortos mortas morrer guerra guerras arma armas cadáver cadaver cadáveres
 câncer cancer sida aids aids aborto abortos drogas droga cocaína cocaina heroína heroina
 crack maconha traficante tráfico trafico'''.split())
if extra:
    blocked.update(Path(extra[0]).read_text(encoding='utf-8').splitlines())
blocked = {fold(w.strip()) for w in blocked if w.strip()}
function_words = set('''que não nao você voce com por ele ela eles elas isso isto esse essa esses essas
 aqui ali lá la meu meus minha minhas seu seus sua suas muito muita muitos muitas tudo nada
 então entao agora assim até ate ainda também tambem tão tao nem todo toda todos todas
 qual quais quem quanto quanta quantos quantas porque qual qualquer outro outra outros outras
 lhe lhes nosso nossa nossos nossas daqui nisso desse dessa desses dessas nele nela dele dela deles delas
 para pelas pelos pelo pela perante após apos sob sobre entre desde como onde quando'''.split())
blocked.update(fold(w) for w in function_words)
words = []
seen = set()
for line in Path(freq).read_text(encoding='utf-8-sig').splitlines():
    word, frequency = line.rsplit(' ', 1)
    if not re.fullmatch(r'[a-zàáâãéêíóôõúüç]{3,16}', word):
        continue
    n = fold(word)
    if n in blocked or n in seen or not lib.Hunspell_spell(h, word.encode()):
        continue
    seen.add(n)
    words.append(word)
lib.Hunspell_destroy(h)
# Keep recognizable, comparatively frequent words, but retain wider coverage for rare positions.
words = words[:28000]
out = Path(__file__).resolve().parent.parent / 'joaninha-palavras-ptbr.txt'
out.write_text('\n'.join(words) + '\n', encoding='utf-8')
print(f'{len(words)} words written')
