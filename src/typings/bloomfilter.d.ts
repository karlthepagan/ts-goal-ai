interface BloomFilter {
  m: number;
  k: number;
  buckets: Int32Array|number[];
  constructor(m: number|any[], k: number): BloomFilter;
  locations(v: any): Uint8Array|Uint16Array|Uint32Array|number[];
  add(v: any): void;
  test(v: any): boolean;
  size(): number;
}
