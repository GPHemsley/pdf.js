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

var TiffPdfManager = (function TiffPdfManagerClosure() {
  function TiffPdfManager(data) {
    var stream = new Stream(data);
    this.pdfModel = new TIFFDocument(this, stream);
    this.loadedStream = new Promise();
    this.loadedStream.resolve(stream);
  }

  TiffPdfManager.prototype = Object.create(BasePdfManager.prototype);
  TiffPdfManager.prototype.constructor = TiffPdfManager;

  TiffPdfManager.prototype.ensure =
      function TiffPdfManager_ensure(obj, prop, args) {
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

  TiffPdfManager.prototype.requestRange =
      function TiffPdfManager_requestRange(begin, end) {
    var promise = new Promise();
    promise.resolve();
    return promise;
  };

  TiffPdfManager.prototype.requestLoadedStream =
      function TiffPdfManager_requestLoadedStream() {
  };

  TiffPdfManager.prototype.onLoadedStream =
      function TiffPdfManager_getLoadedStream() {
    return this.loadedStream;
  };

  return TiffPdfManager;
})();
