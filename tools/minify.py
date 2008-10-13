import types
import sys
import shutil
import codecs
import StringIO

class JSTolkenizer(object):    

    WHITESPACE = (u'\u0009',u'\u000B',u'\u000C',u'\u0020',u'\u00A0')
    LINETERMINATOR = (u'\u000A',u'\u000D',u'\u2028',u'\u2029')
    NUMBER = ('0','1','2','3','4','5','6','7','8','9')
    PUNCTUATOR = ('{','}','(',')','[',']',';',',','<','>','=','!','+','-','*','%','&','|','^','~','?',':','.')
    PUNCTUATOR_2 = ('=','+','-','<','>','&','|')
    STRING_DELIMITER = ('"', '\'')
    HEX_NUMBER = ('0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f','A','B','C','D','E','F')
    REG_EXP_FLAG = ('g','i','m')
    PUNCTUATOR_DIV_PREDECESSOR = (')',']')
    STRING_WHITESPACE = 'WHITESPACE'
    STRING_LINETERMINATOR = 'LINETERMINATOR'
    STRING_IDENTIFIER = 'IDENTIFIER'
    STRING_PUNCTUATOR = 'PUNCTUATOR'
    STRING_DIV_PUNCTUATOR = 'DIV_PUNCTUATOR'
    STRING_NUMBER = 'NUMBER'
    STRING_STRING = 'STRING'
    STRING_REG_EXP = 'REG_EXP'
    STRING_COMMENT = 'COMMENT'
    STRING_KEYWORD = 'KEYWORD'
    KEYWORDS = \
    [
        'break', 'else', 'new', 'var', 'case', 'finally',
        'return', 'void', 'catch', 'for', 'switch', 'while',
        'continue', 'function', 'this', 'with', 'default',
        'if', 'throw', 'delete', 'in', 'try', 'do', 'instanceof',
        'typeof', 'abstract', 'enum', 'int', 'short', 'boolean',
        'export', 'interface', 'static', 'byte', 'extends', 'long',
        'super', 'char', 'final', 'native', 'synchronized',
        'class', 'float', 'package', 'throws', 'const', 'goto',
        'private', 'transient', 'debugger', 'implements',
        'protected', 'volatile', 'double', 'import', 'public'
    ]
    
    def __init__(self, tolken_handler):
        """ tolken_handler must have an input and an ontolken and onfinish handler """
        self.__str = str
        self.__input = tolken_handler.input
        self.__tolken_handler = tolken_handler
        self.__input_str = self.next_char()
        self.__tolkens = []
        self.__previous_value = ''
        self.__type = ''
        self.__string_delimiter = ''
        self.__char = ''
        self.__buffer = ''
        self.__previous_type = ''
        self.__input.seek(0)
        try:
            self.__input_str.next()
            self.default_parser()
        except:
            self.read_buffer('')
            self.__tolken_handler.onfinish()
          
    def next_char(self):
        while True:
            self.__buffer += self.__char
            self.__char = self.__input.read(1)
            if len(self.__char) == 0:
                raise StopIteration
            yield 
        
    def read_buffer(self, next_type):
        if self.__buffer:
            if self.__type == self.STRING_IDENTIFIER and self.__buffer in self.KEYWORDS:
                self.__tolken_handler.ontolken((self.STRING_KEYWORD, self.__buffer))
            else:
                self.__tolken_handler.ontolken((self.__type, self.__buffer))
            if not self.__type == self.STRING_WHITESPACE:
                self.__previous_type = self.__type
            self.__previous_value = ( self.__type == self.STRING_PUNCTUATOR ) and self.__buffer \
                or ( self.__type == self.STRING_WHITESPACE ) and self.__previous_value \
                or ''
        self.__buffer = ''
        self.__type = next_type
        
    def default_parser (self):
        while True:
            if self.__char in self.WHITESPACE:
                self.read_buffer(self.STRING_WHITESPACE)
                self.__input_str.next()
                while self.__char in self.WHITESPACE:
                    self.__input_str.next()
                self.read_buffer(self.STRING_IDENTIFIER);
            if self.__char in self.LINETERMINATOR:
                self.read_buffer(self.STRING_LINETERMINATOR)
                self.__input_str.next()
                while self.__char in self.LINETERMINATOR:
                    self.__input_str.next()
                self.read_buffer(self.STRING_IDENTIFIER)
                continue;
            if self.__char in self.NUMBER:
                self.read_buffer(self.STRING_NUMBER)
                self.__input_str.next()
                if self.__char == 'x' or self.__char == 'X':
                    self.__input_str.next()
                    self.number_hex_parser()
                else:
                  self.number_dec_parser()
                self.read_buffer(self.STRING_IDENTIFIER)
                continue
            if self.__char in self.STRING_DELIMITER:
                self.read_buffer(self.STRING_STRING)
                self.__string_delimiter = self.__char
                self.__input_str.next()
                self.string_parser()
                self.read_buffer(self.STRING_IDENTIFIER)
                continue
            if self.__char == '.' or self.__char == '+' or self.__char == '-':
                self.read_buffer(self.STRING_PUNCTUATOR)
                self.__input_str.next()
                if self.__char in self.NUMBER:
                    self.__type = self.STRING_NUMBER
                    self.number_dec_parser()
                else:
                    while self.__char in self.PUNCTUATOR_2:
                        self.__input_str.next()
                self.read_buffer(self.STRING_IDENTIFIER)
                continue
            if self.__char in self.PUNCTUATOR:
                self.read_buffer(self.STRING_PUNCTUATOR)
                self.__input_str.next()
                while self.__char in self.PUNCTUATOR_2:
                    self.__input_str.next()
                self.__previous_value = self.__buffer
                self.read_buffer(self.STRING_IDENTIFIER)
                continue
            if self.__char == '/': 
                self.read_buffer(self.STRING_COMMENT)
                self.__input_str.next()
                if self.__char == '*':
                    self.__input_str.next()
                    self.multiline_comment_parser()
                elif self.__char == '/': 
                    self.__input_str.next()
                    self.singleline_comment_parser()
                elif self.__previous_type == self.STRING_IDENTIFIER \
                        or  self.__previous_type == self.STRING_NUMBER \
                        or \
                        ( 
                            self.__previous_type == self.STRING_PUNCTUATOR \
                            and  self.__previous_value in self.PUNCTUATOR_DIV_PREDECESSOR
                        ):
                    self.__type = self.STRING_DIV_PUNCTUATOR
                    if self.__char == '=': 
                        self.__input_str.next()
                else:
                    self.__type = self.STRING_REG_EXP
                    self.reg_exp_parser()
                self.read_buffer(self.STRING_IDENTIFIER)
                continue
            self.__input_str.next()

    def number_hex_parser(self):
        while self.__char in self.HEX_NUMBER:
            self.__input_str.next()
        return 
    
    def number_dec_parser(self):
        while self.__char in self.NUMBER or self.__char == '.':
            self.__input_str.next()
        if self.__char == 'e' or self.__char == 'E':  
            self.__input_str.next()
            if self.__char =='+' or self.__char == '-':
                self.__input_str.next()
            while self.__char in self.NUMBER:
                self.__input_str.next()
        return 
    
    def string_parser(self):
        while True:
            if self.__char == '\\':  #\u005C
                self.__input_str.next()
                self.__input_str.next()
                continue
            if self.__char == self.__string_delimiter:
                self.__input_str.next()
                return 
            self.__input_str.next()
      
    def multiline_comment_parser(self):
        while True:
            if self.__char == '*':
                self.__input_str.next()
                if self.__char == '/':
                    self.__input_str.next()
                    return 
                continue
            self.__input_str.next()
        
    def singleline_comment_parser(self):
        while True:
            if self.__char in self.LINETERMINATOR:
                return 
            self.__input_str.next()
            
    def reg_exp_parser(self):
        is_in_brackets = False
        while True:
            if self.__char == '[':
                is_in_brackets = True
            if is_in_brackets and self.__char == ']':
                is_in_brackets = False
            if self.__char == '\\':
                self.__input_str.next()
                self.__input_str.next()
                continue
            if not is_in_brackets and  self.__char == '/': 
                self.__input_str.next()
                while self.__char in self.REG_EXP_FLAG:
                    self.__input_str.next()
                return 
            self.__input_str.next()


