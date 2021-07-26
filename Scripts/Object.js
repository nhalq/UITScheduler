class Bitset {
  static BIT_PER_4BYTES = 32;

  constructor(size) {
    let sizeOfCluster = parseInt((size - 1) / Bitset.BIT_PER_4BYTES) + 1;

    // Create instanace for bitset
    this.m_size = size;
    this.m_clusters = new Array(sizeOfCluster).fill(0);
  }

  copy() {
    let _bitset = new Bitset(this.m_size);
    _bitset.m_clusters = [... this.m_clusters];
    return _bitset;
  }

  set(position) {
    return 0 <= position && position < this.m_size ?
      Boolean(this.m_clusters[parseInt(position / Bitset.BIT_PER_4BYTES)] |= (1 << (position % Bitset.BIT_PER_4BYTES))) : 0;
  }

  reset(position) {
    return 0 <= position && position < this.m_size ?
      Boolean(this.m_clusters[parseInt(position / Bitset.BIT_PER_4BYTES)] &= ~(1 << (position % Bitset.BIT_PER_4BYTES))) : 0;
  }

  get(position) {
    return 0 <= position && position < this.m_size ?
      Boolean(this.m_clusters[parseInt(position / Bitset.BIT_PER_4BYTES)] & (1 << (position % Bitset.BIT_PER_4BYTES))) : 0;
  }

  count() {
    return this.m_clusters.map(cluster => {
      cluster = cluster - ((cluster >> 1) & 0x55555555);
      cluster = (cluster & 0x33333333) + ((cluster >> 2) & 0x33333333);
      return ((cluster + (cluster >> 4) & 0x0F0F0F0F) * 0x01010101) >> 24;
    }).reduce((shl, shr) => shl + shr);
  }

  distance() {
    let result = 0;
    let previous = -1;
    for (const i of Array(this.m_size).keys()) {
      if (this.get(i)) {
        if (0 <= previous && !this.get(i - 1))
          result += (i - previous - 1);
        previous = i;
      }
    }

    return result;
  }

  static or(shl, shr) {
    let result = new Bitset(Math.max(shl.m_size, shr.m_size));
    for (const i of Array(result.m_clusters.length).keys())
      result.m_clusters[i] = shl.m_clusters[i] | shr.m_clusters[i];
    return result;
  }

  static and(shl, shr) {
    let result = new Bitset(Math.max(shl.m_size, shr.m_size));
    for (const i of Array(result.m_clusters.length).keys())
      result.m_clusters[i] = shl.m_clusters[i] & shr.m_clusters[i];
    return result;
  }

  static xor(shl, shr) {
    let result = new Bitset(Math.max(shl.m_size, shr.m_size));
    for (const i of Array(result.m_clusters.length).keys())
      result.m_clusters[i] = shl.m_clusters[i] ^ shr.m_clusters[i];
    return result;
  }

  toString() {
    return this.m_clusters.map(cluster => {
      let sequence = cluster.toString(2);
      let prefix = (new Array(Bitset.BIT_PER_4BYTES - sequence.length).fill("0")).join("");
      return (prefix + sequence);
    }).reverse().join("").slice(-this.m_size);
  }
}

class PeriodTime {
  constructor(day, periods) {
    if (day == '*') {
      this.m_day = 0;
      this.m_periods = new Array();
    } else {
      this.m_day = parseInt(day) - 2;
      this.m_periods = periods.split("").map(period => (parseInt(period) + 9) % 10);
    }
  }

  toBitset() {
    let bitset = new Bitset(60);
    this.m_periods.forEach(period => bitset.set(10 * this.m_day + period))
    return bitset
  }
}

class Class {
  constructor(code, name, time, credit, system) {
    this.m_code = code;
    this.m_name = name
    this.m_time = time;
    this.m_credit = credit;
    this.m_system = system;
  }

  copy() {
    return new Class(
      this.m_code,
      this.m_name,
      this.m_time.copy(),
      this.m_credit,
      this.m_system,
    )
  }
}

// NAMESPACE: Bait
Bait = Object({
  Log: class {
    static write(...message) {
      console.log("[BAIT]", ...message);
    }

    static error(...message) {
      console.log("[BAIT_ERROR]", ...message);
    }

    static warn(...message) {
      console.log("[BAIT_WARN]", ...message);
    }
  },

  Storage: class {
    static set(key, value) {
      localStorage.setItem(key, value);
    }

    static get(key) {
      return localStorage.getItem(key);
    }

    static exist(key) {
      return (key in localStorage);
    }
  },

  Clipboard: class {
    static write(value) {
      const context = $("<textarea>").val(value);
      $(document.body).append(context);
      context.select();

      document.execCommand("copy");
      context.remove();
    }
  }
});
