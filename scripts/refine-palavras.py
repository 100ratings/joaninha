"""V151: refine V150 using everyday words, lexical frequency and morphological families.

Usage: python3 scripts/refine-palavras.py V150.TXT PTBR.TSV MORPHOBR_DIR [OUTPUT]
The text format keeps one word per line. A final #pool section contains optional
precomputed word indexes (ignored by older versions). See PALAVRAS-LICENCAS.md.
"""
from collections import Counter, defaultdict
from pathlib import Path
import json
import math
import re
import sys
import unicodedata

prior, news_path, morph_path, *output = sys.argv[1:]
here = Path(__file__).resolve().parent
pattern = re.compile(r'[a-zàáâãéêíóôõúüç]{3,16}')
def fold(s):
    return ''.join(c for c in unicodedata.normalize('NFD', s) if not unicodedata.combining(c))
old = [s for s in Path(prior).read_text(encoding='utf-8').splitlines() if pattern.fullmatch(s)]
old_rank = {w:i for i,w in enumerate(old)}
manual_input = (here/'palavras-curadoria-v151.txt').read_text(encoding='utf-8').splitlines()
manual = set(w for line in manual_input if not line.startswith('#') for w in line.split() if pattern.fullmatch(w))
# Explicit editorial exclusions, including abnormal spellings, Portugal-only forms,
# abbreviations, distractingly violent or sexual terms, and common-name tokens.
# The previous V150 filter is retained by default.
reject = set('''chi xi etc oque objectivo objectiva objectivos objectivas objecto objectos
gajo gajos gaja gajas equipa equipas autocarro autocarros autocaravana comboio comboios
apelido apelidos apelidar concubina concubinas cocô mijada mijadas mijo mijar mijou
cannabis canábis canabis arromba arrombam arrombar arrombou arrombado arrombada arrombados arrombadas arrombamento
baleado baleada baleados baleadas bandido bandidos bandida bandidas
extorquir extorsão estuprado estuprada mataram mataria matando matasse mataria
delinquente delinquentes terroristas terrorista pornográfico pornografia
upgrade upgrades chat chats fans fan online offline freeware password downloads download
bactéria bactérias bactériológico zoológico fode fodes fodem fodia fodido fodida fodidos
pornô pornôs merdas merdinha merdoso porras porradas porrada sacana sacanas sacanagem
sádico sádica sadismo retal mamilo mamilos carnal harém pedófilos pedófilas pedofilia
masturbação masturbar masturbei masturba masturbando orgasmos orgasmo orgasmos
prostitutas prostitutas prostituto prostitutas prostituída prostituição
vagina vaginas peniana peniano penianos prepúcio testículo testículos ânus SÊMEN
hein round rounds web webs software softwares bluetooth e-mail spam spams
play plays player players mousepad internetes upgrade upgrades fóssilzinho sector sectores secção secções contacto contactos contactar contactado
facto factos acção acções óptimo óptima óptimos óptimas adopção adopções
adoptado adoptada adoptar actividade actividades directo directa directos directas
director directora directores direcção direcções recepção recepções
gozo gozos libido haxixe haxixes transa transas transar transando transou sêmen semen
xixi xelins arrombando bolchevique bolcheviques maconha maconheiro maconheira
sacana sacanagem sacanas cafetão cafetina
backup backups boom drive drives game games hacker hackers laptop laptops layout layouts
habeas loco locos duma dumas single singles player players set sets
cancro cancros bunda bundas nudez fuzil fuzis míssil mísseis facada facadas
morreu morrer morrem morria morrendo morrido morreram falecer falecido
letal letalidade mortal mortalidade mortais óbito óbitos caixão caixões túmulo túmulos
motel motéis cabaré cabarés máfia mafioso mafiosa terror terrorismo
sugar sugou chupar chupou chupando chupado macabro macabra

'''.split())
# These legitimate words are merely deprioritized, not lost from coverage.
deprioritize = set('''urina urinar urinou urinando urinário urticária zoonose zoonoses
zoster zimbro zootecnista zonal zeladoria zoneamento zoada zoado zoando
pederneira ziguezague ucraniano ucraniana colombiano colombiana marroquino marroquina
placenta caxumba hanseníase placebo papila vértebra micróbio micróbios
assombração concubina soberba soberbo sucumbir sucumbiu sucumbindo
reivindicação macabro funerária falecido falecida falecidos
lhama lhamas tchauzinho tchau oque outrem desjejum'''.split())
# Do not mistakenly exclude legitimate concrete words with an ordinary additional sense.
reject.discard('apelido'); reject.discard('apelidos'); reject.discard('apelidar')
reject.discard('bactéria'); reject.discard('bactérias'); reject.discard('zoológico')
# Check lexical families of words that previous exact-token blocklists missed.
rejected_prefixes = ('merd','caralh','fod','porn','bucet','bocet','putari','masturb',
                     'prostitut','estupr','pedofil','pedófil','suicid','nazist','neonaz',
                     'assassin','genocid','homicid','terrorist','ejacul','orgasm','canabis','cannabis','arromb','mij','haxix')
