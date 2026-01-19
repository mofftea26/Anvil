export function getNextSeriesLabel(existingLabels: string[]) {
    // A, B, C, ... Z then AA, AB...
    const used = new Set(existingLabels.map((x) => x.toUpperCase().trim()));
    let i = 0;
  
    while (i < 1000) {
      const label = numberToLetters(i);
      if (!used.has(label)) return label;
      i++;
    }
  
    return `S${existingLabels.length + 1}`;
  }
  
  function numberToLetters(n: number) {
    // 0 -> A, 1 -> B ... 25 -> Z, 26 -> AA ...
    let s = "";
    n += 1;
  
    while (n > 0) {
      const mod = (n - 1) % 26;
      s = String.fromCharCode(65 + mod) + s;
      n = Math.floor((n - 1) / 26);
    }
  
    return s;
  }
  