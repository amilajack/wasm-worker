import wasmWorker from '../src/index';
import bytes from './bytes';
import bytesWithImport from './bytes-imports';

describe('wasm-worker', () => {
  it('should export a function', () => {
    expect(wasmWorker).toBeDefined();
  });

  it('should instantiate a module from a TypedArray', (done) => {
    wasmWorker(bytes)
      .then((module) => {
        expect(module.exports).toBeDefined();
        expect(module.exports.add).toBeDefined();
        expect(module.exports.div).toBeDefined();
        done();
      });
  });

  it('should catch if an invalid module is provided', (done) => {
    wasmWorker(42)
      .catch((module) => {
        expect(module).toBeDefined();
        done();
      });
  });

  it('should call an exported function', (done) => {
    wasmWorker(bytes)
      .then(module =>
        Promise.all([
          module.exports.add(1, 2),
          module.exports.div(4, 2),
        ]),
      )
      .then((results) => {
        expect(results[0]).toEqual(3);
        expect(results[1]).toEqual(2);
        done();
      });
  });

  it('should catch if WebAssembly throw', (done) => {
    const results = [];

    wasmWorker(bytes)
      .then((module) => {
        expect(module.exports.div).toBeDefined();
        return module.exports.div(1, 1).then((result) => {
          results.push(result);
          return module.exports.div(1, 0);
        });
      })
      .catch((ex) => {
        expect(results.length).toEqual(1);
        expect(results[0]).toEqual(1);
        expect(ex).toEqual('RuntimeError: divide by zero');
        done();
      });
  });

  it('should support importObject as option', (done) => {
    wasmWorker(bytesWithImport, {
      getImportObject: () => ({
        imports: {
          add_js: (a, b) => a + b,
        },
      }),
    })
      .then(module =>
        module.exports.add_js(1, 2),
      )
      .then((result) => {
        expect(result).toEqual(3);
        done();
      });
  });
});
