import { ExamPageData, WordToken } from '../types';
import { computeGrade } from '../utils/pythonValidator';

// Generates an authentic SVG data URL representing the handwritten exam page
function createHandwrittenExamSvg(pageNumber: 1 | 2): string {
  const isPage2 = pageNumber === 2;

  const svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1414" width="1000" height="1414">
  <defs>
    <!-- Paper texture & warmth -->
    <filter id="paper-noise" x="0%" y="0%" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="noise" />
      <feColorMatrix type="matrix" values="0 0 0 0 0.98   0 0 0 0 0.97   0 0 0 0 0.94  0 0 0 0.05 0" />
      <feBlend mode="multiply" in="SourceGraphic" result="blend" />
    </filter>
  </defs>

  <!-- Paper background -->
  <rect width="1000" height="1414" fill="#faf8f4"/>
  <rect width="1000" height="1414" fill="#f4eedf" opacity="0.35" filter="url(#paper-noise)"/>

  <!-- Left margin fold line -->
  <line x1="12" y1="0" x2="12" y2="1414" stroke="#c8bcab" stroke-width="1.5" stroke-dasharray="8 4" opacity="0.4"/>
  
  <!-- Top corner page number stamp: 307 with underline -->
  <g transform="translate(930, 45)" font-family="'Caveat', 'Patrick Hand', cursive, sans-serif" font-size="28" fill="#1c2536" font-weight="600">
    <text x="0" y="0">307</text>
    <line x1="-5" y1="6" x2="45" y2="6" stroke="#1c2536" stroke-width="2"/>
  </g>

  <!-- Handwritten Text Content styled like real pencil/pen handwriting -->
  <g font-family="'Caveat', 'Segoe Print', 'Comic Sans MS', cursive, sans-serif" fill="#1e293b" opacity="0.94">
    <!-- Student Header -->
    <text x="140" y="115" font-size="34" font-weight="600" letter-spacing="1">Esti Toledano</text>
    <text x="140" y="155" font-size="28" letter-spacing="0.5">Esti.Toledano@grunitech.com</text>

    ${
      isPage2
        ? `
    <!-- Page 2: Valid Parentheses -->
    <g transform="translate(0, 10)">
      <text x="155" y="235" font-size="30" font-weight="600">class  solution:</text>
      <text x="195" y="275" font-size="30">def   isValid(self,  s:str) -&gt; bool:</text>

      <!-- Scratched out erroneous attempt -->
      <g opacity="0.8">
        <text x="210" y="315" font-size="26" fill="#475569">stack = []</text>
        <path d="M 200 305 Q 260 320 340 308 Q 300 312 210 318" stroke="#1e293b" stroke-width="3" fill="none"/>
        <path d="M 205 312 L 335 312" stroke="#1e293b" stroke-width="2.5" fill="none"/>
      </g>

      <text x="280" y="355" font-size="30">stack = [ ]</text>
      <text x="280" y="405" font-size="30">matching = { '[' : ']',  '{' : '}',  '(' : ')' }</text>

      <text x="290" y="455" font-size="30">for  c   in   s :</text>
      <text x="345" y="505" font-size="30">if   c   in   ['[',  '{',  '('] :</text>
      <text x="410" y="555" font-size="30">stack.append(c)</text>
      <text x="360" y="605" font-size="30">else :</text>
      <text x="425" y="650" font-size="30">if  (len(stack) == 0) :</text>
      <text x="480" y="695" font-size="30">return   False</text>

      <!-- Scratched out line: last = matching[c] -->
      <g opacity="0.85">
        <text x="440" y="735" font-size="26" fill="#475569">last = matching[c]</text>
        <path d="M 430 728 Q 530 740 630 726" stroke="#1e293b" stroke-width="3" fill="none"/>
        <path d="M 435 733 L 625 730" stroke="#1e293b" stroke-width="2.5" fill="none"/>
      </g>

      <text x="445" y="775" font-size="30">last = stack.pop()</text>
      <text x="450" y="825" font-size="30">if  (matching[last] != c) :</text>
      <text x="515" y="870" font-size="30">return   False</text>

      <text x="335" y="945" font-size="32" font-weight="600">retur   len(stack) == 0</text>
    </g>
    `
        : `
    <!-- Page 1: Reverse Linked List -->
    <g transform="translate(0, 10)">
      <text x="155" y="235" font-size="30" font-weight="600">class  solution:</text>
      <text x="195" y="275" font-size="30">def  revesList(self, head: Optional[ListNode]) -&gt; Optional[ListNode]:</text>
      <text x="270" y="325" font-size="30">prev = None</text>
      <text x="270" y="365" font-size="30">curr = head</text>
      <text x="270" y="415" font-size="30">while  curr  is  hot  None :</text>
      <text x="345" y="465" font-size="30">hext_node = curr.next</text>
      <text x="345" y="510" font-size="30">curr.next = prev</text>
      <text x="345" y="555" font-size="30">prev = curr</text>
      <text x="345" y="600" font-size="30">curr = hext_node</text>
      <text x="325" y="660" font-size="32" font-weight="600">return   prev</text>
    </g>
    `
    }
  </g>
</svg>
`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svgContent)}`;
}

