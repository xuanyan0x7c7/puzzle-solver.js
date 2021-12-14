import module from './puzzle-solver.wasm';

interface WasmExports extends WebAssembly.Exports {
  memory: WebAssembly.Memory;
  __wbg_puzzlesolver_free(a: number): void;
  puzzlesolver_new(): number;
  puzzlesolver_newConditionalConstraint(a: number, b: number): number;
  puzzlesolver_addRows(a: number, b: number): number;
  puzzlesolver_addColumn(a: number, b: number): void;
  puzzlesolver_addConditionalColumn(a: number, b: number, c: number): void;
  puzzlesolver_addConstraint(a: number, b: number): void;
  puzzlesolver_selectRow(a: number, b: number): void;
  puzzlesolver_deselectRow(a: number, b: number): void;
  puzzlesolver_solveNext(a: number): number;
  __wbindgen_malloc(a: number): number;
  __wbindgen_realloc(a: number, b: number, c: number): number;
}

let wasm: WasmExports | null = null;

const heap = new Array(32).fill(undefined);
heap.push(undefined, null, true, false);

let heap_next = heap.length;

function getObject(idx: number) {
  return heap[idx];
}

function addHeapObject(obj: any) {
  if (heap_next === heap.length) {
    heap.push(heap.length + 1);
  }
  const idx = heap_next;
  heap_next = heap[idx];

  heap[idx] = obj;
  return idx;
}

let stack_pointer = 32;

function addBorrowedObject(obj: any) {
  if (stack_pointer === 1) {
    throw new Error('out of js stack');
  }
  heap[--stack_pointer] = obj;
  return stack_pointer;
}

function dropObject(idx: number) {
  if (idx < 36) {
    return;
  }
  heap[idx] = heap_next;
  heap_next = idx;
}

function takeObject(idx: number) {
  const ret = getObject(idx);
  dropObject(idx);
  return ret;
}

let WASM_VECTOR_LEN = 0;

let cachegetUint8Memory0: Uint8Array | null = null;
function getUint8Memory0() {
  if (cachegetUint8Memory0?.buffer !== wasm!.memory.buffer) {
    cachegetUint8Memory0 = new Uint8Array(wasm!.memory.buffer);
  }
  return cachegetUint8Memory0;
}

let cachegetInt32Memory0: Int32Array | null = null;
function getInt32Memory0() {
  if (cachegetInt32Memory0?.buffer !== wasm!.memory.buffer) {
    cachegetInt32Memory0 = new Int32Array(wasm!.memory.buffer);
  }
  return cachegetInt32Memory0;
}

const cachedTextEncoder = new TextEncoder();

function encodeString(arg: string, view: Uint8Array) {
  if (typeof cachedTextEncoder.encodeInto === 'function') {
    return cachedTextEncoder.encodeInto(arg, view) as { read: number; written: number };
  } else {
    const buf = cachedTextEncoder.encode(arg);
    view.set(buf);
    return {
      read: arg.length,
      written: buf.length,
    };
  }
}

function passStringToWasm0(
  arg: string,
  malloc: (size: number) => number,
  realloc: ((pointer: number, oldSize: number, newSize: number) => number) | undefined
) {
  if (realloc === undefined) {
    const buf = cachedTextEncoder.encode(arg);
    const ptr = malloc(buf.length);
    getUint8Memory0().subarray(ptr, ptr + buf.length).set(buf);
    WASM_VECTOR_LEN = buf.length;
    return ptr;
  }

  let len = arg.length;
  let ptr = malloc(len);

  const mem = getUint8Memory0();

  let offset = 0;

  for (; offset < len; offset++) {
    const code = arg.charCodeAt(offset);
    if (code > 0x7F) {
      break;
    }
    mem[ptr + offset] = code;
  }

  if (offset !== len) {
    if (offset !== 0) {
      arg = arg.slice(offset);
    }
    ptr = realloc(ptr, len, len = offset + arg.length * 3);
    const view = getUint8Memory0().subarray(ptr + offset, ptr + len);
    const ret = encodeString(arg, view);

    offset += ret.written;
  }

  WASM_VECTOR_LEN = offset;
  return ptr;
}

const cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
cachedTextDecoder.decode();

function getStringFromWasm0(ptr: number, len: number) {
  return cachedTextDecoder.decode(getUint8Memory0().subarray(ptr, ptr + len));
}

export default class PuzzleSolver {
  private ptr = 0;

  constructor() {
    this.ptr = wasm!.puzzlesolver_new();
  }

  free() {
    wasm!.__wbg_puzzlesolver_free(this.ptr);
    this.ptr = 0;
  }

  newConditionalConstraint(holes: number) {
    const ret = wasm!.puzzlesolver_newConditionalConstraint(this.ptr, holes);
    return ret >>> 0;
  }

  addRows(rowCount: number) {
    wasm!.puzzlesolver_addRows(this.ptr, rowCount);
  }

  addColumn(rows: number[]) {
    try {
      wasm!.puzzlesolver_addColumn(this.ptr, addBorrowedObject(rows));
    } finally {
      heap[stack_pointer++] = undefined;
    }
  }

  addConditionalColumn(rows: number[], conditionalIndex: number) {
    try {
      wasm!.puzzlesolver_addConditionalColumn(this.ptr, addBorrowedObject(rows), conditionalIndex);
    } finally {
      heap[stack_pointer++] = undefined;
    }
  }

  addConstraint(rows: number[]) {
    try {
      wasm!.puzzlesolver_addConstraint(this.ptr, addBorrowedObject(rows));
    } finally {
      heap[stack_pointer++] = undefined;
    }
  }

  selectRow(row: number) {
    wasm!.puzzlesolver_selectRow(this.ptr, row);
  }

  deselectRow(row: number) {
    wasm!.puzzlesolver_deselectRow(this.ptr, row);
  }

  * solve(): Generator<number[], void, void> {
    while (true) {
      const ret = wasm!.puzzlesolver_solveNext(this.ptr);
      const solution = takeObject(ret);
      if (solution == null) {
        break;
      }
      yield solution;
    }
  }
}

export async function init() {
  if (wasm == null) {
    const wasmModule = await module({
      wbg: {
        __wbindgen_json_serialize(arg0: number, arg1: number) {
          const obj = getObject(arg1);
          const ret = JSON.stringify(obj === undefined ? null : obj);
          const ptr0 = passStringToWasm0(ret, wasm!.__wbindgen_malloc, wasm!.__wbindgen_realloc);
          const len0 = WASM_VECTOR_LEN;
          getInt32Memory0()[arg0 / 4 + 1] = len0;
          getInt32Memory0()[arg0 / 4 + 0] = ptr0;
        },
        __wbindgen_json_parse(arg0: number, arg1: number) {
          const ret = JSON.parse(getStringFromWasm0(arg0, arg1));
          return addHeapObject(ret);
        },
        __wbindgen_throw(arg0: number, arg1: number) {
          throw new Error(getStringFromWasm0(arg0, arg1));
        },
      },
    });
    wasm = wasmModule.instance.exports as WasmExports;
  }
}
