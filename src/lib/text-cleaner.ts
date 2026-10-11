/**
 * Utility to clean raw LaTeX, MathJax, and complex scientific/medical notation
 * from Anki cards, quizzes, and clinical notes so they render naturally and beautifully
 * in Arabic and English without BiDi reversals or ugly raw syntax.
 */

const SUPERSCRIPTS: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
  '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾',
  'n': 'ⁿ', 'i': 'ⁱ',
};

const SUBSCRIPTS: Record<string, string> = {
  '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
  '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
  '+': '₊', '-': '₋', '=': '₌', '(': '₍', ')': '₎',
  'a': 'ₐ', 'e': 'ₑ', 'o': 'ₒ', 'x': 'ₓ',
};

export function cleanLatexMath(text: string): string {
  if (!text || typeof text !== 'string') return '';
  let s = text;

  // 1. Convert common Greek and math symbols
  s = s
    .replace(/\\times/g, '×')
    .replace(/\\cdot/g, '·')
    .replace(/\\pm/g, '±')
    .replace(/\\mp/g, '∓')
    .replace(/\\leq|\\le/g, '≤')
    .replace(/\\geq|\\ge/g, '≥')
    .replace(/\\approx/g, '≈')
    .replace(/\\neq|\\ne/g, '≠')
    .replace(/\\equiv/g, '≡')
    .replace(/\\rightarrow|\\to/g, '→')
    .replace(/\\leftarrow/g, '←')
    .replace(/\\leftrightarrow/g, '↔')
    .replace(/\\Rightarrow/g, '⇒')
    .replace(/\\degree|\\circ|\^\{\\circ\}|\^\\circ/g, '°')
    .replace(/\\mu/g, 'µ')
    .replace(/\\alpha/g, 'α')
    .replace(/\\beta/g, 'β')
    .replace(/\\gamma/g, 'γ')
    .replace(/\\delta/g, 'δ')
    .replace(/\\Delta/g, 'Δ')
    .replace(/\\lambda/g, 'λ')
    .replace(/\\theta/g, 'θ')
    .replace(/\\sigma/g, 'σ')
    .replace(/\\omega/g, 'ω')
    .replace(/\\pi/g, 'π')
    .replace(/\\infty/g, '∞');

  // 2. Fractions: \frac{a}{b} -> a/b
  s = s.replace(/\\(?:d?frac)\{([^}]+)\}\{([^}]+)\}/g, '$1/$2');

  // 3. Roots: \sqrt{x} -> √x
  s = s.replace(/\\sqrt\{([^}]+)\}/g, '√$1');

  // 4. Common Medical Ions & Chemical Formulas
  s = s
    .replace(/Fe\^\{\+\+\}/gi, 'Fe²⁺')
    .replace(/Fe\^\{2\+\}/gi, 'Fe²⁺')
    .replace(/Fe\^\{3\+\}|Fe\^\{\+\+\+\}/gi, 'Fe³⁺')
    .replace(/Ca\^\{\+\+\}|Ca\^\{2\+\}/gi, 'Ca²⁺')
    .replace(/Mg\^\{\+\+\}|Mg\^\{2\+\}/gi, 'Mg²⁺')
    .replace(/Na\^\{\+\}|Na\^\+/gi, 'Na⁺')
    .replace(/K\^\{\+\}|K\^\+/gi, 'K⁺')
    .replace(/Cl\^\{\-\}|Cl\^\-/gi, 'Cl⁻')
    .replace(/HCO_?\{?3\}?\^\{\-\}/gi, 'HCO₃⁻')
    .replace(/PO_?\{?4\}?\^\{3\-\}/gi, 'PO₄³⁻')
    .replace(/H_?\{?2\}?O_?\{?2\}?/gi, 'H₂O₂')
    .replace(/H_?\{?2\}?O/gi, 'H₂O')
    .replace(/CO_?\{?2\}?/gi, 'CO₂')
    .replace(/O_?\{?2\}?/gi, 'O₂');

  // 5. Convert standard LaTeX superscripts ^{...} and subscripts _{...}
  s = s.replace(/\^\{([^}]+)\}/g, (_, match) => {
    return match.split('').map((c: string) => SUPERSCRIPTS[c] || c).join('');
  });
  s = s.replace(/_\{([^}]+)\}/g, (_, match) => {
    return match.split('').map((c: string) => SUBSCRIPTS[c] || c).join('');
  });

  // Short superscripts like ^2, ^3
  s = s.replace(/\^([0-9\+\-])/g, (_, c) => SUPERSCRIPTS[c] || c);
  // Short subscripts like _2, _3
  s = s.replace(/_([0-9])/g, (_, c) => SUBSCRIPTS[c] || c);

  // 6. Strip text wrappers: \text{...}, \mathrm{...}, \textbf{...}, \textit{...}, \mathbf{...}
  s = s.replace(/\\(?:text(?:normal)?|mathrm|textbf|textit|mathbf|operatorname)\{([^}]+)\}/g, '$1');

  // 7. Escaped punctuation characters: \%, \$, \&, \_, \#
  s = s
    .replace(/\\%/g, '%')
    .replace(/\\\$/g, '$')
    .replace(/\\&/g, '&')
    .replace(/\\_/g, '_')
    .replace(/\\#/g, '#');

  // 8. Strip LaTeX math delimiters: $...$, $$...$$, \(...\), \[...\]
  s = s.replace(/\$\$([\s\S]*?)\$\$/g, '$1');
  s = s.replace(/\$([^$]+)\$/g, '$1');
  s = s.replace(/\\\(([\s\S]+?)\\\)/g, '$1');
  s = s.replace(/\\\[([\s\S]+?)\\\]/g, '$1');

  // 9. Percentage ranges: e.g. "65 - 75%" -> "65% - 75%"
  // This explicitly prevents Arabic RTL BiDi reordering from showing "%75 - 65"
  s = s.replace(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)%/g, '$1% - $2%');

  // 10. Clean up stray leading/trailing backslashes before words
  s = s.replace(/\\([a-zA-Z]+)/g, '$1');

  // 11. Normalize excessive spaces while keeping newlines intact
  s = s.replace(/[ \t]+/g, ' ');
  s = s.replace(/\n\s+/g, '\n').replace(/\s+\n/g, '\n');

  return s.trim();
}
