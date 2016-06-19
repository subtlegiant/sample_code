/*
 * Copyright (c) 2015 Engineering Design Team (EDT), Inc.
 * All rights reserved.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS ``AS IS'' AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED.  IN NO EVENT SHALL THE AUTHOR OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS
 * OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
 * HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
 * LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY
 * OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF
 * SUCH DAMAGE.
 *
 * This file is subject to the terms and conditions of the EULA defined at
 * www.edt.com/terms-of-use
 *
 * Author: <Cameron Kidd>
 * Email: <cameron@edt.com>
 */
'use strict';

/**
 * Contains all of the global configuration
 * parameters.
 */

var _ = require('lodash'),
  glob = require('glob'),
  fs = require('fs'),
  path = require('path'),
  env = require('./env/' + process.env.NODE_ENV);

/**
 * Get files by glob patterns
 */
var getGlobbedPaths = function (globPatterns, excludes) {
  // URL paths regex
  var urlRegex = new RegExp('^(?:[a-z]+:)?\/\/', 'i');

  // The output array
  var output = [];

  // If glob pattern is array then we use each pattern in a recursive way, otherwise we use glob
  if (_.isArray(globPatterns)) {
    globPatterns.forEach(function (globPattern) {
      output = _.union(output, getGlobbedPaths(globPattern, excludes));
    });
  } else if (_.isString(globPatterns)) {
    if (urlRegex.test(globPatterns)) {
      output.push(globPatterns);
    } else {
      var files = glob.sync(globPatterns);
      if (excludes) {
        files = files.map(function (file) {
          if (_.isArray(excludes)) {
            for (var i in excludes) {
              file = file.replace(excludes[i], '');
            }
          } else {
            file = file.replace(excludes, '');
          }
          return file;
        });
      }
      output = _.union(output, files);
    }
  }

  return output;
};

/**
 * Validate NODE_ENV existence
 */
var validateEnvironmentVariable = function () {
  var environmentFiles = glob.sync('./config/env/' + process.env.NODE_ENV + '.js');
  console.log();
  if (!environmentFiles.length) {
    if (process.env.NODE_ENV) {
      console.error('+ Error: No configuration file found for "' + process.env.NODE_ENV + '" environment using development instead');
    } else {
      console.error('+ Error: NODE_ENV is not defined! Using default development environment');
    }
    process.env.NODE_ENV = 'development';
  }
};

// Add any file assets to the config container.
var initGlobalConfigFiles = function (config, assets) {
  config.files = {
    server: {}
  };

  config.files.server.models = getGlobbedPaths(assets.server.models);
  config.files.server.routes = getGlobbedPaths(assets.server.routes);
};

/**
 * Initialized configuration, set server port
 * and Mongo DB URI here.
 */
var initGlobalConfig = function () {

  var assets = require(path.join(process.cwd(), 'app/assets/default'));
  var config = {
    port: 3000, // set the server port
    db: env.db.uri
  };

  initGlobalConfigFiles(config, assets);

  return config;
};

module.exports = initGlobalConfig();