def rejected(w):
    f=fold(w)
    return w in reject or any(f.startswith(prefix) for prefix in rejected_prefixes)
manual = {w for w in manual if not rejected(w)}
news = {}
for line in Path(news_path).read_text(encoding='utf-8-sig').splitlines()[1:]:
    w, f, tier = line.split('\t')
    if tier == 'correto' and pattern.fullmatch(w):
        news[w] = int(f)

root = Path(morph_path)
# Keep complete analyses for candidates and manually proposed additions only.
target = set(old)|manual
analysis = defaultdict(set)
for cat in ('nouns','adjectives','verbs','adverbs'):
    for file in sorted((root/cat).glob('*.dict')):
        with file.open(encoding='utf-8') as stream:
            for line in stream:
                word, _, raw = line.rstrip('\n').partition('\t')
                if word not in target: continue
                lemma,*tags = raw.split('+')
                if lemma.islower() and tags:
                    analysis[word].add((lemma,tuple(tags)))
verb_lemmas = set()
for p in sorted((root/'lexicon'/'verbs').glob('*.tsv')):
    verb_lemmas.update(p.read_text(encoding='utf-8').splitlines())
verb_lemmas.update(lemma for results in analysis.values() for lemma,tags in results if tags[0]=='V')
# Only recover manually chosen terms with independent lexicon/frequency backing.
# e.g. "lua", "flor", "rosa" were excluded by the exact news spelling filter.
valid_manual = {w for w in manual if w in old_rank or w in news or w in analysis or w in verb_lemmas}
print('Manually proposed:',len(manual),'verified:',len(valid_manual),'new:',len(valid_manual-set(old)))
print('Unverified (not added):',', '.join(sorted(manual-valid_manual)))
# Prefer manual orthographic forms such as coco (fruit) over cocô, preserve
# one surface form per unaccented spelling as in V150.
chosen = {}
for w in old:
    if not rejected(w):
        chosen[fold(w)] = w
for w in sorted(valid_manual,key=lambda w:(w not in old_rank, old_rank.get(w,999999),w)):
    k = fold(w)
    if k not in chosen or (chosen[k] not in valid_manual):
        chosen[k] = w
words = list(chosen.values())
base_counts = Counter((i,w[i]) for w in old for i in range(min(9,len(w))) if w[i] in 'abcdefghijklmnopqrstuvwxyz')
new_counts = Counter((i,w[i]) for w in words for i in range(min(9,len(w))) if w[i] in 'abcdefghijklmnopqrstuvwxyz')
# Never reintroduce a rejected term to rescue coverage: report a concrete regression.
missing = [(i+1,c,n,new_counts[i,c]) for (i,c),n in base_counts.items() if n>=40 and new_counts[i,c]<40]
if missing:
    raise ValueError(f'Coverage regression {missing}')

