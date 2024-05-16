"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/require-in-the-middle";
exports.ids = ["vendor-chunks/require-in-the-middle"];
exports.modules = {

/***/ "(instrument)/./node_modules/require-in-the-middle/index.js":
/*!*****************************************************!*\
  !*** ./node_modules/require-in-the-middle/index.js ***!
  \*****************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("\n\nconst path = __webpack_require__(/*! path */ \"path\")\nconst Module = __webpack_require__(/*! module */ \"module\")\nconst resolve = __webpack_require__(/*! resolve */ \"(instrument)/./node_modules/resolve/index.js\")\nconst debug = __webpack_require__(/*! debug */ \"(instrument)/./node_modules/debug/src/index.js\")('require-in-the-middle')\nconst moduleDetailsFromPath = __webpack_require__(/*! module-details-from-path */ \"(instrument)/./node_modules/module-details-from-path/index.js\")\n\n// Using the default export is discouraged, but kept for backward compatibility.\n// Use this instead:\n//    const { Hook } = require('require-in-the-middle')\nmodule.exports = Hook\nmodule.exports.Hook = Hook\n\n/**\n * Is the given module a \"core\" module?\n * https://nodejs.org/api/modules.html#core-modules\n *\n * @type {(moduleName: string) => boolean}\n */\nlet isCore\nif (Module.isBuiltin) { // Added in node v18.6.0, v16.17.0\n  isCore = Module.isBuiltin\n} else {\n  const [major, minor] = process.versions.node.split('.').map(Number)\n  if (major === 8 && minor < 8) {\n    // For node versions `[8.0, 8.8)` the \"http2\" module was built-in but\n    // behind the `--expose-http2` flag. `resolve` only considers unflagged\n    // modules to be core: https://github.com/browserify/resolve/issues/139\n    // However, for `ExportsCache` to work for \"http2\" we need it to be\n    // considered core.\n    isCore = moduleName => {\n      if (moduleName === 'http2') {\n        return true\n      }\n      // Prefer `resolve.core` lookup to `resolve.isCore(moduleName)` because\n      // the latter is doing version range matches for every call.\n      return !!resolve.core[moduleName]\n    }\n  } else {\n    isCore = moduleName => {\n      // Prefer `resolve.core` lookup to `resolve.isCore(moduleName)` because\n      // the latter is doing version range matches for every call.\n      return !!resolve.core[moduleName]\n    }\n  }\n}\n\n// 'foo/bar.js' or 'foo/bar/index.js' => 'foo/bar'\nconst normalize = /([/\\\\]index)?(\\.js)?$/\n\n// Cache `onrequire`-patched exports for modules.\n//\n// Exports for built-in (a.k.a. \"core\") modules are stored in an internal Map.\n//\n// Exports for non-core modules are stored on a private field on the `Module`\n// object in `require.cache`. This allows users to delete from `require.cache`\n// to trigger a re-load (and re-run of the hook's `onrequire`) of a module the\n// next time it is required.\n// https://nodejs.org/docs/latest/api/all.html#all_modules_requirecache\n//\n// In some special cases -- e.g. some other `require()` hook swapping out\n// `Module._cache` like `@babel/register` -- a non-core module won't be in\n// `require.cache`. In that case this falls back to caching on the internal Map.\nclass ExportsCache {\n  constructor () {\n    this._localCache = new Map() // <module filename or id> -> <exports>\n    this._kRitmExports = Symbol('RitmExports')\n  }\n\n  has (filename, isBuiltin) {\n    if (this._localCache.has(filename)) {\n      return true\n    } else if (!isBuiltin) {\n      const mod = __webpack_require__.c[filename]\n      return !!(mod && this._kRitmExports in mod)\n    } else {\n      return false\n    }\n  }\n\n  get (filename, isBuiltin) {\n    const cachedExports = this._localCache.get(filename)\n    if (cachedExports !== undefined) {\n      return cachedExports\n    } else if (!isBuiltin) {\n      const mod = __webpack_require__.c[filename]\n      return (mod && mod[this._kRitmExports])\n    }\n  }\n\n  set (filename, exports, isBuiltin) {\n    if (isBuiltin) {\n      this._localCache.set(filename, exports)\n    } else if (filename in __webpack_require__.c) {\n      __webpack_require__.c[filename][this._kRitmExports] = exports\n    } else {\n      debug('non-core module is unexpectedly not in require.cache: \"%s\"', filename)\n      this._localCache.set(filename, exports)\n    }\n  }\n}\n\nfunction Hook (modules, options, onrequire) {\n  if ((this instanceof Hook) === false) return new Hook(modules, options, onrequire)\n  if (typeof modules === 'function') {\n    onrequire = modules\n    modules = null\n    options = null\n  } else if (typeof options === 'function') {\n    onrequire = options\n    options = null\n  }\n\n  if (typeof Module._resolveFilename !== 'function') {\n    console.error('Error: Expected Module._resolveFilename to be a function (was: %s) - aborting!', typeof Module._resolveFilename)\n    console.error('Please report this error as an issue related to Node.js %s at %s', process.version, (__webpack_require__(/*! ./package.json */ \"(instrument)/./node_modules/require-in-the-middle/package.json\").bugs.url))\n    return\n  }\n\n  this._cache = new ExportsCache()\n\n  this._unhooked = false\n  this._origRequire = Module.prototype.require\n\n  const self = this\n  const patching = new Set()\n  const internals = options ? options.internals === true : false\n  const hasWhitelist = Array.isArray(modules)\n\n  debug('registering require hook')\n\n  this._require = Module.prototype.require = function (id) {\n    if (self._unhooked === true) {\n      // if the patched require function could not be removed because\n      // someone else patched it after it was patched here, we just\n      // abort and pass the request onwards to the original require\n      debug('ignoring require call - module is soft-unhooked')\n      return self._origRequire.apply(this, arguments)\n    }\n\n    const core = isCore(id)\n    let filename // the string used for caching\n    if (core) {\n      filename = id\n      // If this is a builtin module that can be identified both as 'foo' and\n      // 'node:foo', then prefer 'foo' as the caching key.\n      if (id.startsWith('node:')) {\n        const idWithoutPrefix = id.slice(5)\n        if (isCore(idWithoutPrefix)) {\n          filename = idWithoutPrefix\n        }\n      }\n    } else {\n      try {\n        filename = Module._resolveFilename(id, this)\n      } catch (resolveErr) {\n        // If someone *else* monkey-patches before this monkey-patch, then that\n        // code might expect `require(someId)` to get through so it can be\n        // handled, even if `someId` cannot be resolved to a filename. In this\n        // case, instead of throwing we defer to the underlying `require`.\n        //\n        // For example the Azure Functions Node.js worker module does this,\n        // where `@azure/functions-core` resolves to an internal object.\n        // https://github.com/Azure/azure-functions-nodejs-worker/blob/v3.5.2/src/setupCoreModule.ts#L46-L54\n        debug('Module._resolveFilename(\"%s\") threw %j, calling original Module.require', id, resolveErr.message)\n        return self._origRequire.apply(this, arguments)\n      }\n    }\n\n    let moduleName, basedir\n\n    debug('processing %s module require(\\'%s\\'): %s', core === true ? 'core' : 'non-core', id, filename)\n\n    // return known patched modules immediately\n    if (self._cache.has(filename, core) === true) {\n      debug('returning already patched cached module: %s', filename)\n      return self._cache.get(filename, core)\n    }\n\n    // Check if this module has a patcher in-progress already.\n    // Otherwise, mark this module as patching in-progress.\n    const isPatching = patching.has(filename)\n    if (isPatching === false) {\n      patching.add(filename)\n    }\n\n    const exports = self._origRequire.apply(this, arguments)\n\n    // If it's already patched, just return it as-is.\n    if (isPatching === true) {\n      debug('module is in the process of being patched already - ignoring: %s', filename)\n      return exports\n    }\n\n    // The module has already been loaded,\n    // so the patching mark can be cleaned up.\n    patching.delete(filename)\n\n    if (core === true) {\n      if (hasWhitelist === true && modules.includes(filename) === false) {\n        debug('ignoring core module not on whitelist: %s', filename)\n        return exports // abort if module name isn't on whitelist\n      }\n      moduleName = filename\n    } else if (hasWhitelist === true && modules.includes(filename)) {\n      // whitelist includes the absolute path to the file including extension\n      const parsedPath = path.parse(filename)\n      moduleName = parsedPath.name\n      basedir = parsedPath.dir\n    } else {\n      const stat = moduleDetailsFromPath(filename)\n      if (stat === undefined) {\n        debug('could not parse filename: %s', filename)\n        return exports // abort if filename could not be parsed\n      }\n      moduleName = stat.name\n      basedir = stat.basedir\n\n      // Ex: require('foo/lib/../bar.js')\n      // moduleName = 'foo'\n      // fullModuleName = 'foo/bar'\n      const fullModuleName = resolveModuleName(stat)\n\n      debug('resolved filename to module: %s (id: %s, resolved: %s, basedir: %s)', moduleName, id, fullModuleName, basedir)\n\n      let matchFound = false\n      if (hasWhitelist) {\n        if (!id.startsWith('.') && modules.includes(id)) {\n          // Not starting with '.' means `id` is identifying a module path,\n          // as opposed to a local file path. (Note: I'm not sure about\n          // absolute paths, but those are handled above.)\n          // If this `id` is in `modules`, then this could be a match to an\n          // package \"exports\" entry point that wouldn't otherwise match below.\n          moduleName = id\n          matchFound = true\n        }\n\n        // abort if module name isn't on whitelist\n        if (!modules.includes(moduleName) && !modules.includes(fullModuleName)) {\n          return exports\n        }\n\n        if (modules.includes(fullModuleName) && fullModuleName !== moduleName) {\n          // if we get to this point, it means that we're requiring a whitelisted sub-module\n          moduleName = fullModuleName\n          matchFound = true\n        }\n      }\n\n      if (!matchFound) {\n        // figure out if this is the main module file, or a file inside the module\n        let res\n        try {\n          res = resolve.sync(moduleName, { basedir })\n        } catch (e) {\n          debug('could not resolve module: %s', moduleName)\n          self._cache.set(filename, exports, core)\n          return exports // abort if module could not be resolved (e.g. no main in package.json and no index.js file)\n        }\n\n        if (res !== filename) {\n          // this is a module-internal file\n          if (internals === true) {\n            // use the module-relative path to the file, prefixed by original module name\n            moduleName = moduleName + path.sep + path.relative(basedir, filename)\n            debug('preparing to process require of internal file: %s', moduleName)\n          } else {\n            debug('ignoring require of non-main module file: %s', res)\n            self._cache.set(filename, exports, core)\n            return exports // abort if not main module file\n          }\n        }\n      }\n    }\n\n    // ensure that the cache entry is assigned a value before calling\n    // onrequire, in case calling onrequire requires the same module.\n    self._cache.set(filename, exports, core)\n    debug('calling require hook: %s', moduleName)\n    const patchedExports = onrequire(exports, moduleName, basedir)\n    self._cache.set(filename, patchedExports, core)\n\n    debug('returning module: %s', moduleName)\n    return patchedExports\n  }\n}\n\nHook.prototype.unhook = function () {\n  this._unhooked = true\n  if (this._require === Module.prototype.require) {\n    Module.prototype.require = this._origRequire\n    debug('unhook successful')\n  } else {\n    debug('unhook unsuccessful')\n  }\n}\n\nfunction resolveModuleName (stat) {\n  const normalizedPath = path.sep !== '/' ? stat.path.split(path.sep).join('/') : stat.path\n  return path.posix.join(stat.name, normalizedPath).replace(normalize, '')\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKGluc3RydW1lbnQpLy4vbm9kZV9tb2R1bGVzL3JlcXVpcmUtaW4tdGhlLW1pZGRsZS9pbmRleC5qcyIsIm1hcHBpbmdzIjoiQUFBWTs7QUFFWixhQUFhLG1CQUFPLENBQUMsa0JBQU07QUFDM0IsZUFBZSxtQkFBTyxDQUFDLHNCQUFRO0FBQy9CLGdCQUFnQixtQkFBTyxDQUFDLDZEQUFTO0FBQ2pDLGNBQWMsbUJBQU8sQ0FBQyw2REFBTztBQUM3Qiw4QkFBOEIsbUJBQU8sQ0FBQywrRkFBMEI7O0FBRWhFO0FBQ0E7QUFDQSxjQUFjLE9BQU87QUFDckI7QUFDQSxtQkFBbUI7O0FBRW5CO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsVUFBVTtBQUNWO0FBQ0E7QUFDQSx3QkFBd0I7QUFDeEI7QUFDQSxFQUFFO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSTtBQUNKO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLE1BQU07QUFDTixrQkFBa0IscUJBQWE7QUFDL0I7QUFDQSxNQUFNO0FBQ047QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBTTtBQUNOLGtCQUFrQixxQkFBYTtBQUMvQjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsTUFBTSxxQkFBcUIscUJBQWE7QUFDeEMsTUFBTSxxQkFBYTtBQUNuQixNQUFNO0FBQ047QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJO0FBQ0o7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSx1R0FBdUcsc0hBQWtDO0FBQ3pJO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQU07QUFDTjtBQUNBO0FBQ0EsUUFBUTtBQUNSO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFNO0FBQ047QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFNO0FBQ047QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSwyQ0FBMkMsU0FBUztBQUNwRCxVQUFVO0FBQ1Y7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsWUFBWTtBQUNaO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSTtBQUNKO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXMiOlsid2VicGFjazovL2JhbmstYXBwLy4vbm9kZV9tb2R1bGVzL3JlcXVpcmUtaW4tdGhlLW1pZGRsZS9pbmRleC5qcz8wODU0Il0sInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0J1xuXG5jb25zdCBwYXRoID0gcmVxdWlyZSgncGF0aCcpXG5jb25zdCBNb2R1bGUgPSByZXF1aXJlKCdtb2R1bGUnKVxuY29uc3QgcmVzb2x2ZSA9IHJlcXVpcmUoJ3Jlc29sdmUnKVxuY29uc3QgZGVidWcgPSByZXF1aXJlKCdkZWJ1ZycpKCdyZXF1aXJlLWluLXRoZS1taWRkbGUnKVxuY29uc3QgbW9kdWxlRGV0YWlsc0Zyb21QYXRoID0gcmVxdWlyZSgnbW9kdWxlLWRldGFpbHMtZnJvbS1wYXRoJylcblxuLy8gVXNpbmcgdGhlIGRlZmF1bHQgZXhwb3J0IGlzIGRpc2NvdXJhZ2VkLCBidXQga2VwdCBmb3IgYmFja3dhcmQgY29tcGF0aWJpbGl0eS5cbi8vIFVzZSB0aGlzIGluc3RlYWQ6XG4vLyAgICBjb25zdCB7IEhvb2sgfSA9IHJlcXVpcmUoJ3JlcXVpcmUtaW4tdGhlLW1pZGRsZScpXG5tb2R1bGUuZXhwb3J0cyA9IEhvb2tcbm1vZHVsZS5leHBvcnRzLkhvb2sgPSBIb29rXG5cbi8qKlxuICogSXMgdGhlIGdpdmVuIG1vZHVsZSBhIFwiY29yZVwiIG1vZHVsZT9cbiAqIGh0dHBzOi8vbm9kZWpzLm9yZy9hcGkvbW9kdWxlcy5odG1sI2NvcmUtbW9kdWxlc1xuICpcbiAqIEB0eXBlIHsobW9kdWxlTmFtZTogc3RyaW5nKSA9PiBib29sZWFufVxuICovXG5sZXQgaXNDb3JlXG5pZiAoTW9kdWxlLmlzQnVpbHRpbikgeyAvLyBBZGRlZCBpbiBub2RlIHYxOC42LjAsIHYxNi4xNy4wXG4gIGlzQ29yZSA9IE1vZHVsZS5pc0J1aWx0aW5cbn0gZWxzZSB7XG4gIGNvbnN0IFttYWpvciwgbWlub3JdID0gcHJvY2Vzcy52ZXJzaW9ucy5ub2RlLnNwbGl0KCcuJykubWFwKE51bWJlcilcbiAgaWYgKG1ham9yID09PSA4ICYmIG1pbm9yIDwgOCkge1xuICAgIC8vIEZvciBub2RlIHZlcnNpb25zIGBbOC4wLCA4LjgpYCB0aGUgXCJodHRwMlwiIG1vZHVsZSB3YXMgYnVpbHQtaW4gYnV0XG4gICAgLy8gYmVoaW5kIHRoZSBgLS1leHBvc2UtaHR0cDJgIGZsYWcuIGByZXNvbHZlYCBvbmx5IGNvbnNpZGVycyB1bmZsYWdnZWRcbiAgICAvLyBtb2R1bGVzIHRvIGJlIGNvcmU6IGh0dHBzOi8vZ2l0aHViLmNvbS9icm93c2VyaWZ5L3Jlc29sdmUvaXNzdWVzLzEzOVxuICAgIC8vIEhvd2V2ZXIsIGZvciBgRXhwb3J0c0NhY2hlYCB0byB3b3JrIGZvciBcImh0dHAyXCIgd2UgbmVlZCBpdCB0byBiZVxuICAgIC8vIGNvbnNpZGVyZWQgY29yZS5cbiAgICBpc0NvcmUgPSBtb2R1bGVOYW1lID0+IHtcbiAgICAgIGlmIChtb2R1bGVOYW1lID09PSAnaHR0cDInKSB7XG4gICAgICAgIHJldHVybiB0cnVlXG4gICAgICB9XG4gICAgICAvLyBQcmVmZXIgYHJlc29sdmUuY29yZWAgbG9va3VwIHRvIGByZXNvbHZlLmlzQ29yZShtb2R1bGVOYW1lKWAgYmVjYXVzZVxuICAgICAgLy8gdGhlIGxhdHRlciBpcyBkb2luZyB2ZXJzaW9uIHJhbmdlIG1hdGNoZXMgZm9yIGV2ZXJ5IGNhbGwuXG4gICAgICByZXR1cm4gISFyZXNvbHZlLmNvcmVbbW9kdWxlTmFtZV1cbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgaXNDb3JlID0gbW9kdWxlTmFtZSA9PiB7XG4gICAgICAvLyBQcmVmZXIgYHJlc29sdmUuY29yZWAgbG9va3VwIHRvIGByZXNvbHZlLmlzQ29yZShtb2R1bGVOYW1lKWAgYmVjYXVzZVxuICAgICAgLy8gdGhlIGxhdHRlciBpcyBkb2luZyB2ZXJzaW9uIHJhbmdlIG1hdGNoZXMgZm9yIGV2ZXJ5IGNhbGwuXG4gICAgICByZXR1cm4gISFyZXNvbHZlLmNvcmVbbW9kdWxlTmFtZV1cbiAgICB9XG4gIH1cbn1cblxuLy8gJ2Zvby9iYXIuanMnIG9yICdmb28vYmFyL2luZGV4LmpzJyA9PiAnZm9vL2JhcidcbmNvbnN0IG5vcm1hbGl6ZSA9IC8oWy9cXFxcXWluZGV4KT8oXFwuanMpPyQvXG5cbi8vIENhY2hlIGBvbnJlcXVpcmVgLXBhdGNoZWQgZXhwb3J0cyBmb3IgbW9kdWxlcy5cbi8vXG4vLyBFeHBvcnRzIGZvciBidWlsdC1pbiAoYS5rLmEuIFwiY29yZVwiKSBtb2R1bGVzIGFyZSBzdG9yZWQgaW4gYW4gaW50ZXJuYWwgTWFwLlxuLy9cbi8vIEV4cG9ydHMgZm9yIG5vbi1jb3JlIG1vZHVsZXMgYXJlIHN0b3JlZCBvbiBhIHByaXZhdGUgZmllbGQgb24gdGhlIGBNb2R1bGVgXG4vLyBvYmplY3QgaW4gYHJlcXVpcmUuY2FjaGVgLiBUaGlzIGFsbG93cyB1c2VycyB0byBkZWxldGUgZnJvbSBgcmVxdWlyZS5jYWNoZWBcbi8vIHRvIHRyaWdnZXIgYSByZS1sb2FkIChhbmQgcmUtcnVuIG9mIHRoZSBob29rJ3MgYG9ucmVxdWlyZWApIG9mIGEgbW9kdWxlIHRoZVxuLy8gbmV4dCB0aW1lIGl0IGlzIHJlcXVpcmVkLlxuLy8gaHR0cHM6Ly9ub2RlanMub3JnL2RvY3MvbGF0ZXN0L2FwaS9hbGwuaHRtbCNhbGxfbW9kdWxlc19yZXF1aXJlY2FjaGVcbi8vXG4vLyBJbiBzb21lIHNwZWNpYWwgY2FzZXMgLS0gZS5nLiBzb21lIG90aGVyIGByZXF1aXJlKClgIGhvb2sgc3dhcHBpbmcgb3V0XG4vLyBgTW9kdWxlLl9jYWNoZWAgbGlrZSBgQGJhYmVsL3JlZ2lzdGVyYCAtLSBhIG5vbi1jb3JlIG1vZHVsZSB3b24ndCBiZSBpblxuLy8gYHJlcXVpcmUuY2FjaGVgLiBJbiB0aGF0IGNhc2UgdGhpcyBmYWxscyBiYWNrIHRvIGNhY2hpbmcgb24gdGhlIGludGVybmFsIE1hcC5cbmNsYXNzIEV4cG9ydHNDYWNoZSB7XG4gIGNvbnN0cnVjdG9yICgpIHtcbiAgICB0aGlzLl9sb2NhbENhY2hlID0gbmV3IE1hcCgpIC8vIDxtb2R1bGUgZmlsZW5hbWUgb3IgaWQ+IC0+IDxleHBvcnRzPlxuICAgIHRoaXMuX2tSaXRtRXhwb3J0cyA9IFN5bWJvbCgnUml0bUV4cG9ydHMnKVxuICB9XG5cbiAgaGFzIChmaWxlbmFtZSwgaXNCdWlsdGluKSB7XG4gICAgaWYgKHRoaXMuX2xvY2FsQ2FjaGUuaGFzKGZpbGVuYW1lKSkge1xuICAgICAgcmV0dXJuIHRydWVcbiAgICB9IGVsc2UgaWYgKCFpc0J1aWx0aW4pIHtcbiAgICAgIGNvbnN0IG1vZCA9IHJlcXVpcmUuY2FjaGVbZmlsZW5hbWVdXG4gICAgICByZXR1cm4gISEobW9kICYmIHRoaXMuX2tSaXRtRXhwb3J0cyBpbiBtb2QpXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cbiAgfVxuXG4gIGdldCAoZmlsZW5hbWUsIGlzQnVpbHRpbikge1xuICAgIGNvbnN0IGNhY2hlZEV4cG9ydHMgPSB0aGlzLl9sb2NhbENhY2hlLmdldChmaWxlbmFtZSlcbiAgICBpZiAoY2FjaGVkRXhwb3J0cyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gY2FjaGVkRXhwb3J0c1xuICAgIH0gZWxzZSBpZiAoIWlzQnVpbHRpbikge1xuICAgICAgY29uc3QgbW9kID0gcmVxdWlyZS5jYWNoZVtmaWxlbmFtZV1cbiAgICAgIHJldHVybiAobW9kICYmIG1vZFt0aGlzLl9rUml0bUV4cG9ydHNdKVxuICAgIH1cbiAgfVxuXG4gIHNldCAoZmlsZW5hbWUsIGV4cG9ydHMsIGlzQnVpbHRpbikge1xuICAgIGlmIChpc0J1aWx0aW4pIHtcbiAgICAgIHRoaXMuX2xvY2FsQ2FjaGUuc2V0KGZpbGVuYW1lLCBleHBvcnRzKVxuICAgIH0gZWxzZSBpZiAoZmlsZW5hbWUgaW4gcmVxdWlyZS5jYWNoZSkge1xuICAgICAgcmVxdWlyZS5jYWNoZVtmaWxlbmFtZV1bdGhpcy5fa1JpdG1FeHBvcnRzXSA9IGV4cG9ydHNcbiAgICB9IGVsc2Uge1xuICAgICAgZGVidWcoJ25vbi1jb3JlIG1vZHVsZSBpcyB1bmV4cGVjdGVkbHkgbm90IGluIHJlcXVpcmUuY2FjaGU6IFwiJXNcIicsIGZpbGVuYW1lKVxuICAgICAgdGhpcy5fbG9jYWxDYWNoZS5zZXQoZmlsZW5hbWUsIGV4cG9ydHMpXG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIEhvb2sgKG1vZHVsZXMsIG9wdGlvbnMsIG9ucmVxdWlyZSkge1xuICBpZiAoKHRoaXMgaW5zdGFuY2VvZiBIb29rKSA9PT0gZmFsc2UpIHJldHVybiBuZXcgSG9vayhtb2R1bGVzLCBvcHRpb25zLCBvbnJlcXVpcmUpXG4gIGlmICh0eXBlb2YgbW9kdWxlcyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIG9ucmVxdWlyZSA9IG1vZHVsZXNcbiAgICBtb2R1bGVzID0gbnVsbFxuICAgIG9wdGlvbnMgPSBudWxsXG4gIH0gZWxzZSBpZiAodHlwZW9mIG9wdGlvbnMgPT09ICdmdW5jdGlvbicpIHtcbiAgICBvbnJlcXVpcmUgPSBvcHRpb25zXG4gICAgb3B0aW9ucyA9IG51bGxcbiAgfVxuXG4gIGlmICh0eXBlb2YgTW9kdWxlLl9yZXNvbHZlRmlsZW5hbWUgIT09ICdmdW5jdGlvbicpIHtcbiAgICBjb25zb2xlLmVycm9yKCdFcnJvcjogRXhwZWN0ZWQgTW9kdWxlLl9yZXNvbHZlRmlsZW5hbWUgdG8gYmUgYSBmdW5jdGlvbiAod2FzOiAlcykgLSBhYm9ydGluZyEnLCB0eXBlb2YgTW9kdWxlLl9yZXNvbHZlRmlsZW5hbWUpXG4gICAgY29uc29sZS5lcnJvcignUGxlYXNlIHJlcG9ydCB0aGlzIGVycm9yIGFzIGFuIGlzc3VlIHJlbGF0ZWQgdG8gTm9kZS5qcyAlcyBhdCAlcycsIHByb2Nlc3MudmVyc2lvbiwgcmVxdWlyZSgnLi9wYWNrYWdlLmpzb24nKS5idWdzLnVybClcbiAgICByZXR1cm5cbiAgfVxuXG4gIHRoaXMuX2NhY2hlID0gbmV3IEV4cG9ydHNDYWNoZSgpXG5cbiAgdGhpcy5fdW5ob29rZWQgPSBmYWxzZVxuICB0aGlzLl9vcmlnUmVxdWlyZSA9IE1vZHVsZS5wcm90b3R5cGUucmVxdWlyZVxuXG4gIGNvbnN0IHNlbGYgPSB0aGlzXG4gIGNvbnN0IHBhdGNoaW5nID0gbmV3IFNldCgpXG4gIGNvbnN0IGludGVybmFscyA9IG9wdGlvbnMgPyBvcHRpb25zLmludGVybmFscyA9PT0gdHJ1ZSA6IGZhbHNlXG4gIGNvbnN0IGhhc1doaXRlbGlzdCA9IEFycmF5LmlzQXJyYXkobW9kdWxlcylcblxuICBkZWJ1ZygncmVnaXN0ZXJpbmcgcmVxdWlyZSBob29rJylcblxuICB0aGlzLl9yZXF1aXJlID0gTW9kdWxlLnByb3RvdHlwZS5yZXF1aXJlID0gZnVuY3Rpb24gKGlkKSB7XG4gICAgaWYgKHNlbGYuX3VuaG9va2VkID09PSB0cnVlKSB7XG4gICAgICAvLyBpZiB0aGUgcGF0Y2hlZCByZXF1aXJlIGZ1bmN0aW9uIGNvdWxkIG5vdCBiZSByZW1vdmVkIGJlY2F1c2VcbiAgICAgIC8vIHNvbWVvbmUgZWxzZSBwYXRjaGVkIGl0IGFmdGVyIGl0IHdhcyBwYXRjaGVkIGhlcmUsIHdlIGp1c3RcbiAgICAgIC8vIGFib3J0IGFuZCBwYXNzIHRoZSByZXF1ZXN0IG9ud2FyZHMgdG8gdGhlIG9yaWdpbmFsIHJlcXVpcmVcbiAgICAgIGRlYnVnKCdpZ25vcmluZyByZXF1aXJlIGNhbGwgLSBtb2R1bGUgaXMgc29mdC11bmhvb2tlZCcpXG4gICAgICByZXR1cm4gc2VsZi5fb3JpZ1JlcXVpcmUuYXBwbHkodGhpcywgYXJndW1lbnRzKVxuICAgIH1cblxuICAgIGNvbnN0IGNvcmUgPSBpc0NvcmUoaWQpXG4gICAgbGV0IGZpbGVuYW1lIC8vIHRoZSBzdHJpbmcgdXNlZCBmb3IgY2FjaGluZ1xuICAgIGlmIChjb3JlKSB7XG4gICAgICBmaWxlbmFtZSA9IGlkXG4gICAgICAvLyBJZiB0aGlzIGlzIGEgYnVpbHRpbiBtb2R1bGUgdGhhdCBjYW4gYmUgaWRlbnRpZmllZCBib3RoIGFzICdmb28nIGFuZFxuICAgICAgLy8gJ25vZGU6Zm9vJywgdGhlbiBwcmVmZXIgJ2ZvbycgYXMgdGhlIGNhY2hpbmcga2V5LlxuICAgICAgaWYgKGlkLnN0YXJ0c1dpdGgoJ25vZGU6JykpIHtcbiAgICAgICAgY29uc3QgaWRXaXRob3V0UHJlZml4ID0gaWQuc2xpY2UoNSlcbiAgICAgICAgaWYgKGlzQ29yZShpZFdpdGhvdXRQcmVmaXgpKSB7XG4gICAgICAgICAgZmlsZW5hbWUgPSBpZFdpdGhvdXRQcmVmaXhcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0cnkge1xuICAgICAgICBmaWxlbmFtZSA9IE1vZHVsZS5fcmVzb2x2ZUZpbGVuYW1lKGlkLCB0aGlzKVxuICAgICAgfSBjYXRjaCAocmVzb2x2ZUVycikge1xuICAgICAgICAvLyBJZiBzb21lb25lICplbHNlKiBtb25rZXktcGF0Y2hlcyBiZWZvcmUgdGhpcyBtb25rZXktcGF0Y2gsIHRoZW4gdGhhdFxuICAgICAgICAvLyBjb2RlIG1pZ2h0IGV4cGVjdCBgcmVxdWlyZShzb21lSWQpYCB0byBnZXQgdGhyb3VnaCBzbyBpdCBjYW4gYmVcbiAgICAgICAgLy8gaGFuZGxlZCwgZXZlbiBpZiBgc29tZUlkYCBjYW5ub3QgYmUgcmVzb2x2ZWQgdG8gYSBmaWxlbmFtZS4gSW4gdGhpc1xuICAgICAgICAvLyBjYXNlLCBpbnN0ZWFkIG9mIHRocm93aW5nIHdlIGRlZmVyIHRvIHRoZSB1bmRlcmx5aW5nIGByZXF1aXJlYC5cbiAgICAgICAgLy9cbiAgICAgICAgLy8gRm9yIGV4YW1wbGUgdGhlIEF6dXJlIEZ1bmN0aW9ucyBOb2RlLmpzIHdvcmtlciBtb2R1bGUgZG9lcyB0aGlzLFxuICAgICAgICAvLyB3aGVyZSBgQGF6dXJlL2Z1bmN0aW9ucy1jb3JlYCByZXNvbHZlcyB0byBhbiBpbnRlcm5hbCBvYmplY3QuXG4gICAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9BenVyZS9henVyZS1mdW5jdGlvbnMtbm9kZWpzLXdvcmtlci9ibG9iL3YzLjUuMi9zcmMvc2V0dXBDb3JlTW9kdWxlLnRzI0w0Ni1MNTRcbiAgICAgICAgZGVidWcoJ01vZHVsZS5fcmVzb2x2ZUZpbGVuYW1lKFwiJXNcIikgdGhyZXcgJWosIGNhbGxpbmcgb3JpZ2luYWwgTW9kdWxlLnJlcXVpcmUnLCBpZCwgcmVzb2x2ZUVyci5tZXNzYWdlKVxuICAgICAgICByZXR1cm4gc2VsZi5fb3JpZ1JlcXVpcmUuYXBwbHkodGhpcywgYXJndW1lbnRzKVxuICAgICAgfVxuICAgIH1cblxuICAgIGxldCBtb2R1bGVOYW1lLCBiYXNlZGlyXG5cbiAgICBkZWJ1ZygncHJvY2Vzc2luZyAlcyBtb2R1bGUgcmVxdWlyZShcXCclc1xcJyk6ICVzJywgY29yZSA9PT0gdHJ1ZSA/ICdjb3JlJyA6ICdub24tY29yZScsIGlkLCBmaWxlbmFtZSlcblxuICAgIC8vIHJldHVybiBrbm93biBwYXRjaGVkIG1vZHVsZXMgaW1tZWRpYXRlbHlcbiAgICBpZiAoc2VsZi5fY2FjaGUuaGFzKGZpbGVuYW1lLCBjb3JlKSA9PT0gdHJ1ZSkge1xuICAgICAgZGVidWcoJ3JldHVybmluZyBhbHJlYWR5IHBhdGNoZWQgY2FjaGVkIG1vZHVsZTogJXMnLCBmaWxlbmFtZSlcbiAgICAgIHJldHVybiBzZWxmLl9jYWNoZS5nZXQoZmlsZW5hbWUsIGNvcmUpXG4gICAgfVxuXG4gICAgLy8gQ2hlY2sgaWYgdGhpcyBtb2R1bGUgaGFzIGEgcGF0Y2hlciBpbi1wcm9ncmVzcyBhbHJlYWR5LlxuICAgIC8vIE90aGVyd2lzZSwgbWFyayB0aGlzIG1vZHVsZSBhcyBwYXRjaGluZyBpbi1wcm9ncmVzcy5cbiAgICBjb25zdCBpc1BhdGNoaW5nID0gcGF0Y2hpbmcuaGFzKGZpbGVuYW1lKVxuICAgIGlmIChpc1BhdGNoaW5nID09PSBmYWxzZSkge1xuICAgICAgcGF0Y2hpbmcuYWRkKGZpbGVuYW1lKVxuICAgIH1cblxuICAgIGNvbnN0IGV4cG9ydHMgPSBzZWxmLl9vcmlnUmVxdWlyZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG5cbiAgICAvLyBJZiBpdCdzIGFscmVhZHkgcGF0Y2hlZCwganVzdCByZXR1cm4gaXQgYXMtaXMuXG4gICAgaWYgKGlzUGF0Y2hpbmcgPT09IHRydWUpIHtcbiAgICAgIGRlYnVnKCdtb2R1bGUgaXMgaW4gdGhlIHByb2Nlc3Mgb2YgYmVpbmcgcGF0Y2hlZCBhbHJlYWR5IC0gaWdub3Jpbmc6ICVzJywgZmlsZW5hbWUpXG4gICAgICByZXR1cm4gZXhwb3J0c1xuICAgIH1cblxuICAgIC8vIFRoZSBtb2R1bGUgaGFzIGFscmVhZHkgYmVlbiBsb2FkZWQsXG4gICAgLy8gc28gdGhlIHBhdGNoaW5nIG1hcmsgY2FuIGJlIGNsZWFuZWQgdXAuXG4gICAgcGF0Y2hpbmcuZGVsZXRlKGZpbGVuYW1lKVxuXG4gICAgaWYgKGNvcmUgPT09IHRydWUpIHtcbiAgICAgIGlmIChoYXNXaGl0ZWxpc3QgPT09IHRydWUgJiYgbW9kdWxlcy5pbmNsdWRlcyhmaWxlbmFtZSkgPT09IGZhbHNlKSB7XG4gICAgICAgIGRlYnVnKCdpZ25vcmluZyBjb3JlIG1vZHVsZSBub3Qgb24gd2hpdGVsaXN0OiAlcycsIGZpbGVuYW1lKVxuICAgICAgICByZXR1cm4gZXhwb3J0cyAvLyBhYm9ydCBpZiBtb2R1bGUgbmFtZSBpc24ndCBvbiB3aGl0ZWxpc3RcbiAgICAgIH1cbiAgICAgIG1vZHVsZU5hbWUgPSBmaWxlbmFtZVxuICAgIH0gZWxzZSBpZiAoaGFzV2hpdGVsaXN0ID09PSB0cnVlICYmIG1vZHVsZXMuaW5jbHVkZXMoZmlsZW5hbWUpKSB7XG4gICAgICAvLyB3aGl0ZWxpc3QgaW5jbHVkZXMgdGhlIGFic29sdXRlIHBhdGggdG8gdGhlIGZpbGUgaW5jbHVkaW5nIGV4dGVuc2lvblxuICAgICAgY29uc3QgcGFyc2VkUGF0aCA9IHBhdGgucGFyc2UoZmlsZW5hbWUpXG4gICAgICBtb2R1bGVOYW1lID0gcGFyc2VkUGF0aC5uYW1lXG4gICAgICBiYXNlZGlyID0gcGFyc2VkUGF0aC5kaXJcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3Qgc3RhdCA9IG1vZHVsZURldGFpbHNGcm9tUGF0aChmaWxlbmFtZSlcbiAgICAgIGlmIChzdGF0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgZGVidWcoJ2NvdWxkIG5vdCBwYXJzZSBmaWxlbmFtZTogJXMnLCBmaWxlbmFtZSlcbiAgICAgICAgcmV0dXJuIGV4cG9ydHMgLy8gYWJvcnQgaWYgZmlsZW5hbWUgY291bGQgbm90IGJlIHBhcnNlZFxuICAgICAgfVxuICAgICAgbW9kdWxlTmFtZSA9IHN0YXQubmFtZVxuICAgICAgYmFzZWRpciA9IHN0YXQuYmFzZWRpclxuXG4gICAgICAvLyBFeDogcmVxdWlyZSgnZm9vL2xpYi8uLi9iYXIuanMnKVxuICAgICAgLy8gbW9kdWxlTmFtZSA9ICdmb28nXG4gICAgICAvLyBmdWxsTW9kdWxlTmFtZSA9ICdmb28vYmFyJ1xuICAgICAgY29uc3QgZnVsbE1vZHVsZU5hbWUgPSByZXNvbHZlTW9kdWxlTmFtZShzdGF0KVxuXG4gICAgICBkZWJ1ZygncmVzb2x2ZWQgZmlsZW5hbWUgdG8gbW9kdWxlOiAlcyAoaWQ6ICVzLCByZXNvbHZlZDogJXMsIGJhc2VkaXI6ICVzKScsIG1vZHVsZU5hbWUsIGlkLCBmdWxsTW9kdWxlTmFtZSwgYmFzZWRpcilcblxuICAgICAgbGV0IG1hdGNoRm91bmQgPSBmYWxzZVxuICAgICAgaWYgKGhhc1doaXRlbGlzdCkge1xuICAgICAgICBpZiAoIWlkLnN0YXJ0c1dpdGgoJy4nKSAmJiBtb2R1bGVzLmluY2x1ZGVzKGlkKSkge1xuICAgICAgICAgIC8vIE5vdCBzdGFydGluZyB3aXRoICcuJyBtZWFucyBgaWRgIGlzIGlkZW50aWZ5aW5nIGEgbW9kdWxlIHBhdGgsXG4gICAgICAgICAgLy8gYXMgb3Bwb3NlZCB0byBhIGxvY2FsIGZpbGUgcGF0aC4gKE5vdGU6IEknbSBub3Qgc3VyZSBhYm91dFxuICAgICAgICAgIC8vIGFic29sdXRlIHBhdGhzLCBidXQgdGhvc2UgYXJlIGhhbmRsZWQgYWJvdmUuKVxuICAgICAgICAgIC8vIElmIHRoaXMgYGlkYCBpcyBpbiBgbW9kdWxlc2AsIHRoZW4gdGhpcyBjb3VsZCBiZSBhIG1hdGNoIHRvIGFuXG4gICAgICAgICAgLy8gcGFja2FnZSBcImV4cG9ydHNcIiBlbnRyeSBwb2ludCB0aGF0IHdvdWxkbid0IG90aGVyd2lzZSBtYXRjaCBiZWxvdy5cbiAgICAgICAgICBtb2R1bGVOYW1lID0gaWRcbiAgICAgICAgICBtYXRjaEZvdW5kID0gdHJ1ZVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gYWJvcnQgaWYgbW9kdWxlIG5hbWUgaXNuJ3Qgb24gd2hpdGVsaXN0XG4gICAgICAgIGlmICghbW9kdWxlcy5pbmNsdWRlcyhtb2R1bGVOYW1lKSAmJiAhbW9kdWxlcy5pbmNsdWRlcyhmdWxsTW9kdWxlTmFtZSkpIHtcbiAgICAgICAgICByZXR1cm4gZXhwb3J0c1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG1vZHVsZXMuaW5jbHVkZXMoZnVsbE1vZHVsZU5hbWUpICYmIGZ1bGxNb2R1bGVOYW1lICE9PSBtb2R1bGVOYW1lKSB7XG4gICAgICAgICAgLy8gaWYgd2UgZ2V0IHRvIHRoaXMgcG9pbnQsIGl0IG1lYW5zIHRoYXQgd2UncmUgcmVxdWlyaW5nIGEgd2hpdGVsaXN0ZWQgc3ViLW1vZHVsZVxuICAgICAgICAgIG1vZHVsZU5hbWUgPSBmdWxsTW9kdWxlTmFtZVxuICAgICAgICAgIG1hdGNoRm91bmQgPSB0cnVlXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKCFtYXRjaEZvdW5kKSB7XG4gICAgICAgIC8vIGZpZ3VyZSBvdXQgaWYgdGhpcyBpcyB0aGUgbWFpbiBtb2R1bGUgZmlsZSwgb3IgYSBmaWxlIGluc2lkZSB0aGUgbW9kdWxlXG4gICAgICAgIGxldCByZXNcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICByZXMgPSByZXNvbHZlLnN5bmMobW9kdWxlTmFtZSwgeyBiYXNlZGlyIH0pXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICBkZWJ1ZygnY291bGQgbm90IHJlc29sdmUgbW9kdWxlOiAlcycsIG1vZHVsZU5hbWUpXG4gICAgICAgICAgc2VsZi5fY2FjaGUuc2V0KGZpbGVuYW1lLCBleHBvcnRzLCBjb3JlKVxuICAgICAgICAgIHJldHVybiBleHBvcnRzIC8vIGFib3J0IGlmIG1vZHVsZSBjb3VsZCBub3QgYmUgcmVzb2x2ZWQgKGUuZy4gbm8gbWFpbiBpbiBwYWNrYWdlLmpzb24gYW5kIG5vIGluZGV4LmpzIGZpbGUpXG4gICAgICAgIH1cblxuICAgICAgICBpZiAocmVzICE9PSBmaWxlbmFtZSkge1xuICAgICAgICAgIC8vIHRoaXMgaXMgYSBtb2R1bGUtaW50ZXJuYWwgZmlsZVxuICAgICAgICAgIGlmIChpbnRlcm5hbHMgPT09IHRydWUpIHtcbiAgICAgICAgICAgIC8vIHVzZSB0aGUgbW9kdWxlLXJlbGF0aXZlIHBhdGggdG8gdGhlIGZpbGUsIHByZWZpeGVkIGJ5IG9yaWdpbmFsIG1vZHVsZSBuYW1lXG4gICAgICAgICAgICBtb2R1bGVOYW1lID0gbW9kdWxlTmFtZSArIHBhdGguc2VwICsgcGF0aC5yZWxhdGl2ZShiYXNlZGlyLCBmaWxlbmFtZSlcbiAgICAgICAgICAgIGRlYnVnKCdwcmVwYXJpbmcgdG8gcHJvY2VzcyByZXF1aXJlIG9mIGludGVybmFsIGZpbGU6ICVzJywgbW9kdWxlTmFtZSlcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZGVidWcoJ2lnbm9yaW5nIHJlcXVpcmUgb2Ygbm9uLW1haW4gbW9kdWxlIGZpbGU6ICVzJywgcmVzKVxuICAgICAgICAgICAgc2VsZi5fY2FjaGUuc2V0KGZpbGVuYW1lLCBleHBvcnRzLCBjb3JlKVxuICAgICAgICAgICAgcmV0dXJuIGV4cG9ydHMgLy8gYWJvcnQgaWYgbm90IG1haW4gbW9kdWxlIGZpbGVcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBlbnN1cmUgdGhhdCB0aGUgY2FjaGUgZW50cnkgaXMgYXNzaWduZWQgYSB2YWx1ZSBiZWZvcmUgY2FsbGluZ1xuICAgIC8vIG9ucmVxdWlyZSwgaW4gY2FzZSBjYWxsaW5nIG9ucmVxdWlyZSByZXF1aXJlcyB0aGUgc2FtZSBtb2R1bGUuXG4gICAgc2VsZi5fY2FjaGUuc2V0KGZpbGVuYW1lLCBleHBvcnRzLCBjb3JlKVxuICAgIGRlYnVnKCdjYWxsaW5nIHJlcXVpcmUgaG9vazogJXMnLCBtb2R1bGVOYW1lKVxuICAgIGNvbnN0IHBhdGNoZWRFeHBvcnRzID0gb25yZXF1aXJlKGV4cG9ydHMsIG1vZHVsZU5hbWUsIGJhc2VkaXIpXG4gICAgc2VsZi5fY2FjaGUuc2V0KGZpbGVuYW1lLCBwYXRjaGVkRXhwb3J0cywgY29yZSlcblxuICAgIGRlYnVnKCdyZXR1cm5pbmcgbW9kdWxlOiAlcycsIG1vZHVsZU5hbWUpXG4gICAgcmV0dXJuIHBhdGNoZWRFeHBvcnRzXG4gIH1cbn1cblxuSG9vay5wcm90b3R5cGUudW5ob29rID0gZnVuY3Rpb24gKCkge1xuICB0aGlzLl91bmhvb2tlZCA9IHRydWVcbiAgaWYgKHRoaXMuX3JlcXVpcmUgPT09IE1vZHVsZS5wcm90b3R5cGUucmVxdWlyZSkge1xuICAgIE1vZHVsZS5wcm90b3R5cGUucmVxdWlyZSA9IHRoaXMuX29yaWdSZXF1aXJlXG4gICAgZGVidWcoJ3VuaG9vayBzdWNjZXNzZnVsJylcbiAgfSBlbHNlIHtcbiAgICBkZWJ1ZygndW5ob29rIHVuc3VjY2Vzc2Z1bCcpXG4gIH1cbn1cblxuZnVuY3Rpb24gcmVzb2x2ZU1vZHVsZU5hbWUgKHN0YXQpIHtcbiAgY29uc3Qgbm9ybWFsaXplZFBhdGggPSBwYXRoLnNlcCAhPT0gJy8nID8gc3RhdC5wYXRoLnNwbGl0KHBhdGguc2VwKS5qb2luKCcvJykgOiBzdGF0LnBhdGhcbiAgcmV0dXJuIHBhdGgucG9zaXguam9pbihzdGF0Lm5hbWUsIG5vcm1hbGl6ZWRQYXRoKS5yZXBsYWNlKG5vcm1hbGl6ZSwgJycpXG59XG4iXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(instrument)/./node_modules/require-in-the-middle/index.js\n");

