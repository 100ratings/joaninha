"""Refine the V148 corpus using independently attested Portuguese vocabulary.

Usage: python3 scripts/curate-palavras.py V148.TXT PTBR.TSV MORPHOBR_DIR [OUTPUT]
See PALAVRAS-LICENCAS.md for exact sources and licenses.
"""
from collections import Counter
from math import log2
from pathlib import Path
import re
import sys
import unicodedata

base, news_path, morph_path, *output = sys.argv[1:]
base_words = Path(base).read_text(encoding='utf-8').splitlines()
base_rank = {word: i for i, word in enumerate(base_words)}
pattern = re.compile(r'[a-zàáâãéêíóôõúüç]{3,16}')
def fold(word):
    return ''.join(c for c in unicodedata.normalize('NFD', word) if not unicodedata.combining(c))

# Prefer ordinary lexical words, not interjections, names, contractions,
# abbreviations, inappropriate surprises, or uncommon foreign tokens.
blocked = {fold(word) for word in '''chi xi etc zoofilia zoófilo zoofilo zoófila zoofila xii xiii xix xvi xxi xxx iii iv vi vii viii
homen manuel patrícia fernanda maria joão jesus choi greta luca olga nestor paloma fifi
rafa beto nico lila paco rosita lêo caim jeová hermes lázaro silva
uma mas sim não nao bem mais menos tem foi vai vou sou são sei sei mim nós nos dos das
des num numa nas aos uns umas pra pro pras pros sem com por que ora eis tal mals olá alô
oba opa uau tchau adeus ôpa tá tô tão lá ali aqui daí dai cadê cade eis
mijo mijar mija mijou mijei cuspe cuspir cuspo cospem sêmen seio seios teta tetas
pipi cueca calcinha pelada pelado peladas pelados tarado tarada tarados
sexo sexual sexy tesão nude nudes corno cornos corna cornas
idiota idiotas imbecil imbecis otário otária babaca patife vagabundo vagabunda
nazista nazistas nazismo terrorista terroristas terrorismo
matar matam matou matei matado mortes morto morta mortos mortas matarão matança matanca
sangue sangrenta sangrento sangrar tortura torturar suicídio suicida assassinato assassino
estupro estuprar estuprador guerra tiros tiro atirar armas arma drogas droga
gore techno bridge stress modus quo bureau corpus boxes plugue slide jingle zoom
fan fans lol okay okays blog blogs hashtag software hardware online offline
brasil chile líbia macau coreia afeganistão portugal frança inglaterra cuba
ia ias irás irei irá ides vós vos lhes lhe cuja cujo cujos cujas seus suas meu meus
minha minhas nosso nossa nossos nossas este esta estes estas isto isso aqui nele nela
dela dele deles delas delas disso disso daqui dessa desse desses dessas
'''.split()}
# Native orthography and lowercase attestations eliminate most proper names.
news = {}
for line in Path(news_path).read_text(encoding='utf-8-sig').splitlines()[1:]:
    word, frequency, tier = line.split('\t')
    if tier == 'correto' and pattern.fullmatch(word) and fold(word) not in blocked:
        news[word] = int(frequency)

candidate_set = set(news)
canonical = set()
recognized = set()
root = Path(morph_path)
for cat in ('nouns', 'adjectives', 'verbs', 'adverbs'):
    for file in sorted((root / cat).glob('*.dict')):
        for line in file.read_text(encoding='utf-8').splitlines():
            word, _, analysis = line.partition('\t')
            if word not in candidate_set or not analysis:
                continue
            lemma, *tags = analysis.split('+')
            if not lemma.islower() or not tags:
                continue
            recognized.add(word)
            if word == lemma or (tags[0] in ('N', 'A') and 'SG' in tags) or 'INF' in tags:
                canonical.add(word)
# Recent MorphoBr versions store productive verb lemmas separately.
for file in sorted((root / 'lexicon' / 'verbs').glob('*.tsv')):
    for word in file.read_text(encoding='utf-8').splitlines():
        if word in candidate_set:
            recognized.add(word)
            canonical.add(word)

# Every retained entry was already spelling-checked with VERO in V148,
# and is independently attested as correct in the news-based lexicon.
def score(word):
    rank = base_rank.get(word, len(base_words) * 2)
    # Combine everyday-use rank, independent frequency, and preference for
    # canonical nouns/adjectives/infinitives over conjugation-heavy forms.
    return news[word] - 6 * log2(rank + 2) + (28 if word in canonical else 10 if word in recognized else 0)

words = [w for w in base_words if w in news]
seen = {fold(w) for w in words}
# Preserve every formerly supported position/letter combination by adding
# only independently verified, lowercase dictionary entries when needed.
original = Counter((i, c) for w in base_words for i, c in enumerate(w[:9]))
counts = Counter((i, c) for w in words for i, c in enumerate(w[:9]))
# Supplement toward 60 when prior coverage is at least 40, so a small
# later curation does not leave a combination at the exact minimum.
needs = {key: min(60, old) for key, old in original.items()
         if old >= 40 and key[1] in 'abcdefghijklmnopqrstuvwxyz' and counts[key] < 40}
additions = []
extras = sorted((w for w in canonical if w not in base_rank and fold(w) not in seen),
                key=lambda w: (-score(w), len(w), w))
for key, minimum in sorted(needs.items()):
    i, letter = key
    for w in extras:
        if counts[key] >= minimum:
            break
        if len(w) <= i or w[i] != letter or fold(w) in seen:
            continue
        seen.add(fold(w)); words.append(w); additions.append(w)
        counts.update((j, c) for j, c in enumerate(w[:9]))
missing = [(key, old, counts[key]) for key, old in original.items()
           if old >= 40 and key[1] in 'abcdefghijklmnopqrstuvwxyz' and counts[key] < 40]
if missing:
    raise RuntimeError(f'Coverage regression: {missing}')
words.sort(key=lambda word: (-score(word), base_rank.get(word, len(base_words)*2), word))
if len({fold(w) for w in words}) != len(words):
    raise RuntimeError('Duplicate entries')
out = Path(output[0]) if output else Path(__file__).resolve().parent.parent / 'joaninha-palavras-ptbr.txt'
out.write_text('\n'.join(words) + '\n', encoding='utf-8')
print(f'{len(words)} words, {sum(len(w)<=6 for w in words)} short, {len(additions)} coverage additions')
print('Coverage additions:', ' '.join(additions))