# Recognize productive conjugations not expanded in MorphoBr's .dict files.
# Group only when a corresponding infinitive is actually present in the lexicon.
# Sorted longer suffixes first, with conservative transformations.
endings = {
 'ar': ('ávamos','aram','ariam','aremos','assem','ássemos','ando','adas','ados','ada','ado','aria','arei','ares','aram','asse','aste','avam','avas','ava','ará','arão','arem','armos','am','em','ei','ou','as','es','a','e','o'),
 'er': ('íamos','eram','eriam','eremos','essem','endo','idas','idos','ida','ido','eria','erei','eres','esse','este','iam','ias','ia','erá','erão','erem','ermos','em','am','eu','es','as','e','a','o','i'),
 'ir': ('íamos','iram','iriam','iremos','issem','indo','idas','idos','ida','ido','iria','irei','ires','isse','iste','iam','ias','ia','irá','irão','irem','irmos','em','am','iu','es','as','e','a','o','i'),
}
# Manual semantic exceptions that are important familiar nouns in their own right.
lexical_nouns = valid_manual - {w for w in valid_manual if w in verb_lemmas}
def inferred_verb(w):
    results = []
    for inf,suffixes in endings.items():
        for suffix in suffixes:
            if len(w)-len(suffix)<2 or not w.endswith(suffix): continue
            stem = w[:-len(suffix)]
            trials = [stem+inf]
            if stem.endswith('qu'): trials.append(stem[:-2]+'c'+inf)
            if stem.endswith('gu'): trials.append(stem[:-2]+'g'+inf)
            if stem.endswith('ç'): trials.append(stem[:-1]+'c'+inf)
            if stem.endswith('j'): trials.append(stem[:-1]+'g'+inf)
            for lemma in trials:
                if lemma in verb_lemmas:
                    results.append((len(suffix),news.get(lemma,0),lemma))
    return max(results,default=(0,0,None))[2]

def lexical(w):
    xs = analysis.get(w,set())
    ns = [(lemma,tags) for lemma,tags in xs if tags[0] in ('N','A')]
    vs = [(lemma,tags) for lemma,tags in xs if tags[0]=='V']
    # Plural/gender alternatives share a noun/adjective lemma. Prefer a
    # masculine or common lemma when the lexicon attests both forms.
    if ns:
        canonical = [(l,t) for l,t in ns if l == w and ('PL' not in t)]
        alternatives = [(l,t) for l,t in ns if l!=w and (l in old_rank or l in valid_manual)]
        # Human-known distinct concrete items (e.g. "manga") remain nouns.
        # Gender variants of the same term are still grouped.
        adj_alt = [(l,t) for l,t in alternatives if t[0]=='A' and 'F' in t]
        noun_alt = [(l,t) for l,t in alternatives if t[0]=='N' and ('PL' in t or 'F' in t)]
        opts = adj_alt or noun_alt
        if opts:
            lemma,tags = max(opts,key=lambda lt:(news.get(lt[0],0),-old_rank.get(lt[0],999999),lt[0]))
            return fold(lemma),'variant'
        if canonical and w not in verb_lemmas:
            # Participles often have noun/adjective entries too. Group them
            # with the attested verb, except when an ordinary noun is explicit.
            if w not in lexical_nouns and w.endswith(('ado','ada','ido','ida','ados','adas','idos','idas')):
                verb = inferred_verb(w)
                if verb: return fold(verb),'conjugation'
            cls = 'noun' if any(t[0]=='N' for l,t in canonical) else 'adjective'
            return fold(w),cls
    if w in verb_lemmas:
        return fold(w),'infinitive'
    if vs:
        lemma,tags = max(vs,key=lambda lt:(news.get(lt[0],0),-old_rank.get(lt[0],999999),lt[0]))
        return fold(lemma),'conjugation'
    if ns:
        lemma,tags = max(ns,key=lambda lt:(news.get(lt[0],0),-old_rank.get(lt[0],999999),lt[0]))
        return fold(lemma),'variant' if w!=lemma else 'noun'
    if any(t[0]=='ADV' for l,t in xs): return fold(w),'adverb'
    verb = inferred_verb(w)
    if verb: return fold(verb),'conjugation'
    if w in valid_manual: return fold(w),'noun'
    # When a productive plural has a verified singular, treat both as a family.
    suffix_rules = [('ões','ão'),('ães','ão'),('ais','al'),('éis','el'),('eis','el'),
                    ('óis','ol'),('uis','ul'),('ns','m'),('res','r'),('zes','z'),('s','')]
    for ending,replacement in suffix_rules:
        if w.endswith(ending):
            sing=w[:-len(ending)]+replacement
            if sing in target and (sing in analysis or sing in valid_manual):
                return fold(sing),'variant'
    return fold(w),'other'

# Prefer nouns and plain adjectives; avoid a flood of conjugated verbs.
# V150 rank already combines everyday subtitles and the independent news corpus.
# Manual verified concrete items gain a strong priority, even if less frequent.
type_bonus = {'noun':28,'adjective':22,'infinitive':8,'adverb':0,
              'variant':-14,'conjugation':-32,'other':-25}