class minify(object):
    
    WHITESPACE = 'WHITESPACE'
    LINETERMINATOR = 'LINETERMINATOR'
    IDENTIFIER = 'IDENTIFIER'
    PUNCTUATOR = 'PUNCTUATOR'
    DIV_PUNCTUATOR = 'DIV_PUNCTUATOR'
    NUMBER = 'NUMBER'
    STRING = 'STRING'
    REG_EXP = 'REG_EXP'
    COMMENT = 'COMMENT'
    KEYWORD = 'KEYWORD'
    OPENERS = ('(', '{', '[')
    ENDS = (";", ",","+","=")
    CLOSENERS = (')', '}', ']')
    TYPE = 0
    TOLKEN = 1

    def __init__(self, input, output, encoding="utf_8_sig"):
        """ input and out can be either be a file path or a file object 
            only new lines and white spaces which are safe to remove are removed
            
            FIXME: I might make more sense that input and output are always
            file-like objects, so the minify class doesn't ever have to
            know anything about paths and opening and closing files or
            encodings. That could all go in helper methods in the module scope.
            
            """
        self.input = self.set_file(input, "r", encoding)
        self.output = self.set_file(output, "w", encoding)
        self.tolkens = [('', ''),('', ''),('', '')]
        self.buffersize = 2
        JSTolkenizer(self)

    def set_file(self, path_or_file, mode, encoding):
        """If file_or_path is a path as a string, open it using the provided
        encoding. If file_or_path is not, a string, assume that it's something
        file-like and just return it."""
        if isinstance(path_or_file, basestring):
            return codecs.open(path_or_file, mode, encoding)
        else:
            return path_or_file

    def onfinish(self):
        self.buffersize = 0
        self.tolkens += [('',''),('','')]
        self.ontolken(('',''))

    def ontolken(self, tolken):
        self.tolkens.append(tolken)
        try:
            while len(self.tolkens) > self.buffersize:
                if self.tolkens[2][self.TYPE] == self.COMMENT:
                    self.tolkens.pop(2)
                    continue 
                if self.tolkens[2][self.TYPE] == self.WHITESPACE:
                    self.tolkens[2] = (self.WHITESPACE, ' ')
                    if self.tolkens[1][self.TYPE] == self.LINETERMINATOR \
                      or self.tolkens[1][self.TYPE] == self.PUNCTUATOR \
                      or self.tolkens[1][self.TYPE] == self.DIV_PUNCTUATOR:
                        self.tolkens.pop(2)
                        continue
                if self.tolkens[1][self.TYPE] == self.WHITESPACE:
                    if self.tolkens[2][self.TYPE] == self.LINETERMINATOR \
                      or self.tolkens[2][self.TYPE] == self.PUNCTUATOR \
                      or self.tolkens[2][self.TYPE] == self.DIV_PUNCTUATOR:
                        self.tolkens.pop(1)
                        continue
                if self.tolkens[1][self.TYPE] == self.LINETERMINATOR:
                    self.tolkens[1] = (self.LINETERMINATOR, '\n')
                    if self.tolkens[2][self.TYPE] == self.LINETERMINATOR \
                      or self.tolkens[2][self.TOLKEN] in self.CLOSENERS:
                        self.tolkens.pop(1)
                        continue
                    if self.tolkens[0][self.TOLKEN] in self.CLOSENERS \
                      and ( self.tolkens[2][self.TOLKEN] in self.CLOSENERS \
                            or self.tolkens[2][self.TOLKEN] in self.OPENERS ):
                        self.tolkens.pop(1)
                        continue
                if self.tolkens[2][self.TYPE] == self.LINETERMINATOR:
                    if self.tolkens[1][self.TYPE] == self.PUNCTUATOR \
                        and ( self.tolkens[1][self.TOLKEN] in self.ENDS \
                              or self.tolkens[1][self.TOLKEN] in self.OPENERS ):
                        self.tolkens.pop(2)
                        continue
                self.output.write(self.tolkens.pop(0)[self.TOLKEN])
        except:
            pass

def minify_in_place(path, encoding=None):
    input = codecs.open(path, "r", encoding)
    tmpout = StringIO.StringIO();
    minify(input, tmpout)
    input.close()

    output = codecs.open(path, "w", encoding)
    output.write(tmpout.getvalue())
    tmpout.close()
    output.close()


if __name__ == "__main__":
    if len(sys.argv) == 3:
        minify(sys.argv[1], sys.argv[2])   
    else:
        print "usage from commandline like: python minify.py input output"