export const PAGE_2_TOKENS: WordToken[] = [
  // Header
  { id: 'p2-1', word: 'Esti', box: { ymin: 65, xmin: 135, ymax: 95, xmax: 205 }, lineIndex: 0, confidence: 0.99 },
  { id: 'p2-2', word: 'Toledano', box: { ymin: 65, xmin: 215, ymax: 95, xmax: 335 }, lineIndex: 0, confidence: 0.99 },
  { id: 'p2-3', word: 'Esti.Toledano@grunitech.com', box: { ymin: 98, xmin: 135, ymax: 125, xmax: 450 }, lineIndex: 1, confidence: 0.98 },
  
  // class solution:
  { id: 'p2-4', word: 'class', box: { ymin: 155, xmin: 150, ymax: 180, xmax: 215 }, lineIndex: 3, confidence: 0.99 },
  { id: 'p2-5', word: 'solution:', box: { ymin: 155, xmin: 225, ymax: 180, xmax: 325 }, lineIndex: 3, confidence: 0.97 },

  // def isValid(self, s:str) -> bool:
  { id: 'p2-6', word: 'def', box: { ymin: 183, xmin: 190, ymax: 208, xmax: 235 }, lineIndex: 4, confidence: 0.99 },
  { id: 'p2-7', word: 'isValid', box: { ymin: 183, xmin: 250, ymax: 208, xmax: 330 }, lineIndex: 4, confidence: 0.98 },
  { id: 'p2-8', word: '(self,', box: { ymin: 183, xmin: 340, ymax: 208, xmax: 405 }, lineIndex: 4, confidence: 0.97 },
  { id: 'p2-9', word: 's:str)', box: { ymin: 183, xmin: 420, ymax: 208, xmax: 480 }, lineIndex: 4, confidence: 0.96 },
  { id: 'p2-10', word: '->bool:', box: { ymin: 183, xmin: 495, ymax: 208, xmax: 580 }, lineIndex: 4, confidence: 0.95 },

  // stack = []
  { id: 'p2-11', word: 'stack', box: { ymin: 238, xmin: 275, ymax: 265, xmax: 335 }, lineIndex: 5, confidence: 0.99 },
  { id: 'p2-12', word: '=', box: { ymin: 238, xmin: 345, ymax: 265, xmax: 365 }, lineIndex: 5, confidence: 0.99 },
  { id: 'p2-13', word: '[]', box: { ymin: 238, xmin: 375, ymax: 265, xmax: 410 }, lineIndex: 5, confidence: 0.98 },

  // matching = {'[': ']', '{': '}', '(': ')'}
  { id: 'p2-14', word: 'matching', box: { ymin: 272, xmin: 275, ymax: 298, xmax: 370 }, lineIndex: 6, confidence: 0.99 },
  { id: 'p2-15', word: '=', box: { ymin: 272, xmin: 380, ymax: 298, xmax: 400 }, lineIndex: 6, confidence: 0.99 },
  { id: 'p2-16', word: "{'[': ']',", box: { ymin: 272, xmin: 410, ymax: 298, xmax: 505 }, lineIndex: 6, confidence: 0.97 },
  { id: 'p2-17', word: "'{': '}',", box: { ymin: 272, xmin: 520, ymax: 298, xmax: 605 }, lineIndex: 6, confidence: 0.97 },
  { id: 'p2-18', word: "'(': ')'}", box: { ymin: 272, xmin: 620, ymax: 298, xmax: 710 }, lineIndex: 6, confidence: 0.96 },

  // for c in s:
  { id: 'p2-19', word: 'for', box: { ymin: 308, xmin: 285, ymax: 335, xmax: 325 }, lineIndex: 7, confidence: 0.99 },
  { id: 'p2-20', word: 'c', box: { ymin: 308, xmin: 340, ymax: 335, xmax: 360 }, lineIndex: 7, confidence: 0.99 },
  { id: 'p2-21', word: 'in', box: { ymin: 308, xmin: 385, ymax: 335, xmax: 415 }, lineIndex: 7, confidence: 0.99 },
  { id: 'p2-22', word: 's:', box: { ymin: 308, xmin: 440, ymax: 335, xmax: 470 }, lineIndex: 7, confidence: 0.99 },

  // if c in ['[', '{', '(']:
  { id: 'p2-23', word: 'if', box: { ymin: 345, xmin: 340, ymax: 370, xmax: 365 }, lineIndex: 8, confidence: 0.99 },
  { id: 'p2-24', word: 'c', box: { ymin: 345, xmin: 385, ymax: 370, xmax: 405 }, lineIndex: 8, confidence: 0.99 },
  { id: 'p2-25', word: 'in', box: { ymin: 345, xmin: 425, ymax: 370, xmax: 455 }, lineIndex: 8, confidence: 0.99 },
  { id: 'p2-26', word: "['[',", box: { ymin: 345, xmin: 475, ymax: 370, xmax: 530 }, lineIndex: 8, confidence: 0.96 },
  { id: 'p2-27', word: "'{',", box: { ymin: 345, xmin: 540, ymax: 370, xmax: 585 }, lineIndex: 8, confidence: 0.96 },
  { id: 'p2-28', word: "'(']:", box: { ymin: 345, xmin: 595, ymax: 370, xmax: 650 }, lineIndex: 8, confidence: 0.95 },

  // stack.append(c)
  { id: 'p2-29', word: 'stack.append(c)', box: { ymin: 380, xmin: 405, ymax: 405, xmax: 585 }, lineIndex: 9, confidence: 0.98 },

  // else:
  { id: 'p2-30', word: 'else:', box: { ymin: 415, xmin: 355, ymax: 440, xmax: 410 }, lineIndex: 10, confidence: 0.99 },

  // if (len(stack) == 0):
  { id: 'p2-31', word: 'if', box: { ymin: 448, xmin: 420, ymax: 472, xmax: 445 }, lineIndex: 11, confidence: 0.99 },
  { id: 'p2-32', word: '(len(stack)', box: { ymin: 448, xmin: 455, ymax: 472, xmax: 585 }, lineIndex: 11, confidence: 0.97 },
  { id: 'p2-33', word: '== 0):', box: { ymin: 448, xmin: 595, ymax: 472, xmax: 685 }, lineIndex: 11, confidence: 0.98 },

  // return False
  { id: 'p2-34', word: 'return', box: { ymin: 478, xmin: 475, ymax: 505, xmax: 545 }, lineIndex: 12, confidence: 0.99 },
  { id: 'p2-35', word: 'False', box: { ymin: 478, xmin: 590, ymax: 505, xmax: 655 }, lineIndex: 12, confidence: 0.99 },

  // last = stack.pop()
  { id: 'p2-36', word: 'last', box: { ymin: 535, xmin: 440, ymax: 560, xmax: 490 }, lineIndex: 13, confidence: 0.99 },
  { id: 'p2-37', word: '=', box: { ymin: 535, xmin: 498, ymax: 560, xmax: 518 }, lineIndex: 13, confidence: 0.99 },
  { id: 'p2-38', word: 'stack.pop()', box: { ymin: 535, xmin: 525, ymax: 560, xmax: 660 }, lineIndex: 13, confidence: 0.98 },

  // if (matching[last] != c):
  { id: 'p2-39', word: 'if', box: { ymin: 570, xmin: 445, ymax: 595, xmax: 470 }, lineIndex: 14, confidence: 0.99 },
  { id: 'p2-40', word: '(matching[last]', box: { ymin: 570, xmin: 475, ymax: 595, xmax: 670 }, lineIndex: 14, confidence: 0.96 },
  { id: 'p2-41', word: '!= c):', box: { ymin: 570, xmin: 680, ymax: 595, xmax: 765 }, lineIndex: 14, confidence: 0.97 },

  // return False
  { id: 'p2-42', word: 'return', box: { ymin: 602, xmin: 510, ymax: 628, xmax: 580 }, lineIndex: 15, confidence: 0.99 },
  { id: 'p2-43', word: 'False', box: { ymin: 602, xmin: 625, ymax: 628, xmax: 690 }, lineIndex: 15, confidence: 0.99 },

  // retur len(stack) == 0
  { id: 'p2-44', word: 'retur', box: { ymin: 655, xmin: 330, ymax: 685, xmax: 405 }, lineIndex: 16, confidence: 0.94 },
  { id: 'p2-45', word: 'len(stack)', box: { ymin: 655, xmin: 450, ymax: 685, xmax: 580 }, lineIndex: 16, confidence: 0.98 },
  { id: 'p2-46', word: '== 0', box: { ymin: 655, xmin: 595, ymax: 685, xmax: 665 }, lineIndex: 16, confidence: 0.99 },
];