family,kind,score = {},{},{}
linked = {
    'ajuda':'ajudar','ajudante':'ajudar','ajudinha':'ajudar',
    'ajuste':'ajustar','ajustável':'ajustar','ajeite':'ajeitar','ajeitado':'ajeitar','ajeitada':'ajeitar',
    'olho':'olhar','olhos':'olhar','olhada':'olhar','olhadinha':'olhar','olhares':'olhar',
    'achado':'achar','achada':'achar','achados':'achar','achadas':'achar',
    'ejetor':'ejetar','ejeção':'ejetar','ejetado':'ejetar','ejetada':'ejetar',
    'equipamento':'equipar','equipado':'equipar','equipada':'equipar',
    'aquecedor':'aquecer','aquecimento':'aquecer','aquecido':'aquecer','aquecida':'aquecer',
    'planejo':'planejar','planejamento':'planejar','planejador':'planejar',
    'arranjo':'arranjar','arranjos':'arranjar','arranjado':'arranjar',
    'escritura':'escrever','escrita':'escrever','escrito':'escrever',
    'desejo':'desejar','desejos':'desejar','desejado':'desejar','desejada':'desejar',
    'despejo':'despejar','despejado':'despejar','despejada':'despejar',
    'zombaria':'zombar','zomba':'zombar',
    'xingamento':'xingar','xingo':'xingar','xingado':'xingar','xinga':'xingar'
}
for w in words:
    fam,cat = lexical(w)
    fam=fold(linked[w]) if w in linked else fam
    family[w] = fam; kind[w] = cat
    value = (news.get(w,55) * .60 - 5.5*math.log2(old_rank.get(w,25000)+2)
             + type_bonus[cat]+(55 if w in valid_manual else 0)
             - (55 if w in deprioritize else 0) + 3*max(0,6-len(w)))
    # Short familiar forms are easy to write; accents remain valid Portuguese.
    score[w] = value
def ranked(arr):
    return sorted(arr,key=lambda w:(-score[w],len(w),old_rank.get(w,999999),w))

# Choose one form of each family before taking second forms. Short words win;
# longer ones are called upon only for deficient combinations, as in V150.
# A healthy position pool needs enough choices to avoid visible repetition.
def diverse(arr, limit, counts=None):
    counts = Counter() if counts is None else counts.copy()
    remain = ranked(arr)
    result = []
    while remain and len(result)<limit:
        minimum = min(counts[family[w]] for w in remain)
        next_remain=[]
        for w in remain:
            if len(result)<limit and counts[family[w]]==minimum:
                result.append(w); counts[family[w]]+=1
            else: next_remain.append(w)
        remain=next_remain
    return result

def make_pool(all_words,p,ordinary):
    minimum = max(3,p)
    short_max=max(6,minimum)
    short=[w for w in all_words if minimum<=len(w)<=short_max]
    if ordinary:
        # Thousands of distinct choices, still enough to look like 10,000.
        limit=2600 if p<6 else 1400 if p==6 else 2000
        # One form per family first, then more only to reach a useful variety.
        best=diverse(short,limit)
        if len(best)>=120: return best
    else:
        # Use no more than one form per family if at least 120 short families
        # are available. This keeps common-letter phases especially natural.
        short_families=len({family[w] for w in short})
        goal=min(360,max(120,short_families))
        best=diverse(short,goal)
        if len(best)>=120: return best
    # Need more rows to preserve existing coverage and avoid tight repetition.
    # Use the shortest admissible longer words, favoring different roots.
    desired=120
    longer=[w for w in all_words if len(w)>short_max]
    counts=Counter(family[w] for w in best)
    lengths=sorted({len(w) for w in longer})
    remaining=set(longer)
    def add_length_range(length_range):
        # First single representative per family throughout these lengths.
        for n in length_range:
            for w in ranked(w for w in remaining if len(w)==n):
                if len(best)>=desired: return
                if counts[family[w]]==0:
                    best.append(w); counts[family[w]]+=1; remaining.remove(w)
        # Preserve brevity rather than reaching for an unnecessarily long form.
        for n in length_range:
            chosen=diverse([w for w in remaining if len(w)==n],desired-len(best),counts)
            best.extend(chosen); counts.update(family[w] for w in chosen)
            remaining.difference_update(chosen)
            if len(best)>=desired: return
    short_extra=[n for n in lengths if n<=short_max+3]
    add_length_range(short_extra)
    if len(best)<desired:
        for n in lengths:
            if n<=short_max+3: continue
            add_length_range([n])
            if len(best)>=desired: break
    return best

