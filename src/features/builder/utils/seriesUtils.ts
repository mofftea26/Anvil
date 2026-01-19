export function getNextSeriesLabel(existingLabels: string[]): string {
    // A, B, C ... Z, AA, AB ...
    const taken = new Set(existingLabels.map((x) => x.toUpperCase()));
    let i = 0;
  
    while (true) {
      const label = numberToLetters(i);
      if (!taken.has(label)) return label;
      i++;
    }
  }
  
  function numberToLetters(num: number): string {
    let s = "";
    let n = num;
  
    while (true) {
      s = String.fromCharCode(65 + (n % 26)) + s;
      n = Math.floor(n / 26) - 1;
      if (n < 0) break;
    }
  
    return s;
  }
  