export const PAGE_2_CODE = `# Student: Esti Toledano
# Email: Esti.Toledano@grunitech.com

class solution:
    def isValid(self, s: str) -> bool:
        stack = []
        matching = {'[': ']', '{': '}', '(': ')'}
        for c in s:
            if c in ['[', '{', '(']:
                stack.append(c)
            else:
                if (len(stack) == 0):
                    return False
                last = stack.pop()
                if (matching[last] != c):
                    return False
        retur len(stack) == 0
`;

export const PAGE_1_TOKENS: WordToken[] = [
  { id: 'p1-1', word: 'Esti', box: { ymin: 65, xmin: 135, ymax: 95, xmax: 205 }, lineIndex: 0, confidence: 0.99 },
  { id: 'p1-2', word: 'Toledano', box: { ymin: 65, xmin: 215, ymax: 95, xmax: 335 }, lineIndex: 0, confidence: 0.99 },
  { id: 'p1-3', word: 'Esti.Toledano@grunitech.com', box: { ymin: 98, xmin: 135, ymax: 125, xmax: 450 }, lineIndex: 1, confidence: 0.98 },

  { id: 'p1-4', word: 'class', box: { ymin: 155, xmin: 150, ymax: 180, xmax: 215 }, lineIndex: 3, confidence: 0.99 },
  { id: 'p1-5', word: 'solution:', box: { ymin: 155, xmin: 225, ymax: 180, xmax: 325 }, lineIndex: 3, confidence: 0.97 },

  { id: 'p1-6', word: 'def', box: { ymin: 183, xmin: 190, ymax: 208, xmax: 235 }, lineIndex: 4, confidence: 0.99 },
  { id: 'p1-7', word: 'revesList', box: { ymin: 183, xmin: 250, ymax: 208, xmax: 345 }, lineIndex: 4, confidence: 0.95 },
  { id: 'p1-8', word: '(self, head: Optional[ListNode])', box: { ymin: 183, xmin: 355, ymax: 208, xmax: 670 }, lineIndex: 4, confidence: 0.96 },
  { id: 'p1-9', word: '-> Optional[ListNode]:', box: { ymin: 183, xmin: 680, ymax: 208, xmax: 920 }, lineIndex: 4, confidence: 0.95 },

  { id: 'p1-10', word: 'prev = None', box: { ymin: 218, xmin: 265, ymax: 245, xmax: 415 }, lineIndex: 5, confidence: 0.99 },
  { id: 'p1-11', word: 'curr = head', box: { ymin: 246, xmin: 265, ymax: 272, xmax: 415 }, lineIndex: 6, confidence: 0.99 },
  { id: 'p1-12', word: 'while curr is hot None:', box: { ymin: 280, xmin: 265, ymax: 308, xmax: 560 }, lineIndex: 7, confidence: 0.94 },
  { id: 'p1-13', word: 'hext_node = curr.next', box: { ymin: 315, xmin: 340, ymax: 342, xmax: 615 }, lineIndex: 8, confidence: 0.95 },
  { id: 'p1-14', word: 'curr.next = prev', box: { ymin: 348, xmin: 340, ymax: 375, xmax: 560 }, lineIndex: 9, confidence: 0.99 },
  { id: 'p1-15', word: 'prev = curr', box: { ymin: 380, xmin: 340, ymax: 405, xmax: 495 }, lineIndex: 10, confidence: 0.99 },
  { id: 'p1-16', word: 'curr = hext_node', box: { ymin: 410, xmin: 340, ymax: 438, xmax: 570 }, lineIndex: 11, confidence: 0.96 },
  { id: 'p1-17', word: 'return prev', box: { ymin: 450, xmin: 320, ymax: 480, xmax: 490 }, lineIndex: 12, confidence: 0.99 },
];