pools={}
for p in range(10):
    pools[f'g{p}']=make_pool(words,p,True)
    if p==0: continue
    for c in 'abcdefghijklmnopqrstuvwxyz':
        eligible=[w for w in words if len(w)>=p and w[p-1]==c]
        if len(eligible)>=40: pools[f'{p}{c}']=make_pool(eligible,p,False)
# Validate before packaging.
for (i,c),n in base_counts.items():
    if n>=40:
        pool=pools[f'{i+1}{c}']
        assert len(pool)>=40, (i,c,len(pool))
        assert all(w[i]==c for w in pool)
for k,pool in pools.items():
    assert len(pool)==len(set(pool)) and all(w in family for w in pool),k
# Store sorted plain corpus and compact zero-based indexes, not repeated words.
words=ranked(words)
index={w:i for i,w in enumerate(words)}
alphabet='0123456789abcdefghijklmnopqrstuvwxyz'
def encode_index(i):
    assert 0<=i<36**3
    return alphabet[i//1296]+alphabet[(i//36)%36]+alphabet[i%36]
result='\n'.join(words)+'\n'
result+='\n'.join('#pool '+key+' '+''.join(encode_index(index[w]) for w in pool) for key,pool in sorted(pools.items()))+'\n' 
repeated_families=set()
for pool in pools.values():
    repeated_families.update(fam for fam,count in Counter(family[w] for w in pool).items() if count>1)
groups=defaultdict(list)
for w in words:
    if family[w] in repeated_families: groups[family[w]].append(index[w])
result+='\n'.join('#family '+''.join(encode_index(i) for i in group) for fam,group in sorted(groups.items()) if len(group)>1)+'\n' 
out = Path(output[0]) if output else here.parent/'joaninha-palavras-ptbr.txt'
out.write_text(result,encoding='utf-8')
print('Corpus',len(words),'short',sum(len(w)<=6 for w in words),'pools',len(pools),'supported',len(pools)-10)
print('Added:',len(set(words)-set(old)),'removed:',len(set(old)-set(words)))
# Audit against V150's exact previous selection policy using the same lexical
# analyzer in both versions, so improvements in diversity are measurable.
def old_pool(arr,p,ordinary=False):
    min_len=max(3,p); short_max=max(6,min_len)
    short=[w for w in arr if min_len<=len(w)<=short_max][:4000 if ordinary else 480]
    return short+sorted([w for w in arr if len(w)>short_max],key=len)[:max(0,120-len(short))]
def describe(pool):
    f=[]; classes=[]
    for w in pool:
        if w in family: fam,cat=family[w],kind[w]
        else:
            fam,cat=lexical(w)
            if w in linked: fam=fold(linked[w])
        f.append(fam); classes.append(cat)
    return len(set(f)),sum(c=='conjugation' for c in classes),sum(c=='variant' for c in classes)
old_general=old_pool(old,0,True)
print('General V150 size/families/conjugations/variants:',len(old_general),*describe(old_general))
print('General V151 size/families/conjugations/variants:',len(pools['g0']),*describe(pools['g0']))
old_phases=[]; new_phases=[]
for (i,c),n in base_counts.items():
    if n>=40 and i<6:
        prev=old_pool([w for w in old if len(w)>i and w[i]==c],i+1)
        current=pools[f'{i+1}{c}']
        old_phases.append((len(prev),*describe(prev))); new_phases.append((len(current),*describe(current)))
for label,rows in [('V150',old_phases),('V151',new_phases)]:
    print(label,'position 1-6 average unique-family share, conjugation share:',
          round(sum(f/n for n,f,c,v in rows)/len(rows)*100,1),
          round(sum(c/n for n,f,c,v in rows)/len(rows)*100,1))
# The JSON report is a temporary review tool, not a deployed asset.
report={k:{'words':v,'families':len({family[w] for w in v}),'forms':dict(Counter(kind[w] for w in v)),
           'short':sum(len(w)<=6 for w in v),'lengths':dict(Counter(len(w) for w in v))} for k,v in pools.items()}
if output: (out.parent/'v151-review.json').write_text(json.dumps(report,ensure_ascii=False,indent=1),encoding='utf-8')