/***/ }),

/***/ "(instrument)/./node_modules/require-in-the-middle/package.json":
/*!*********************************************************!*\
  !*** ./node_modules/require-in-the-middle/package.json ***!
  \*********************************************************/
/***/ ((module) => {

module.exports = /*#__PURE__*/JSON.parse('{"name":"require-in-the-middle","version":"7.3.0","description":"Module to hook into the Node.js require function","main":"index.js","types":"types/index.d.ts","dependencies":{"debug":"^4.1.1","module-details-from-path":"^1.0.3","resolve":"^1.22.1"},"devDependencies":{"@babel/core":"^7.9.0","@babel/preset-env":"^7.9.5","@babel/preset-typescript":"^7.9.0","@babel/register":"^7.9.0","ipp-printer":"^1.0.0","patterns":"^1.0.3","roundround":"^0.2.0","semver":"^6.3.0","standard":"^14.3.1","tape":"^4.11.0"},"scripts":{"test":"npm run test:lint && npm run test:tape && npm run test:babel","test:lint":"standard","test:tape":"tape test/*.js","test:babel":"node test/babel/babel-register.js"},"repository":{"type":"git","url":"git+https://github.com/elastic/require-in-the-middle.git"},"keywords":["require","hook","shim","shimmer","shimming","patch","monkey","monkeypatch","module","load"],"files":["types"],"author":"Thomas Watson Steen <w@tson.dk> (https://twitter.com/wa7son)","license":"MIT","bugs":{"url":"https://github.com/elastic/require-in-the-middle/issues"},"homepage":"https://github.com/elastic/require-in-the-middle#readme","engines":{"node":">=8.6.0"}}');

/***/ })

};
;