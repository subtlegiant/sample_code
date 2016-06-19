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

var _ = require('lodash'),
  defaultAssets = require('./app/assets/default'),
  pem = require('pem'),
  fs = require('fs');


module.exports = function (grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    env: {
      dev: {
        NODE_ENV: 'development'
      },
      prod: {
        NODE_ENV: 'production'
      }
    },
    nodemon: {
      dev: {
        script: 'server.js',
        options: {
          nodeArgs: ['--debug'],
          ext: 'js,html',
          watch: _.union(defaultAssets.server.gruntConfig, defaultAssets.server.allJS)
        }
      }
    }
  });

  require('load-grunt-tasks')(grunt);

  grunt.loadNpmTasks('grunt-env');
  grunt.registerTask('default', ['env:dev', 'nodemon']);
  grunt.registerTask('prod', ['env:prod']);
  grunt.registerTask('create_cert', function () {
    this.async();
    pem.createCertificate({selfSigned: true}, function (err, keys) {
      fs.writeFile('cert/cacert.pem', keys.certificate, function () {
        if (err) {
          console.log('Error saving cert');
        }
      });

      fs.writeFile('cert/usnap_pub_key.pem', keys.clientKey, function () {
        if (err) {
          console.log('Error saving public key');
        }
      });
    });
  });
};