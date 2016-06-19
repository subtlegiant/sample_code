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
process.env.NODE_ENV = 'development';
var utils = require('./utils');
var config = require('../app/config');
var baseUri = 'https://localhost:' + config.port + '/usnap';
var expect = require('chai').expect;  // chai is a javascript assertion library.
var chai = require('chai');
var chaiHttp = require('chai-http');
var should = chai.should();
var mongoose = require('mongoose');
var snapshotModel = require('../app/models/snapshot');
var configModel = require('../app/models/config');
var Snapshot = mongoose.model('Snapshot');
var Config = mongoose.model('Config');
var fs = require('fs');
var cert = fs.readFileSync('cert/cacert.pem');
var request = require('superagent');
var env = require('../app/env/' + process.env.NODE_ENV);


chai.use(chaiHttp);

describe('Test creating a configuration and getting it', function (done) {
  it('PUT a configuration, verify in the db, do a GET by name', function (done) {
    request
      .put('https://localhost:3000/usnap/api/' + env.server.version + '/config')
      .ca(cert)
      .send({
        'config_name': 'testConfig',
        'rf_input_num': 1,
        'input_center_freq': 155520000,
        'input_width': 12000
      })
      .end(function (error, response) {
        response.should.have.status(201);
        response.should.be.json;
        Config.findById(response.body.id, function (error, config) {
          expect(config.config_name).to.equal('testConfig');
          expect(config.rf_input_num).to.equal(1);
          expect(config.input_center_freq).to.equal(155520000);
          expect(config.input_width).to.equal(12000);

          request
            .get('https://localhost:3000/usnap/api/' + env.server.version + '/config/name/' + config.config_name)
            .ca(cert)
            .end(function (error, response) {
              response.should.have.status(200);
              response.should.be.json;
              expect(response.body.config_name).to.equal('testConfig');
              expect(response.body.rf_input_num).to.equal(1);
              expect(response.body.input_center_freq).to.equal(155520000);
              expect(response.body.input_width).to.equal(12000);
              done();
            });
        });
      });
  });
});

describe('Test getting all configs', function (done) {
  it('PUT 2 configs, GET all verify response', function (done) {
    request
      .put('https://localhost:3000/usnap/api/' + env.server.version + '/config')
      .ca(cert)
      .send({
        'config_name': 'testConfig',
        'rf_input_num': 1,
        'input_center_freq': 155520000,
        'input_width': 12000
      })
      .end(function (error, response) {
        response.should.have.status(201);
        response.should.be.json;
        request
          .put('https://localhost:3000/usnap/api/' + env.server.version + '/config')
          .ca(cert)
          .send({
            'config_name': 'testConfig1',
            'rf_input_num': 0,
            'input_center_freq': 155520000,
            'input_width': 12000
          })
          .end(function (error, response) {
            response.should.have.status(201);
            response.should.be.json;

            request
              .get('https://localhost:3000/usnap/api/' + env.server.version + '/config')
              .ca(cert)
              .end(function (error, response) {
                response.should.have.status(200);
                response.should.be.json;
                expect(response.body.length).to.equal(2);
                expect(response.body[0].config_name).to.equal('testConfig');
                expect(response.body[1].config_name).to.equal('testConfig1');
                done();
              });
          });
      });
  });
});

describe('Test delete route', function (done) {
  it('PUT config, DELETE config by name', function (done) {
    request
      .put('https://localhost:3000/usnap/api/' + env.server.version + '/config')
      .ca(cert)
      .send({
        'config_name': 'testConfig',
        'rf_input_num': 1,
        'input_center_freq': 155520000,
        'input_width': 12000
      })
      .end(function (error, response) {
        response.should.have.status(201);
        response.should.be.json;
        request
          .delete('https://localhost:3000/usnap/api/' + env.server.version + '/config/' + response.body.id)
          .ca(cert)
          .end(function (error, response) {
            Config.findById(response.body.id, function (error, config) {
              expect(config).to.be.null;
              done();
            });
          });
      });
  });
});

describe('Test delete all route', function (done) {
  it('PUT 2 configs, DELETE all, verify that they have been removed', function (done) {
    request
      .put('https://localhost:3000/usnap/api/' + env.server.version + '/config')
      .ca(cert)
      .send({
        'config_name': 'testConfig',
        'rf_input_num': 1,
        'input_center_freq': 155520000,
        'input_width': 12000
      })
      .end(function (error, response) {
        response.should.have.status(201);
        response.should.be.json;
        request
          .put('https://localhost:3000/usnap/api/' + env.server.version + '/config')
          .ca(cert)
          .send({
            'config_name': 'testConfig1',
            'rf_input_num': 0,
            'input_center_freq': 155520000,
            'input_width': 12000
          })
          .end(function (error, response) {
            response.should.have.status(201);
            response.should.be.json;
            request
              .delete('https://localhost:3000/usnap/api/' + env.server.version + '/config')
              .ca(cert)
              .end(function (error, response) {
                response.should.have.status(204);
                Config.find({}, function (error, configs) {
                  expect(configs.length).to.equal(0);
                  done();
                });
              });
          });
      });
  });
});

describe('Tests creating and updating a config by name', function (done) {
  it('PUTs a config then PUTs by name, GETs config to verify update', function (done) {
    var date = Date.now();
    request
      .put('https://localhost:3000/usnap/api/' + env.server.version + '/config')
      .ca(cert)
      .send({
        'config_name': 'testcfg',
        'rf_input_num': 1,
        'input_center_freq': 155520000,
        'input_width': 12000
      })
      .end(function (error, response) {
        response.should.have.status(201);
        response.should.be.json;
        request
          .put('https://localhost:3000/usnap/api/' + env.server.version + '/config/name/testcfg')
          .ca(cert)
          .send({
            'rf_input_num': 0
          })
          .end(function (error, response) {
            response.should.have.status(200);
            request
              .get('https://localhost:3000/usnap/api/' + env.server.version + '/config/name/testcfg')
              .ca(cert)
              .end(function (error, response) {
                response.should.have.status(200);
                response.should.be.json;
                expect(response.body.config_name).to.equal('testcfg');
                expect(response.body.rf_input_num).to.equal(0);
                done();
              });
          });
      });
  });
});

describe('Tests creating and updating a config by id', function (done) {
  it('PUTs a config then PUTs by name, GETs config to verify update', function (done) {
    var date = Date.now();
    var id;
    request
      .put('https://localhost:3000/usnap/api/' + env.server.version + '/config')
      .ca(cert)
      .send({
        'config_name': 'testcfg',
        'rf_input_num': 1,
        'input_center_freq': 155520000,
        'input_width': 12000
      })
      .end(function (error, response) {
        response.should.have.status(201);
        response.should.be.json;
        id = response.body.id;
        request
          .put('https://localhost:3000/usnap/api/' + env.server.version + '/config/' + id)
          .ca(cert)
          .send({
            'input_width': 12001
          })
          .end(function (error, response) {
            response.should.have.status(200);
            request
              .get('https://localhost:3000/usnap/api' + env.server.version + '/config/' + id)
              .ca(cert)
              .end(function (error, response) {
                response.should.have.status(200);
                response.should.be.json;
                expect(response.body.config_name).to.equal('testcfg');
                expect(response.body.input_width).to.equal(12001);
                done();
              });
          });
      });
  });
});
