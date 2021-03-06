import re
import codecs
import polib
# polib is easy_installable from pypi!

_db_findre = re.compile("""^([A-Z0-9_-]+)[\.=](.*)""")
_db_scopere = re.compile("^[A-Z0-9_-]+?.scope=\"(.*)\"")
_js_findre = re.compile("""^ui_strings.(\w*?)\s*=\s*['"](.*)['"]""")
_js_concatere = re.compile("""\s*?['"](.*)['"]""")
_po_tpl="""%(jsname)s=-1
%(jsname)s.caption="%(msgstr)s"
%(jsname)s.scope="dragonfly"
%(jsname)s.description="%(desc)s"
"""

def _db_block_reader(path):
    fp = open(path)
    curid = None
    curlines = []
    
    for line in fp:
        m = _db_findre.search(line)
        if m:
            id = m.groups()[0]
            if id == curid:
                curlines.append(line)
            else:
                if curlines: yield curlines
                curlines = [line]
                curid = id

    if curlines: yield curlines

def _db_parser(path):
    for block in _db_block_reader(path):
        name = _db_findre.search(block[0]).groups()[0]
        scopes=[]
        for line in block:
            m = _db_scopere.search(line)
            if m: scopes.extend(m.groups()[0].split(","))
        yield {"jsname": name, "scope": scopes}

def _po_block_reader(path):
    """Yield blocks of text from a po file at path. Blocks are delimited by a
    newline"""
    fp = codecs.open(path, "r", encoding="utf-8")
    curblock = []
    for line in fp:
        if line.isspace() and curblock:
            yield curblock
            curblock = []
        else:
            curblock.append(line.strip())
    if curblock: yield curblock
    
def _po_parser(path):
    """Generator that yields dicts containing parsed po data from file at
    path."""
    for block in _po_block_reader(path):
        entry = {}
        for line in block:
            if line.startswith("#. Scope: "):
                entry["scope"] = line[10:].split(",")
            elif line.startswith("#. "):
                if not "desc" in entry: entry["desc"] = line[3:]
                else: entry["desc"] += line[2:]
            elif line.startswith("#: "):
                cpos = line.rfind(":", 2)
                if cpos != -1: entry["jsname"] = line[3:cpos]
                else: entry["jsname"] = line[3:]
            elif line.startswith("msgid"):
                pos = line.index("::")
                entry["msgid"] = line[6:pos]
                entry["idstring"] = line[pos:-1]
            elif line.startswith("msgstr"):
                entry["msgstr"] = line[8:-1]
        if "jsname" in entry and "msgstr" in entry:
            if entry["msgstr"]  == "":
                entry["msgstr"] = entry["msgid"]
            yield entry

def _js_block_reader(path):
    fp = open(path)
    curblock = []
    for line in fp:
        if line.startswith("/* DESC: "):
            if curblock: yield curblock
            curblock=[line.strip()]
        elif not line.strip() and curblock:
            yield curblock
            curblock=[]
            
        elif curblock:
            curblock.append(line.strip())
    if curblock: yield curblock

def _js_parser(path):
    for block in _js_block_reader(path):
        desc = ""
        jsname = ""
        msgstr = []
        for line in block:
            if line.startswith("/* DESC:"):
                desc = line.strip()[8:-2].strip()
            elif line.startswith("ui_strings."):
                m = _js_findre.search(line)
                if m:
                    jsname = m.groups()[0]
                    msgstr.append(m.groups()[1])
            else:
                m = _js_concatere.search(line)
                if m: msgstr.append(m.groups()[0])
                
        if desc and jsname:
            yield { "msgstr": "".join(msgstr), "jsname": jsname, "desc": desc}
            desc = ""
            jsname = ""
            msgstr = []

    if desc and jsname:
        yield { "msgstr": "".join(msgstr), "jsname": jsname, "desc": desc}

def make_po_entry(str):
    return _po_tpl % str

def get_db_strings(path):
    "return a list of string dicts taken from db file at path"
    return list(_db_parser(path))

def get_po_strings(path):
    """polib does the heavy lifting in parsing, but we need to extract stuff
    from comments etc."""
    pofile = polib.pofile(path)
    ret = []
    for e in pofile:
        if not e.occurrences: continue
        cur = {
            "desc": u"",
            "jsname": e.occurrences[0][0].decode(e.encoding),
            "msgstr": (e.msgstr or e.msgid).replace("\n", "\\n"),
            "scope": []
        }
        if e.comment:
            lines = set([l for l in e.comment.split("\n")])
            commentlines = set([l[7:] for l in lines if l.startswith("Scope: ")])
            cur["scope"] = ",".join(commentlines).split(",")
            lines = lines - commentlines
            cur["desc"] = u"\\n".join(lines)
        ret.append(cur)
    return ret

def get_po_strings_old(path):
    """return a list of string dicts taken from po file at path.
    Deprecated. New version is using polib module"""
    return list(_po_parser(path))

def get_js_strings(path):
    "return a list of string dicts taken from js file at path"
    return list(_js_parser(path))

def get_db_version(path):
    "return db file version as string from db files at path"
    fp = open(path)
    for line in fp:
        if line.startswith("@dbversion"): return line.strip()[11:]
    return "unknown"

def get_strings_with_bad_escaping(strings):
    """Find strings that contain quotes that are not escaped
    The string 'hello "world"' is not allowed, the string
    'hello \\"world\\"' is fine, since the string will remain properly
    escaped when stuck into a js file
    """
    quotere = re.compile(r"[^\\]\"")
    return [e for e in strings if quotere.findall(e)]

def get_strings_with_bad_format(strings):
    """Finds strings where the "s" is missing in replacement tokens, such
    as "%(foo)s" has been changed to "%(foo)" """
    formatre = re.compile(r"%\(.*?\)[^s]")
    return [e for e in strings if formatre.findall(e)]



