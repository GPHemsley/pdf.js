/* -*- Mode: JavaScript; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */
/* Copyright 2012 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/* globals BasePdfManager, ChunkedStream, ChunkedStreamManager,
           NotImplementedException, MissingDataException, PDFDocument,
           Promise, Stream, TIFFDocument */

'use strict';

var LocalTiffManager = (function LocalTiffManagerClosure() {
  function LocalTiffManager(data) {
    var stream = new Stream(data);

    // XXX: This should actually be in Stream().
    stream.getByteRange = function Stream_getByteRange(start, end) {
      return this.bytes.subarray(start, end);
    };

    this.pdfModel = new TIFFDocument(this, stream);
    this.loadedStream = new Promise();
    this.loadedStream.resolve(stream);
  }

  LocalTiffManager.prototype = Object.create(BasePdfManager.prototype);
  LocalTiffManager.prototype.constructor = LocalTiffManager;

  LocalTiffManager.prototype.ensure =
      function LocalTiffManager_ensure(obj, prop, args) {
    var promise = new Promise();
    try {
      var value = obj[prop];
      var result;
      if (typeof(value) === 'function') {
        result = value.apply(obj, args);
      } else {
        result = value;
      }
      promise.resolve(result);
    } catch (e) {
      console.log(e.stack);
      promise.reject(e);
    }
    return promise;
  };

  LocalTiffManager.prototype.requestRange =
      function LocalTiffManager_requestRange(begin, end) {
    var promise = new Promise();
    promise.resolve();
    return promise;
  };

  LocalTiffManager.prototype.requestLoadedStream =
      function LocalTiffManager_requestLoadedStream() {
  };

  LocalTiffManager.prototype.onLoadedStream =
      function LocalTiffManager_getLoadedStream() {
    return this.loadedStream;
  };

  return LocalTiffManager;
})();

var NetworkTiffManager = (function NetworkTiffManagerClosure() {

  var CHUNK_SIZE = 65536;

  function NetworkTiffManager(args, msgHandler) {
    this.msgHandler = msgHandler;

    var params = {
      msgHandler: msgHandler,
      httpHeaders: args.httpHeaders,
      chunkedViewerLoading: args.chunkedViewerLoading,
      disableAutoFetch: args.disableAutoFetch
    };
    this.streamManager = new ChunkedStreamManager(args.length, CHUNK_SIZE,
                                                  args.url, params);

    this.pdfModel = new TIFFDocument(this, this.streamManager.getStream());
  }

  NetworkTiffManager.prototype = Object.create(BasePdfManager.prototype);
  NetworkTiffManager.prototype.constructor = NetworkTiffManager;

  NetworkTiffManager.prototype.ensure =
      function NetworkTiffManager_ensure(obj, prop, args) {
    var promise = new Promise();
    this.ensureHelper(promise, obj, prop, args);
    return promise;
  };

  NetworkTiffManager.prototype.ensureHelper =
      function NetworkTiffManager_ensureHelper(promise, obj, prop, args) {
    try {
      var result;
      var value = obj[prop];
      if (typeof(value) === 'function') {
        result = value.apply(obj, args);
      } else {
        result = value;
      }
      promise.resolve(result);
    } catch(e) {
      if (!(e instanceof MissingDataException)) {
        console.log(e.stack);
        promise.reject(e);
        return;
      }

      this.streamManager.requestRange(e.begin, e.end, function() {
        this.ensureHelper(promise, obj, prop, args);
      }.bind(this));
    }
  };

  NetworkTiffManager.prototype.requestRange =
      function NetworkTiffManager_requestRange(begin, end) {
    var promise = new Promise();
    this.streamManager.requestRange(begin, end, function() {
      promise.resolve();
    });
    return promise;
  };

  NetworkTiffManager.prototype.requestLoadedStream =
      function NetworkTiffManager_requestLoadedStream() {
    this.streamManager.requestAllChunks();
  };

  NetworkTiffManager.prototype.onLoadedStream =
      function NetworkTiffManager_getLoadedStream() {
    return this.streamManager.onLoadedStream();
  };

  return NetworkTiffManager;
})();