export const PAGE_1_CODE = `# Student: Esti Toledano
# Email: Esti.Toledano@grunitech.com

class solution:
    def revesList(self, head: Optional[ListNode]) -> Optional[ListNode]:
        prev = None
        curr = head
        while curr is not None:
            next_node = curr.next
            curr.next = prev
            prev = curr
            curr = next_node
        return prev
`;

export const SAMPLE_PAGES: ExamPageData[] = [
  {
    id: 'page-2-valid-parentheses',
    pageNumber: 2,
    title: 'Page 2: Valid Parentheses (Esti Toledano)',
    imageUrl: createHandwrittenExamSvg(2),
    tokens: PAGE_2_TOKENS,
    pythonCode: PAGE_2_CODE,
    evaluation: computeGrade(PAGE_2_CODE, 'valid_parentheses', 'Esti Toledano', 'Esti.Toledano@grunitech.com'),
  },
  {
    id: 'page-1-reverse-linked-list',
    pageNumber: 1,
    title: 'Page 1: Reverse Linked List (Esti Toledano)',
    imageUrl: createHandwrittenExamSvg(1),
    tokens: PAGE_1_TOKENS,
    pythonCode: PAGE_1_CODE,
    evaluation: computeGrade(PAGE_1_CODE, 'reverse_linked_list', 'Esti Toledano', 'Esti.Toledano@grunitech.com'),
  },
];
